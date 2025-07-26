# Google Sheets MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with Google Sheets API, enabling AI-driven interaction with Google Spreadsheets for automation and data manipulation.

## Features

### Core Capabilities
- **Spreadsheet Management**: List, create, and get information about spreadsheets
- **Sheet Operations**: Create and manage individual sheets within spreadsheets
- **Data Operations**: Read, write, update, and append data with full range support
- **Batch Operations**: Efficient batch updates for better performance
- **Collaboration**: Share spreadsheets with specific permissions
- **Utilities**: Clear ranges, find and replace operations
- **Interactive Testing**: Built-in MCP Inspector for debugging and testing

### Authentication Methods
- Service Account (recommended for production)
- OAuth 2.0 (for interactive use)
- Application Default Credentials (for Google Cloud environments)
- Base64 encoded credentials (for containerized environments)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test your setup:**
   ```bash
   npm run test:setup
   ```

3. **Set up authentication** (choose one method):
   ```bash
   # Option 1: Service Account (recommended)
   export SERVICE_ACCOUNT_PATH="/path/to/service-account.json"
   
   # Option 2: OAuth 2.0 (interactive)
   npm run oauth:setup
   
   # Option 3: Use gcloud CLI
   gcloud auth application-default login
   ```

4. **Test with the inspector:**
   ```bash
   npm run inspector
   ```
   This opens a web interface where you can test all tools interactively!

5. **Or start the server directly:**
   ```bash
   npm start
   ```

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Install Dependencies
```bash
npm install
```

## Authentication Setup

The server supports multiple authentication methods. Choose the one that best fits your use case:

### Method 1: Service Account (Recommended)

1. **Create a Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Enable the Google Sheets API and Google Drive API
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Download the JSON key file

2. **Set Environment Variables**:
   ```bash
   export SERVICE_ACCOUNT_PATH="/path/to/your/service-account-key.json"
   export DRIVE_FOLDER_ID="your_google_drive_folder_id_here"  # Optional
   ```

3. **Share Access**:
   - Share your Google Sheets or Drive folder with the service account email
   - Grant appropriate permissions (Viewer, Editor, etc.)

### Method 2: OAuth 2.0 (Interactive)

**Easy Setup with Automated Flow:**

1. **Create OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add `http://localhost:3000/oauth2callback` to redirect URIs
   - Download the credentials JSON file and save as `credentials.json`

2. **Run the OAuth Setup**:
   ```bash
   npm run oauth:setup
   ```
   
   This will:
   - Open your browser for Google authorization
   - Handle the OAuth flow automatically
   - Save your tokens securely
   - Test the connection

3. **Test the Setup**:
   ```bash
   npm run oauth:test
   ```

**Manual Setup (Alternative):**
```bash
export CREDENTIALS_PATH="/path/to/credentials.json"
export TOKEN_PATH="/path/to/token.json"
```

### Method 3: Application Default Credentials

1. **Install Google Cloud SDK** and run:
   ```bash
   gcloud auth application-default login
   ```

2. **Or set the environment variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   ```

### Method 4: Base64 Encoded Credentials

For containerized environments:
```bash
# Encode your credentials file
base64 -w 0 /path/to/your/credentials.json

# Set the environment variable
export CREDENTIALS_CONFIG="paste_your_base64_encoded_credentials_here"
export DRIVE_FOLDER_ID="your_drive_folder_id_here"  # For service accounts
```

## Usage

### Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Testing with MCP Inspector

The project includes an MCP Inspector for interactive testing and debugging:

```bash
npm run inspector
```

This will:
1. Check that authentication is properly configured
2. Start the MCP server
3. Launch a web interface for testing tools
4. Allow you to interactively test all available operations

The inspector provides:
- **Tool Discovery**: View all available tools and their schemas
- **Interactive Testing**: Call tools with custom parameters
- **Response Inspection**: View detailed responses and error messages
- **Authentication Debugging**: Verify your authentication setup works

#### Alternative Inspector Usage

You can also run the inspector directly:
```bash
npm run inspector:direct
```

### Integration with MCP Clients

#### Claude Desktop Configuration

Add this to your Claude Desktop configuration file:

**For Service Account:**
```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["/path/to/google-sheets-mcp/src/index.js"],
      "env": {
        "SERVICE_ACCOUNT_PATH": "/path/to/service-account.json",
        "DRIVE_FOLDER_ID": "your_folder_id_here"
      }
    }
  }
}
```

**For OAuth 2.0:**
```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["/path/to/google-sheets-mcp/src/index.js"],
      "env": {
        "CREDENTIALS_PATH": "/path/to/credentials.json",
        "TOKEN_PATH": "/path/to/token.json"
      }
    }
  }
}
```

## Available Tools

> 💡 **Tip**: Use `npm run inspector` to test these tools interactively in a web interface!

### Spreadsheet Management

#### `list_spreadsheets`
List all accessible spreadsheets.
```json
{
  "folder_id": "optional_folder_id"
}
```

#### `create_spreadsheet`
Create a new spreadsheet.
```json
{
  "title": "My New Spreadsheet",
  "folder_id": "optional_folder_id"
}
```

#### `get_spreadsheet_info`
Get detailed information about a spreadsheet.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
}
```

### Sheet Management

#### `list_sheets`
List all sheets in a spreadsheet.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
}
```

#### `create_sheet`
Create a new sheet in a spreadsheet.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "title": "New Sheet"
}
```

### Data Operations

#### `get_sheet_data`
Read data from a sheet or range.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheet_name": "Sheet1",
  "range": "A1:C10"  // Optional
}
```

#### `update_cells`
Update cells in a specific range.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheet_name": "Sheet1",
  "range": "A1:B2",
  "values": [
    ["Header 1", "Header 2"],
    ["Value 1", "Value 2"]
  ]
}
```

#### `append_rows`
Append new rows to the end of a sheet.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheet_name": "Sheet1",
  "values": [
    ["New Row 1", "Data 1"],
    ["New Row 2", "Data 2"]
  ]
}
```

#### `batch_update_cells`
Update multiple ranges efficiently.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "updates": [
    {
      "sheet_name": "Sheet1",
      "range": "A1:B1",
      "values": [["Header 1", "Header 2"]]
    },
    {
      "sheet_name": "Sheet1",
      "range": "A3:B3",
      "values": [["Row 3", "Data 3"]]
    }
  ]
}
```

### Collaboration

#### `share_spreadsheet`
Share a spreadsheet with users.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "recipients": [
    {
      "email": "user@example.com",
      "role": "writer"
    },
    {
      "email": "viewer@example.com",
      "role": "reader"
    }
  ],
  "send_notification": true
}
```

### Utilities

#### `clear_range`
Clear values in a range while preserving formatting.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheet_name": "Sheet1",
  "range": "A1:C10"
}
```

#### `find_and_replace`
Find and replace text in a sheet.
```json
{
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheet_name": "Sheet1",
  "find": "old text",
  "replace": "new text",
  "range": "A1:Z100",  // Optional
  "match_case": false,
  "match_entire_cell": false
}
```

## Error Handling

The server provides comprehensive error handling:
- Authentication failures with clear guidance
- Invalid parameters with validation messages
- Google API errors with context
- Network and permission issues

All errors are returned in a structured format:
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional context when available"
}
```

## Development

### Project Structure
```
google-sheets-mcp/
├── src/
│   ├── index.js              # Main server entry point
│   ├── inspector.js          # MCP Inspector launcher with auth checks
│   ├── oauth-setup.js        # OAuth 2.0 setup and flow handler
│   ├── google-sheets-client.js   # Google Sheets API client
│   ├── tools.js              # Tool definitions
│   └── tool-handlers.js      # Tool implementation
├── package.json              # Dependencies and scripts
├── README.md                 # Main documentation
├── test-examples.md          # Test scenarios and sample data
├── config.example.env        # Environment configuration template
├── .gitignore               # Git ignore patterns
└── LICENSE                  # MIT license
```

### Testing and Development

#### OAuth Setup and Testing
```bash
# Set up OAuth 2.0 authentication
npm run oauth:setup

# Test OAuth connection
npm run oauth:test
```

#### Running the Inspector
```bash
npm run inspector
```

The inspector provides a web interface for:
- Testing all available tools
- Debugging authentication issues
- Validating server responses
- Interactive development

> 📖 **See [test-examples.md](test-examples.md) for sample data and complete test scenarios you can use with the inspector.**

#### Testing Your Setup
```bash
npm run test:setup
```

This will verify:
- All dependencies are installed correctly
- Authentication methods are configured
- Credential files exist
- Server can start properly

#### Running Tests
```bash
npm test
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| `SERVICE_ACCOUNT_PATH` | Path to service account JSON file | For service account auth |
| `CREDENTIALS_CONFIG` | Base64 encoded credentials | Alternative to file path |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google's standard ADC variable | For ADC auth |
| `CREDENTIALS_PATH` | OAuth 2.0 credentials file path | For OAuth auth |
| `TOKEN_PATH` | OAuth 2.0 token storage path | For OAuth auth |
| `DRIVE_FOLDER_ID` | Default folder for operations | Optional |

## Troubleshooting

### Quick Debugging with Inspector

The fastest way to debug issues is with the MCP Inspector:

```bash
npm run inspector
```

The inspector will:
1. Check your authentication setup
2. Show helpful error messages
3. Let you test tools interactively
4. Display detailed error responses

### Common Issues

1. **Authentication Failed**
   - Run `npm run inspector` to check auth status
   - Verify your credentials file exists and is valid
   - Check that the required APIs are enabled in Google Cloud Console
   - Ensure your service account has access to the spreadsheets

2. **Permission Denied**
   - Share the spreadsheet with your service account email
   - Check the folder permissions if using DRIVE_FOLDER_ID
   - Use the inspector to test with a known spreadsheet ID

3. **Spreadsheet Not Found**
   - Verify the spreadsheet ID is correct (use `list_spreadsheets` tool)
   - Ensure the spreadsheet is accessible to your authenticated account
   - Check the URL format: `https://docs.google.com/spreadsheets/d/[ID]/edit`

4. **Rate Limiting**
   - The server handles rate limiting automatically
   - For high-volume usage, consider implementing exponential backoff
   - Monitor API quotas in Google Cloud Console

5. **Tool Errors**
   - Use the inspector to see detailed error messages
   - Check the [test-examples.md](test-examples.md) for working examples
   - Verify parameter formats match the tool schemas

## License

MIT License - see LICENSE file for details.

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol/specification)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api) 