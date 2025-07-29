#!/usr/bin/env node
import { google } from 'googleapis';
import { createServer } from 'http';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * OAuth 2.0 Setup for Google Sheets MCP Server
 * Handles the complete OAuth flow for interactive authentication
 */

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const PORT = 3000;

class OAuthSetup {
  constructor() {
    this.oauth2Client = null;
    this.server = null;
    this.resolveAuth = null;
    this.rejectAuth = null;
  }

  /**
   * Start the OAuth setup process
   */
  async setup() {
    console.log('🔐 Google Sheets OAuth 2.0 Setup');
    console.log('=====================================\n');

    try {
      // Check if credentials file exists
      const credentialsPath = process.env.CREDENTIALS_PATH || 'credentials.json';
      let credentials;

      try {
        const credentialsData = await fs.readFile(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsData);
        console.log(`✅ Found credentials file: ${credentialsPath}`);
      } catch (error) {
        console.error(`❌ Credentials file not found: ${credentialsPath}`);
        console.log('\n📋 To set up OAuth 2.0 credentials:');
        console.log('1. Go to https://console.cloud.google.com/');
        console.log('2. Create a new project or select existing one');
        console.log('3. Enable Google Sheets API and Google Drive API');
        console.log('4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"');
        console.log('5. Choose "Web application"');
        console.log('6. Add redirect URI: http://localhost:3000/oauth2callback');
        console.log('7. Download the JSON file and save as "credentials.json"');
        console.log('\nThen run this script again.');
        process.exit(1);
      }

      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        REDIRECT_URI
      );

      // Check if token already exists
      const tokenPath = process.env.TOKEN_PATH || 'token.json';
      try {
        const tokenData = await fs.readFile(tokenPath, 'utf8');
        const token = JSON.parse(tokenData);
        
        // Check if token is expired
        if (token.expiry_date && token.expiry_date < Date.now()) {
          console.log('⚠️  Existing token is expired, refreshing...');
          await this.refreshToken(token);
        } else {
          console.log(`✅ Found valid token: ${tokenPath}`);
          console.log('Token expires:', new Date(token.expiry_date).toLocaleString());
          console.log('\nYou can now use the MCP server with OAuth authentication!');
          console.log('Run: npm run inspector');
          return;
        }
      } catch (error) {
        console.log('No existing token found, starting OAuth flow...\n');
        await this.startOAuthFlow();
      }

    } catch (error) {
      console.error('❌ OAuth setup failed:', error.message);
      process.exit(1);
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

      console.log('🌐 Starting OAuth flow...');
      console.log('1. Opening browser for Google authorization...');
      console.log('2. After authorization, you\'ll be redirected back here');
      console.log('3. The server will automatically save your token\n');

      // Start local server to handle callback
      this.server = createServer(async (req, res) => {
        await this.handleCallback(req, res);
      });

      this.server.listen(PORT, () => {
        console.log(`📡 Server listening on http://localhost:${PORT}`);
        console.log(`🔗 Authorization URL: ${authUrl}\n`);
        
               // Open browser
       import('child_process').then(({ exec }) => {
         exec(`open "${authUrl}"`, (error) => {
           if (error) {
             console.log('Please open this URL in your browser:');
             console.log(authUrl);
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
      const url = new URL(req.url, `http://localhost:${PORT}`);
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
      const tokenPath = process.env.TOKEN_PATH || 'token.json';
      await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));

      // Success response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0f8ff;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #28a745;">✅ Authorization Successful!</h1>
              <p>Your OAuth tokens have been saved to: <code>${tokenPath}</code></p>
              <p>You can now close this window and use the MCP server.</p>
              <hr style="margin: 20px 0;">
              <h3>Next Steps:</h3>
              <ol>
                <li>Close this browser window</li>
                <li>Return to your terminal</li>
                <li>Run: <code>npm run inspector</code></li>
                <li>Test your Google Sheets integration!</li>
              </ol>
            </div>
          </body>
        </html>
      `);

      console.log('✅ Authorization successful!');
      console.log(`💾 Tokens saved to: ${tokenPath}`);
      console.log('\n🎉 OAuth setup complete!');
      console.log('You can now use the MCP server with OAuth authentication.');
      console.log('\nNext steps:');
      console.log('1. Close this browser window');
      console.log('2. Run: npm run inspector');
      console.log('3. Test your Google Sheets integration!');

      this.resolveAuth();
      
      // Close server after a delay
      setTimeout(() => {
        this.server.close();
        process.exit(0);
      }, 3000);

    } catch (error) {
      console.error('❌ Error handling callback:', error);
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
      
      const tokenPath = process.env.TOKEN_PATH || 'token.json';
      await fs.writeFile(tokenPath, JSON.stringify(credentials, null, 2));
      
      console.log('✅ Token refreshed successfully!');
      console.log('You can now use the MCP server with OAuth authentication.');
      console.log('\nRun: npm run inspector');
    } catch (error) {
      console.error('❌ Failed to refresh token:', error.message);
      console.log('Starting new OAuth flow...\n');
      await this.startOAuthFlow();
    }
  }

  /**
   * Test the OAuth setup
   */
  async testConnection() {
    try {
      const tokenPath = process.env.TOKEN_PATH || 'token.json';
      const tokenData = await fs.readFile(tokenPath, 'utf8');
      const token = JSON.parse(tokenData);
      
      this.oauth2Client.setCredentials(token);
      
      // Test with Google Sheets API
      const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
      
      console.log('🧪 Testing OAuth connection...');
      
      // Try to list spreadsheets (this will fail if no access, but won't throw if auth is wrong)
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        pageSize: 1,
      });
      
      console.log('✅ OAuth connection test successful!');
      console.log(`Found ${response.data.files.length} spreadsheets accessible`);
      
    } catch (error) {
      console.error('❌ OAuth connection test failed:', error.message);
      console.log('You may need to:');
      console.log('1. Share some spreadsheets with your Google account');
      console.log('2. Check that the Google Sheets API is enabled');
      console.log('3. Verify your OAuth credentials are correct');
    }
  }
}

// Main execution
async function main() {
  const setup = new OAuthSetup();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await setup.testConnection();
      break;
    case 'setup':
    default:
      await setup.setup();
      break;
  }
}

main().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}); 