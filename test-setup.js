#!/usr/bin/env node
import { GoogleSheetsClient } from './src/google-sheets-client.js';

/**
 * Simple test to verify the Google Sheets MCP server setup
 */
async function testSetup() {
  console.log('🧪 Testing Google Sheets MCP Server Setup');
  console.log('==========================================\n');

  try {
    // Test 1: Check if dependencies are available
    console.log('✅ Testing dependencies...');
    const { google } = await import('googleapis');
    console.log('   - googleapis: ✓');
    
    const { GoogleAuth } = await import('google-auth-library');
    console.log('   - google-auth-library: ✓');
    
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    console.log('   - MCP SDK: ✓');
    
    console.log('\n✅ All dependencies are available!');

    // Test 2: Check authentication methods
    console.log('\n🔐 Testing authentication methods...');
    
    const authMethods = [];
    if (process.env.SERVICE_ACCOUNT_PATH) authMethods.push('Service Account');
    if (process.env.CREDENTIALS_CONFIG) authMethods.push('Base64 Credentials');
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) authMethods.push('Application Default Credentials');
    if (process.env.CREDENTIALS_PATH && process.env.TOKEN_PATH) authMethods.push('OAuth 2.0');
    
    if (authMethods.length > 0) {
      console.log(`   - Found ${authMethods.length} authentication method(s):`);
      authMethods.forEach(method => console.log(`     • ${method}`));
    } else {
      console.log('   ⚠️  No authentication configured');
      console.log('   - Set up authentication to use the server');
    }

    // Test 3: Check if credentials files exist
    console.log('\n📁 Checking credential files...');
    const fs = await import('fs/promises');
    
    const files = [
      { name: 'credentials.json', env: 'CREDENTIALS_PATH' },
      { name: 'token.json', env: 'TOKEN_PATH' },
      { name: 'service-account.json', env: 'SERVICE_ACCOUNT_PATH' }
    ];
    
    for (const file of files) {
      try {
        await fs.access(file.name);
        console.log(`   ✓ ${file.name} exists`);
      } catch (error) {
        console.log(`   - ${file.name} not found`);
      }
    }

    console.log('\n🎉 Setup test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up authentication (see README.md)');
    console.log('2. Run: npm run oauth:setup (for OAuth)');
    console.log('3. Run: npm run inspector (to test tools)');
    console.log('4. Run: npm start (to start the server)');

  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Run: npm install');
    console.log('2. Check that Node.js version is 18+');
    console.log('3. Verify all dependencies are installed');
  }
}

testSetup(); 