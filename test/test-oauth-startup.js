#!/usr/bin/env node
import { OAuthStartup } from '../src/oauth-startup.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test script for OAuth startup functionality
 */
async function testOAuthStartup() {
  console.log('🧪 Testing OAuth Startup Functionality');
  console.log('=====================================\n');

  try {
    const startup = new OAuthStartup();
    
    console.log('📋 Checking OAuth configuration...');
    const oauthStatus = await startup.checkAndInitiateOAuth();
    
    console.log('OAuth Status:', oauthStatus);
    
    if (oauthStatus.needsOAuth) {
      console.log('\n🔐 OAuth authentication is needed');
      console.log('Reason:', oauthStatus.reason);
      
      if (oauthStatus.reason === 'token_expired') {
        console.log('Attempting to refresh token...');
      } else {
        console.log('Will need to start new OAuth flow');
      }
    } else {
      console.log('\n✅ OAuth authentication not needed');
      if (oauthStatus.error) {
        console.log('Error:', oauthStatus.error);
      }
    }
    
    console.log('\n📊 Environment Variables Check:');
    console.log('CREDENTIALS_PATH:', process.env.CREDENTIALS_PATH ? '✅ Set' : '❌ Not set');
    console.log('TOKEN_PATH:', process.env.TOKEN_PATH ? '✅ Set' : '❌ Not set');
    
    console.log('\n🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testOAuthStartup().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 