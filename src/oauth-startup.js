#!/usr/bin/env node
import { google } from 'googleapis';
import { createServer } from 'http';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createServer as createNetServer } from 'net';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * OAuth 2.0 Startup Handler for Google Sheets MCP Server
 * Automatically initiates OAuth flow when needed on application startup
 */

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Default port, will be updated to first available port
const DEFAULT_PORT = 3000;

/**
 * Find an available port starting from the given port
 * @param {number} startPort - The port to start checking from
 * @returns {Promise<number>} - The first available port
 */
async function findAvailablePort(startPort = DEFAULT_PORT) {
  const maxPort = startPort + 5; // Check up to 5 ports
  
  for (let port = startPort; port <= maxPort; port++) {
    try {
      await new Promise((resolve, reject) => {
        const server = createNetServer();
        
        server.listen(port, () => {
          server.close();
          resolve();
        });
        
        server.on('error', () => {
          reject();
        });
      });
      
      return port;
    } catch (error) {
      // Port is in use, try next one
      continue;
    }
  }
  
  throw new Error(`No available ports found between ${startPort} and ${maxPort}`);
}

class OAuthStartup {
  constructor() {
    this.oauth2Client = null;
    this.server = null;
    this.resolveAuth = null;
    this.rejectAuth = null;
    this.port = null;
    this.redirectUri = null;
  }

  /**
   * Check if OAuth authentication is needed and handle it
   */
  async checkAndInitiateOAuth() {
    // Check if OAuth is configured
    if (!process.env.CREDENTIALS_PATH || !process.env.TOKEN_PATH) {
      return { needsOAuth: false, error: 'OAuth not configured' };
    }

    try {
      // Check if credentials file exists
      const credentialsPath = process.env.CREDENTIALS_PATH;
      let credentials;

      try {
        const credentialsData = await fs.readFile(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsData);
      } catch (error) {
        console.error('OAuth credentials file not found:', credentialsPath);
        return { needsOAuth: false, error: 'Credentials file not found' };
      }

      // Find available port for OAuth callback
      this.port = await findAvailablePort();
      this.redirectUri = `http://localhost:${this.port}/oauth2callback`;

      // Initialize OAuth2 client with dynamic redirect URI
      this.oauth2Client = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        this.redirectUri
      );

      // Check if token exists and is valid
      const tokenPath = process.env.TOKEN_PATH;
      try {
        const tokenData = await fs.readFile(tokenPath, 'utf8');
        const token = JSON.parse(tokenData);
        
        // Check if token is expired (with 5 minute buffer)
        if (token.expiry_date && token.expiry_date < Date.now() + 300000) {
          console.error('OAuth token is expired or will expire soon, initiating refresh...');
          return { needsOAuth: true, reason: 'token_expired' };
        } else {
          console.error('OAuth token is valid');
          return { needsOAuth: false };
        }
      } catch (error) {
        console.error('No OAuth token found, initiating OAuth flow...');
        return { needsOAuth: true, reason: 'no_token' };
      }

    } catch (error) {
      console.error('Error checking OAuth status:', error);
      return { needsOAuth: false, error: error.message };
    }
  }

  /**
   * Start the OAuth authorization flow
   */
  async startOAuthFlow() {
    return new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;

      // Generate authorization URL
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // Force consent to get refresh token
      });

      console.error('🔐 OAuth authentication required');
      console.error('🌐 Opening browser for Google authorization...');
      console.error(`📡 Starting local server to handle OAuth callback on port ${this.port}...`);

      // Start local server to handle callback
      this.server = createServer(async (req, res) => {
        await this.handleCallback(req, res);
      });

      this.server.listen(this.port, () => {
        console.error(`📡 OAuth server listening on http://localhost:${this.port}`);
        
        // Open browser
        import('child_process').then(({ exec }) => {
          exec(`open "${authUrl}"`, (error) => {
            if (error) {
              console.error('Please open this URL in your browser:');
              console.error(authUrl);
            }
          });
        });
      });
    });
  }

  /**
   * Handle the OAuth callback
   */
  async handleCallback(req, res) {
    try {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h1 style="color: red;">❌ Authorization Failed</h1>
              <p>Error: ${error}</p>
              <p>Please try again.</p>
            </body>
          </html>
        `);
        this.rejectAuth(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h1 style="color: red;">❌ No Authorization Code</h1>
              <p>No authorization code received.</p>
              <p>Please try again.</p>
            </body>
          </html>
        `);
        this.rejectAuth(new Error('No authorization code received'));
        return;
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Save tokens
      const tokenPath = process.env.TOKEN_PATH;
      await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));

      // Success response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0f8ff;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #28a745;">✅ Authorization Successful!</h1>
              <p>Your OAuth tokens have been saved.</p>
              <p>The MCP server will now continue starting up.</p>
              <p>You can close this window.</p>
            </div>
          </body>
        </html>
      `);

      console.error('✅ OAuth authorization successful!');
      console.error('💾 Tokens saved successfully');
      console.error('🚀 Continuing with MCP server startup...');

      this.resolveAuth();
      
      // Close server after a delay
      setTimeout(() => {
        this.server.close();
      }, 2000);

    } catch (error) {
      console.error('❌ Error handling OAuth callback:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: red;">❌ Setup Failed</h1>
            <p>Error: ${error.message}</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
      this.rejectAuth(error);
    }
  }

  /**
   * Refresh an expired token
   */
  async refreshToken(token) {
    try {
      this.oauth2Client.setCredentials(token);
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      const tokenPath = process.env.TOKEN_PATH;
      await fs.writeFile(tokenPath, JSON.stringify(credentials, null, 2));
      
      console.error('✅ OAuth token refreshed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh OAuth token:', error.message);
      return false;
    }
  }

  /**
   * Main method to handle OAuth startup
   */
  async handleStartupOAuth() {
    try {
      // Check if OAuth is needed
      const oauthStatus = await this.checkAndInitiateOAuth();
      
      if (!oauthStatus.needsOAuth) {
        if (oauthStatus.error) {
          console.error('OAuth startup check failed:', oauthStatus.error);
        }
        return { success: true, oauthCompleted: false };
      }

      console.error('🔐 OAuth authentication required for startup');
      
      if (oauthStatus.reason === 'token_expired') {
        // Try to refresh the token first
        try {
          const tokenData = await fs.readFile(process.env.TOKEN_PATH, 'utf8');
          const token = JSON.parse(tokenData);
          
          const refreshSuccess = await this.refreshToken(token);
          if (refreshSuccess) {
            return { success: true, oauthCompleted: true, method: 'refresh' };
          }
        } catch (refreshError) {
          console.error('Token refresh failed, starting new OAuth flow...');
        }
      }

      // Start new OAuth flow
      await this.startOAuthFlow();
      
      return { success: true, oauthCompleted: true, method: 'new_flow' };

    } catch (error) {
      console.error('❌ OAuth startup failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other modules
export { OAuthStartup };

// Main execution for standalone testing
async function main() {
  const startup = new OAuthStartup();
  const result = await startup.handleStartupOAuth();
  console.error('OAuth startup result:', result);
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ OAuth startup failed:', error.message);
    process.exit(1);
  });
} 