import dotenv from 'dotenv';
import { GoogleSheetsClient } from '../src/google-sheets-client.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Simple API test for Google Sheets connection using OAuth
 */
async function testOAuthConnection() {
  console.log('🔐 Testing Google Sheets OAuth Connection...\n');

  // Check required environment variables
  const requiredVars = ['CREDENTIALS_PATH', 'TOKEN_PATH'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file:');
    console.error('CREDENTIALS_PATH=/path/to/oauth-credentials.json');
    console.error('TOKEN_PATH=/path/to/token.json');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded successfully');
  console.log(`📁 Credentials path: ${process.env.CREDENTIALS_PATH}`);
  console.log(`📁 Token path: ${process.env.TOKEN_PATH}\n`);

  try {
    // Initialize the Google Sheets client
    console.log('🔄 Initializing Google Sheets client...');
    const client = new GoogleSheetsClient();
    await client.initialize();
    console.log('✅ Google Sheets client initialized successfully\n');

    // Test 1: List spreadsheets
    console.log('📋 Test 1: Listing accessible spreadsheets...');
    const spreadsheets = await client.listSpreadsheets();
    console.log(`✅ Found ${spreadsheets.length} spreadsheets`);
    
    if (spreadsheets.length > 0) {
      console.log('📄 First few spreadsheets:');
      spreadsheets.slice(0, 3).forEach((sheet, index) => {
        console.log(`   ${index + 1}. ${sheet.title} (${sheet.id})`);
        console.log(`      Modified: ${new Date(sheet.modifiedTime).toLocaleString()}`);
      });
    }
    console.log('');

    // Test 2: Create a test spreadsheet
    console.log('📝 Test 2: Creating a test spreadsheet...');
    const testTitle = `OAuth Test - ${new Date().toISOString().split('T')[0]}`;
    const newSpreadsheet = await client.createSpreadsheet(testTitle);
    console.log(`✅ Created spreadsheet: ${newSpreadsheet.title}`);
    console.log(`   ID: ${newSpreadsheet.spreadsheetId}`);
    console.log(`   URL: ${newSpreadsheet.url}`);
    console.log('');

    // Test 3: List sheets in the new spreadsheet
    console.log('📊 Test 3: Listing sheets in the new spreadsheet...');
    const sheets = await client.listSheets(newSpreadsheet.spreadsheetId);
    console.log(`✅ Found ${sheets.length} sheets:`);
    sheets.forEach(sheet => {
      console.log(`   - ${sheet.title} (ID: ${sheet.sheetId})`);
    });
    console.log('');

    // Test 4: Add data to the first sheet
    console.log('📝 Test 4: Adding test data to the first sheet...');
    const firstSheet = sheets[0];
    const testData = [
      ['OAuth Connection Test', ''],
      ['Timestamp', 'Status'],
      [new Date().toISOString(), '✅ Success'],
      ['Test Column 1', 'Test Column 2', 'Test Column 3'],
      ['Data 1', 'Data 2', 'Data 3'],
    ];

    const updateResult = await client.updateCells(
      newSpreadsheet.spreadsheetId,
      firstSheet.title,
      'A1:C5',
      testData
    );

    console.log(`✅ Updated ${updateResult.updatedCells} cells`);
    console.log(`   Range: ${updateResult.updatedRange}`);
    console.log('');

    // Test 5: Read the data back
    console.log('📖 Test 5: Reading data from the spreadsheet...');
    const readData = await client.getSheetData(
      newSpreadsheet.spreadsheetId,
      firstSheet.title,
      'A1:C5'
    );

    console.log(`✅ Read ${readData.values.length} rows of data:`);
    readData.values.forEach((row, index) => {
      console.log(`   Row ${index + 1}: [${row.join(', ')}]`);
    });
    console.log('');

    // Test 6: Get spreadsheet info
    console.log('ℹ️  Test 6: Getting spreadsheet information...');
    const spreadsheetInfo = await client.getSpreadsheetInfo(newSpreadsheet.spreadsheetId);
    console.log(`✅ Spreadsheet: ${spreadsheetInfo.title}`);
    console.log(`   ID: ${spreadsheetInfo.spreadsheetId}`);
    console.log(`   URL: ${spreadsheetInfo.url}`);
    console.log(`   Sheets: ${spreadsheetInfo.sheets.length}`);
    console.log(`   Timezone: ${spreadsheetInfo.timeZone}`);
    console.log('');

    console.log('🎉 All OAuth connection tests passed successfully!');
    console.log(`📊 Test spreadsheet created: ${spreadsheetInfo.url}`);
    console.log('\n💡 You can now use this OAuth setup for your Google Sheets MCP server.');

  } catch (error) {
    console.error('❌ OAuth connection test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('OAuth2 token not found')) {
      console.error('\n💡 OAuth token not found. Please run the OAuth setup first:');
      console.error('   npm run oauth:setup');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication failed. Please check your credentials:');
      console.error('   1. Verify CREDENTIALS_PATH points to a valid OAuth credentials file');
      console.error('   2. Run npm run oauth:setup to generate a token');
      console.error('   3. Ensure your Google Cloud project has Sheets API enabled');
    }
    
    process.exit(1);
  }
}

// Run the test
testOAuthConnection().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 