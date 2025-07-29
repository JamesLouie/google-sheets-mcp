# Authentication Specification

## 🔐 Overview

The Google Sheets MCP server supports multiple authentication methods to accommodate different deployment scenarios and security requirements. This document specifies the authentication mechanisms, security requirements, and implementation details.

## 🏗️ Authentication Architecture

### Supported Methods

1. **Service Account** (Recommended for production)
2. **OAuth 2.0** (Interactive user authentication)
3. **Application Default Credentials** (ADC)
4. **Base64 Encoded Credentials** (Containerized environments)

### Authentication Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Server    │    │  Auth Manager    │    │  Google APIs    │
│                 │───►│  (Client)        │───►│  (OAuth/ADC)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Credential      │
                       │  Storage         │
                       └──────────────────┘
```

## 🔑 Authentication Methods

### OAuth 2.0 Authentication

#### Overview
OAuth 2.0 is the primary authentication method for this application. It provides secure, user-controlled access to Google Sheets with temporary access tokens and refresh capabilities.

#### Configuration
```bash
# Environment variables
export CREDENTIALS_PATH="/path/to/credentials.json"
export TOKEN_PATH="/path/to/token.json"

# Or in .env file
CREDENTIALS_PATH=/path/to/credentials.json
TOKEN_PATH=/path/to/token.json
```

**Note**: The application automatically loads environment variables from the `.env` file using `dotenv`. Simply add your configuration to the `.env` file and it will be loaded at startup.

#### Implementation
```javascript
const oauth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);
```

#### OAuth Flow
1. **Authorization Request**: Generate auth URL
2. **User Consent**: Browser-based authorization
3. **Token Exchange**: Exchange code for tokens
4. **Token Storage**: Secure token persistence
5. **Token Refresh**: Automatic refresh handling
6. **Startup Authentication**: Automatic OAuth initiation on application startup

#### Security Requirements
- **Redirect URI**: `http://localhost:{port}/oauth2callback` (dynamically assigned, starting from port 3000)
- **Token Storage**: Secure file storage (600 permissions)
- **HTTPS**: Required for production redirect URIs
- **Token Refresh**: Automatic refresh before expiration

#### Setup Process
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Configure redirect URIs
3. Download credentials JSON
4. Run `npm run oauth:setup` (manual setup)
5. Complete browser authorization
6. Verify token storage
7. **Automatic Startup**: OAuth will be initiated automatically on application startup if needed

## 🔒 Security Specifications

### Credential Storage

#### File-based Storage
```bash
# Service Account
chmod 600 service-account.json
chown application:application service-account.json

# OAuth Credentials
chmod 600 credentials.json
chmod 600 token.json
```

#### Environment Variables
```bash
# Secure environment variable handling
export CREDENTIALS_CONFIG="$(base64 -w 0 < service-account.json)"
```

### Token Management

#### OAuth Token Storage
```json
{
  "access_token": "ya29.a0AfH6SMB...",
  "refresh_token": "1//04dX...",
  "scope": "https://www.googleapis.com/auth/spreadsheets...",
  "token_type": "Bearer",
  "expiry_date": 1234567890000
}
```

#### Token Refresh Logic
```javascript
// Automatic refresh before expiration
if (token.expiry_date && Date.now() >= token.expiry_date - 60000) {
  await refreshToken(token);
}
```

### Permission Scopes

#### Required Scopes
- `https://www.googleapis.com/auth/spreadsheets`
  - Read and write access to Google Sheets
  - Manage spreadsheet properties
  - Access to sheet data and formatting

- `https://www.googleapis.com/auth/drive.file`
  - Access to files created by the application
  - Create and manage spreadsheets
  - Search and list files

#### Optional Scopes
- `https://www.googleapis.com/auth/drive`
  - Full access to Google Drive
  - Use with caution in production

## 🚨 Security Best Practices

### 1. Credential Protection
- **Never commit credentials** to version control
- **Use environment variables** for sensitive data
- **Implement file permissions** (600 for credential files)
- **Rotate credentials regularly**

### 2. Token Security
- **Store tokens securely** with proper permissions
- **Implement automatic refresh** before expiration
- **Log token events** for audit purposes
- **Handle token revocation** gracefully

### 3. Network Security
- **Use HTTPS** for all OAuth redirects
- **Validate redirect URIs** to prevent attacks
- **Implement CSRF protection** for OAuth flows
- **Monitor for suspicious activity**

### 4. Application Security
- **Validate all inputs** before API calls
- **Implement rate limiting** to prevent abuse
- **Log authentication events** for monitoring
- **Handle errors securely** without information leakage

## 🔍 Error Handling

### Authentication Errors

#### `AUTH_REQUIRED`
- **Cause**: No authentication method configured
- **Solution**: Set up one of the supported authentication methods
- **Example**: `export SERVICE_ACCOUNT_PATH="/path/to/credentials.json"`

#### `INVALID_CREDENTIALS`
- **Cause**: Invalid or expired credentials
- **Solution**: Refresh credentials or regenerate service account
- **Example**: Run `npm run oauth:setup` for OAuth refresh

#### `INSUFFICIENT_PERMISSIONS`
- **Cause**: Missing required API scopes
- **Solution**: Enable Google Sheets API and Drive API
- **Example**: Configure proper IAM roles for service account

### Token Errors

#### `TOKEN_EXPIRED`
- **Cause**: OAuth token has expired
- **Solution**: Automatic refresh or manual re-authentication
- **Example**: Run `npm run oauth:test` to verify token

#### `REFRESH_FAILED`
- **Cause**: Token refresh failed
- **Solution**: Re-authenticate user
- **Example**: Delete token.json and run `npm run oauth:setup`

## 📋 Setup Checklists

### OAuth 2.0 Setup
- [ ] Create Google Cloud project
- [ ] Enable Google Sheets API
- [ ] Enable Google Drive API
- [ ] Create OAuth 2.0 credentials
- [ ] Configure redirect URIs
- [ ] Download credentials JSON
- [ ] Run `npm run oauth:setup`
- [ ] Complete browser authorization
- [ ] Verify token storage
- [ ] Test connection

## 🔧 Troubleshooting

### Claude Desktop Configuration

When using this MCP server with Claude Desktop, ensure the following:

1. **Working Directory**: The MCP server must run from the project root directory
2. **File Paths**: Use relative paths in environment variables (e.g., `./token.json`)
3. **File Permissions**: Ensure token files have proper permissions (`chmod 600 token.json`)
4. **Configuration**: Use the provided `claude-desktop-config.json` as a reference

The server now includes fallback path resolution to handle different execution environments.

### Common Issues

#### "No valid authentication method found"
- **Check**: Environment variables are set correctly
- **Verify**: Credential files exist and are readable
- **Test**: Run `npm run test:setup`

#### "Invalid credentials"
- **Check**: Service account JSON is valid
- **Verify**: OAuth tokens are not expired
- **Refresh**: Run `npm run oauth:setup` for OAuth

#### "Insufficient permissions"
- **Check**: Google Sheets API is enabled
- **Verify**: Service account has proper roles
- **Test**: API access in Google Cloud Console

#### "Credentials file not found"
**Solution**: Make sure `credentials.json` is in your project root directory

#### "Invalid redirect URI"
**Solution**: 
- Check that `http://localhost:3000/oauth2callback` is added to your OAuth client (the app will automatically find an available port if 3000 is in use)
- Make sure there are no extra spaces or characters

#### "Access denied" or "Permission denied"
**Solution**:
- Make sure you're using the same Google account that owns the spreadsheets
- Check that the Google Sheets API is enabled in your project
- Verify your OAuth consent screen is configured correctly

#### "Token expired"
**Solution**: Run `npm run oauth:setup` again to refresh your tokens

#### "Browser doesn't open automatically"
**Solution**: 
- Copy the authorization URL from the terminal
- Paste it into your browser manually
- Complete the authorization flow

#### "Port 3000 is already in use"
**Solution**:
- The application now automatically finds an available port starting from 3000
- If you need to use a specific port range, you can modify the `findAvailablePort` function in `src/oauth-startup.js`

#### "Token file not found" (Claude Desktop)
**Solution**:
- Ensure the MCP server runs from the project root directory
- Use relative paths in environment variables: `./token.json` instead of absolute paths
- Check file permissions: `chmod 600 token.json`
- Run the debug script: `node debug-token-access.js`
- The server now has fallback path resolution for different execution environments

### Debug Commands
```bash
# Test authentication setup
npm run test:setup

# Test OAuth connection
npm run oauth:test

# Verify environment variables
env | grep -E "(SERVICE_ACCOUNT|CREDENTIALS|GOOGLE_APPLICATION)"

# Check file permissions
ls -la *.json

# Test credentials file
node -e "
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('credentials.json'));
console.log('✅ Credentials file is valid');
console.log('Client ID:', creds.web.client_id);
console.log('Redirect URI:', creds.web.redirect_uris[0]);
"

# Test token file
node -e "
const fs = require('fs');
const token = JSON.parse(fs.readFileSync('token.json'));
console.log('✅ Token file is valid');
console.log('Expires:', new Date(token.expiry_date).toLocaleString());
"

# Debug token access (Claude Desktop)
node debug-token-access.js
```

## 📋 OAuth 2.0 Setup Guide

### Quick Setup (Recommended)

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID** (you'll need this later)

#### 2. Enable APIs

1. In your project, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Sheets API**
   - **Google Drive API**

#### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Fill in the details:
   - **Name**: `Google Sheets MCP Server`
   - **Authorized redirect URIs**: `http://localhost:3000/oauth2callback` (the app will automatically find an available port if 3000 is in use)
5. Click **Create**
6. Download the JSON file and save it as `credentials.json` in your project root

#### 4. Run OAuth Setup

```bash
npm run oauth:setup
```

This will:
- ✅ Check your credentials file
- 🌐 Open your browser for Google authorization
- 🔐 Handle the OAuth flow automatically
- 💾 Save your tokens securely
- 🧪 Test the connection

#### 5. Test Your Setup

```bash
npm run oauth:test
```

#### 6. Start Using the Server

```bash
npm run inspector
```

### Detailed Setup Instructions

#### Step 1: Google Cloud Console Setup

##### Create a New Project
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **New Project**
4. Enter a project name (e.g., "Google Sheets MCP")
5. Click **Create**

##### Enable Required APIs
1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API" and click on it
3. Click **Enable**
4. Repeat for "Google Drive API"

#### Step 2: Create OAuth 2.0 Credentials

##### Create the Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. If prompted, configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: Google Sheets MCP Server
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Scopes**: Add `https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive.file`
   - **Test users**: Add your email address

##### Configure the OAuth Client
1. **Application type**: Web application
2. **Name**: Google Sheets MCP Server
3. **Authorized redirect URIs**: `http://localhost:3000/oauth2callback` (you can also add additional ports like `http://localhost:3001/oauth2callback`, `http://localhost:3002/oauth2callback` for flexibility)
4. Click **Create**
5. Download the JSON file

##### Save the Credentials
1. Rename the downloaded file to `credentials.json`
2. Place it in your project root directory
3. **Important**: Add `credentials.json` to your `.gitignore` file

#### Step 3: Run the OAuth Setup

```bash
npm run oauth:setup
```

##### What Happens During Setup

1. **Credentials Check**: The script verifies your `credentials.json` file exists
2. **Token Check**: Checks if you already have valid tokens
3. **Browser Launch**: Opens your browser to Google's authorization page
4. **Authorization**: You'll see a Google consent screen
5. **Callback Handling**: The script handles the OAuth callback automatically
6. **Token Storage**: Saves your access and refresh tokens to `token.json`

##### Browser Authorization Flow

When the browser opens, you'll see:
1. **Google Account Selection**: Choose your Google account
2. **Consent Screen**: Review the permissions being requested
3. **Authorization**: Click "Allow" to grant access
4. **Success Page**: You'll see a success message in your browser
5. **Automatic Close**: The script will close the browser window

#### Step 4: Verify the Setup

```bash
npm run oauth:test
```

This will:
- Load your saved tokens
- Test the connection to Google Sheets API
- List accessible spreadsheets
- Confirm everything is working

### Manual Token Refresh

If your tokens expire, you can refresh them:

```bash
npm run oauth:setup
```

The script will detect expired tokens and automatically refresh them.

## 🚀 OAuth Startup Authentication

### Automatic OAuth Initiation

The application now supports automatic OAuth authentication on startup. When the application starts and OAuth is configured but no valid token exists, it will automatically:

1. **Check OAuth Configuration**: Verify that `CREDENTIALS_PATH` and `TOKEN_PATH` are set
2. **Validate Token Status**: Check if existing tokens are valid and not expired
3. **Initiate OAuth Flow**: If needed, start the OAuth authorization process
4. **Handle Browser Authorization**: Open browser for user consent
5. **Save Tokens**: Store the obtained tokens securely
6. **Continue Startup**: Proceed with MCP server initialization

### Startup Flow

```
Application Startup
        │
        ▼
Check OAuth Configuration
        │
        ▼
Token Exists & Valid?
        │
    ┌───┴───┐
    │  Yes  │  No
    │       │
    ▼       ▼
Continue   Start OAuth Flow
Startup    │
           ▼
    Open Browser
           │
           ▼
    User Authorization
           │
           ▼
    Save Tokens
           │
           ▼
    Continue Startup
```

### Configuration

To enable automatic OAuth startup:

1. **Set Environment Variables**:
   ```bash
   export CREDENTIALS_PATH="/path/to/credentials.json"
   export TOKEN_PATH="/path/to/token.json"
   ```

2. **Or in .env file**:
   ```bash
   CREDENTIALS_PATH=/path/to/credentials.json
   TOKEN_PATH=/path/to/token.json
   ```

### Testing Startup OAuth

You can test the OAuth startup functionality:

```bash
# Test OAuth startup independently
npm run oauth:startup

# Start the MCP server (will trigger OAuth if needed)
npm start
```

### Error Handling

The startup OAuth handler includes comprehensive error handling:

- **Missing Credentials**: Graceful fallback to other auth methods
- **Expired Tokens**: Automatic token refresh attempt
- **Network Issues**: Clear error messages and retry guidance
- **User Cancellation**: Proper cleanup and error reporting

## 🔒 Security Best Practices

### File Permissions
```bash
# Set restrictive permissions on credential files
chmod 600 credentials.json
chmod 600 token.json
```

### Environment Variables
You can use environment variables instead of files:
```bash
export CREDENTIALS_PATH="/secure/path/to/credentials.json"
export TOKEN_PATH="/secure/path/to/token.json"
```

**Environment Variable Validation**: The application validates required environment variables at startup and provides clear error messages if authentication is not properly configured.

### Production Considerations
- Store credentials securely (not in version control)
- Use service accounts for production environments
- Rotate tokens regularly
- Monitor API usage and quotas

## 📊 API Quotas and Limits

### Google Sheets API Limits
- **Read requests**: 300 requests per minute per user
- **Write requests**: 300 requests per minute per user
- **Batch requests**: 100 requests per minute per user

### Google Drive API Limits
- **List requests**: 1000 requests per 100 seconds per user
- **File operations**: 1000 requests per 100 seconds per user

### Monitoring Usage
1. Go to Google Cloud Console
2. Navigate to **APIs & Services** → **Dashboard**
3. Select **Google Sheets API** or **Google Drive API**
4. View usage metrics and quotas

## 🚀 Next Steps

After successful OAuth setup:

1. **Test with Inspector**: `npm run inspector`
2. **Try the Examples**: See [test-examples.md](test-examples.md)
3. **Integrate with Claude**: Add to your Claude Desktop configuration
4. **Build Applications**: Use the MCP server in your projects

## 📋 Current Setup Summary

### Google Cloud Project Configuration
- **Project ID**: `YOUR_PROJECT_ID`
- **Project Name**: Google Sheets MCP Server
- **APIs Enabled**: 
  - Google Sheets API
  - Google Drive API
  - IAM Credentials API

### Authentication Methods Configured

#### OAuth 2.0 Authentication - REQUIRED
- **Status**: ✅ Configured and working
- **Credentials Location**: `./credentials.json`
- **Token Location**: `./token.json`
- **Test Result**: ✅ Authentication successful

### Environment Configuration
The application is configured to use OAuth 2.0 authentication exclusively.

### Usage Instructions
1. **Setup**: Run `npm run oauth:setup` to configure OAuth authentication
2. **Automatic Startup**: OAuth will be initiated automatically on application startup if needed
3. **Testing**: Use `npm run oauth:test` to verify your OAuth setup

**Note**: Replace all placeholder values with your own values when setting up this application. 