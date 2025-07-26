#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCP Inspector launcher for Google Sheets MCP Server
 * This provides a web interface for testing the server
 */

// Check if we have authentication configured
function checkAuthentication() {
  const hasServiceAccount = process.env.SERVICE_ACCOUNT_PATH;
  const hasCredentialsConfig = process.env.CREDENTIALS_CONFIG;
  const hasGoogleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasOAuth = process.env.CREDENTIALS_PATH && process.env.TOKEN_PATH;

  if (!hasServiceAccount && !hasCredentialsConfig && !hasGoogleCreds && !hasOAuth) {
    console.error('⚠️  No authentication configured!');
    console.error('Please set up one of the following before running the inspector:');
    console.error('');
    console.error('1. Service Account:');
    console.error('   export SERVICE_ACCOUNT_PATH="/path/to/service-account.json"');
    console.error('');
    console.error('2. Application Default Credentials:');
    console.error('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    console.error('   # OR run: gcloud auth application-default login');
    console.error('');
    console.error('3. OAuth 2.0:');
    console.error('   export CREDENTIALS_PATH="/path/to/credentials.json"');
    console.error('   export TOKEN_PATH="/path/to/token.json"');
    console.error('');
    console.error('4. Base64 Credentials:');
    console.error('   export CREDENTIALS_CONFIG="base64_encoded_credentials"');
    console.error('');
    console.error('See README.md for detailed setup instructions.');
    process.exit(1);
  }

  console.log('✅ Authentication configured');
  if (hasServiceAccount) console.log('   Using Service Account');
  if (hasGoogleCreds) console.log('   Using Application Default Credentials');
  if (hasOAuth) console.log('   Using OAuth 2.0');
  if (hasCredentialsConfig) console.log('   Using Base64 Credentials');
  console.log('');
}

function startInspector() {
  checkAuthentication();

  console.log('🚀 Starting MCP Inspector for Google Sheets server...');
  console.log('');
  console.log('The inspector will:');
  console.log('1. Start the Google Sheets MCP server');
  console.log('2. Open a web interface for testing');
  console.log('3. Allow you to test all available tools');
  console.log('');
  console.log('Once started, you can:');
  console.log('- View all available tools');
  console.log('- Test tool calls with sample data');
  console.log('- Inspect responses and errors');
  console.log('- Debug authentication issues');
  console.log('');

  const serverPath = join(__dirname, 'index.js');
  
  // Start the inspector
  const inspector = spawn('npx', ['@modelcontextprotocol/inspector', serverPath], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  inspector.on('error', (err) => {
    if (err.code === 'ENOENT' || err.message.includes('MODULE_NOT_FOUND')) {
      console.error('❌ MCP Inspector not found');
      console.error('The inspector is not available yet. You can:');
      console.error('1. Run the server directly: npm start');
      console.error('2. Test OAuth setup: npm run oauth:setup');
      console.error('3. Test OAuth connection: npm run oauth:test');
      console.error('');
      console.error('Or install the inspector manually:');
      console.error('npm install @modelcontextprotocol/inspector');
      process.exit(1);
    }
    console.error('Failed to start inspector:', err);
    process.exit(1);
  });

  inspector.on('error', (err) => {
    console.error('Failed to start inspector:', err);
    process.exit(1);
  });

  inspector.on('close', (code) => {
    console.log(`Inspector exited with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down inspector...');
    inspector.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    inspector.kill('SIGTERM');
  });
}

startInspector(); 