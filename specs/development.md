# Development Guide

## 📋 Overview

This document provides comprehensive guidance for developers working on the Google Sheets MCP server. It covers development setup, coding standards, testing procedures, and best practices.

## 🛠️ Development Environment Setup

### Prerequisites

#### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: For version control
- **VS Code**: Recommended IDE (with extensions)

#### Recommended Extensions
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Initial Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd google-sheets-mcp
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
```bash
# Copy example environment file
cp config.example.env .env

# Edit environment variables
nano .env
```

**Note**: The application uses `dotenv` to automatically load environment variables from the `.env` file at startup. Both the main server (`src/index.js`) and the inspector (`src/inspector.js`) load environment variables automatically. No additional configuration is required.

#### 4. Authentication Setup
```bash
# For OAuth 2.0 development
npm run oauth:setup

# For service account development
export SERVICE_ACCOUNT_PATH="/path/to/service-account.json"
```

#### 5. Verify Setup
```bash
npm run test:setup
```

## 📝 Coding Standards

### Environment Variable Management

The application uses `dotenv` for environment variable management. Environment variables are loaded automatically from the `.env` file at application startup.

### Tool Parameter Defaults

The application provides sensible defaults for common parameters to improve usability:

#### Sheet Name Defaults
All data operation tools now default to "Sheet1" if no sheet name is provided:
- `get_sheet_data`: Defaults to "Sheet1" if `sheet_name` is not specified
- `update_cells`: Defaults to "Sheet1" if `sheet_name` is not specified  
- `append_rows`: Defaults to "Sheet1" if `sheet_name` is not specified
- `clear_range`: Defaults to "Sheet1" if `sheet_name` is not specified
- `find_and_replace`: Defaults to "Sheet1" if `sheet_name` is not specified

This allows for simplified API calls:
```json
{
  "name": "get_sheet_data",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  }
}
```

#### Environment File Structure
```bash
# .env file structure
SERVICE_ACCOUNT_PATH="/path/to/service-account.json"
CREDENTIALS_CONFIG="base64_encoded_credentials"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
CREDENTIALS_PATH="/path/to/oauth-credentials.json"
TOKEN_PATH="/path/to/token.json"
DRIVE_FOLDER_ID="optional_folder_id"
LOG_LEVEL="info"
```

#### Environment Variable Best Practices
- **Security**: Never commit `.env` files to version control
- **Documentation**: Keep `config.example.env` updated with all available variables
- **Validation**: Validate required environment variables at startup
- **Defaults**: Provide sensible defaults where appropriate
- **Consistency**: Both main server and inspector load from the same `.env` file

### JavaScript/Node.js Standards

#### Code Style
- **Indentation**: 2 spaces
- **Line Length**: 80 characters maximum
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing Commas**: Required in objects and arrays

#### Example
```javascript
import { z } from 'zod';
import { GoogleSheetsClient } from './google-sheets-client.js';

const schema = z.object({
  spreadsheet_id: z.string().regex(/^[a-zA-Z0-9-_]+$/),
  range: z.string().regex(/^[A-Za-z0-9_]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$/),
});

export async function handleGetSheetData(client, args) {
  try {
    const validatedArgs = schema.parse(args);
    const result = await client.getSheetData(
      validatedArgs.spreadsheet_id,
      validatedArgs.range,
    );
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    throw new Error(`Failed to get sheet data: ${error.message}`);
  }
}
```

### File Organization

#### Directory Structure
```
src/
├── index.js                 # Main server entry point
├── google-sheets-client.js  # Google Sheets API client
├── tools.js                 # Tool definitions
├── tool-handlers.js         # Tool implementation
├── oauth-setup.js          # OAuth setup utility
└── inspector.js            # Inspector launcher
```

#### Naming Conventions
- **Files**: kebab-case (e.g., `google-sheets-client.js`)
- **Functions**: camelCase (e.g., `handleGetSheetData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Classes**: PascalCase (e.g., `GoogleSheetsClient`)

### Documentation Standards

#### JSDoc Comments
```javascript
/**
 * Retrieves data from a specific range in a Google Sheets spreadsheet.
 * 
 * @param {GoogleSheetsClient} client - The Google Sheets client instance
 * @param {Object} args - Tool arguments
 * @param {string} args.spreadsheet_id - The spreadsheet ID
 * @param {string} args.range - A1 notation range (e.g., 'Sheet1!A1:D10')
 * @param {string} [args.value_render_option] - How values should be rendered
 * @returns {Promise<Object>} The sheet data response
 * @throws {Error} When spreadsheet is not found or access is denied
 */
export async function handleGetSheetData(client, args) {
  // Implementation
}
```

#### README Updates
- Update README.md when adding new features
- Include usage examples
- Document breaking changes
- Update version numbers

## 🧪 Testing Strategy

### Testing Levels

#### 1. Unit Testing
```javascript
// test/tool-handlers.test.js
import { handleGetSheetData } from '../src/tool-handlers.js';

describe('handleGetSheetData', () => {
  test('validates input parameters', async () => {
    const mockClient = {
      getSheetData: jest.fn().mockResolvedValue({ values: [] })
    };
    
    const args = {
      spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      range: 'Sheet1!A1:D10'
    };
    
    const result = await handleGetSheetData(mockClient, args);
    
    expect(result.success).toBe(true);
    expect(mockClient.getSheetData).toHaveBeenCalledWith(
      args.spreadsheet_id,
      args.range
    );
  });
  
  test('handles invalid spreadsheet ID', async () => {
    const mockClient = {};
    const args = { spreadsheet_id: 'invalid-id', range: 'Sheet1!A1:D10' };
    
    await expect(handleGetSheetData(mockClient, args))
      .rejects.toThrow('Invalid spreadsheet ID format');
  });
});
```

#### 2. Integration Testing
```javascript
// test/integration.test.js
import { GoogleSheetsClient } from '../src/google-sheets-client.js';

describe('Google Sheets Integration', () => {
  let client;
  
  beforeAll(async () => {
    client = new GoogleSheetsClient();
    await client.initialize();
  });
  
  test('lists spreadsheets', async () => {
    const result = await client.listSpreadsheets();
    expect(Array.isArray(result)).toBe(true);
  });
  
  test('creates and deletes spreadsheet', async () => {
    const spreadsheet = await client.createSpreadsheet({
      title: 'Test Spreadsheet',
      sheets: [{ title: 'Sheet1' }]
    });
    
    expect(spreadsheet.spreadsheetId).toBeDefined();
    
    // Cleanup
    await client.deleteSpreadsheet(spreadsheet.spreadsheetId);
  });
});
```

#### 3. End-to-End Testing
```javascript
// test/e2e.test.js
import { spawn } from 'child_process';

describe('MCP Server E2E', () => {
  test('responds to list tools request', async () => {
    const server = spawn('node', ['src/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    const response = await new Promise((resolve) => {
      server.stdout.once('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });
    
    expect(response.result.tools).toBeDefined();
    expect(Array.isArray(response.result.tools)).toBe(true);
    
    server.kill();
  });
});
```

#### 4. OAuth Connection Testing
The project includes a comprehensive OAuth connection test that verifies the Google Sheets API integration:

```bash
# Run OAuth connection test
npm run test:oauth-connection
```

This test performs the following operations:
- Validates environment variables and OAuth credentials
- Initializes the GoogleSheetsClient with OAuth authentication
- Lists accessible spreadsheets
- Creates a test spreadsheet
- Performs read/write operations on sheets
- Verifies all API endpoints are working correctly

The test provides detailed output and helpful error messages for troubleshooting authentication issues.

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- test/tool-handlers.test.js

# Test OAuth connection
npm run test:oauth-connection

# Test service account connection
npm run test:service-account
```

## 🔧 Development Workflow

### Feature Development

#### 1. Create Feature Branch
```bash
git checkout -b feature/new-tool
```

#### 2. Implement Feature
```javascript
// Add tool definition in src/tools.js
export const toolDefinitions = [
  // ... existing tools
  {
    name: "new_tool",
    description: "Description of the new tool",
    inputSchema: {
      type: "object",
      properties: {
        // Define input schema
      },
      required: ["required_field"]
    }
  }
];
```

```javascript
// Add handler in src/tool-handlers.js
export async function handleToolCall(request, googleSheetsClient) {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    // ... existing cases
    case "new_tool":
      return await handleNewTool(googleSheetsClient, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleNewTool(client, args) {
  // Implement tool logic
  const result = await client.newToolOperation(args);
  
  return {
    success: true,
    data: result
  };
}
```

#### 3. Add Tests
```javascript
// test/tool-handlers.test.js
describe('handleNewTool', () => {
  test('implements new tool functionality', async () => {
    // Test implementation
  });
});
```

#### 4. Update Documentation
```markdown
# Update README.md with new tool documentation
# Update test-examples.md with usage examples
```

#### 5. Test and Validate
```bash
# Run tests
npm test

# Test with inspector
npm run inspector

# Verify setup
npm run test:setup
```

### Bug Fixes

#### 1. Create Bug Fix Branch
```bash
git checkout -b fix/bug-description
```

#### 2. Reproduce Issue
```javascript
// Create test that reproduces the bug
test('reproduces the bug', () => {
  // Test that fails
});
```

#### 3. Fix Implementation
```javascript
// Fix the bug in the implementation
```

#### 4. Verify Fix
```javascript
// Test that now passes
test('bug is fixed', () => {
  // Test that passes
});
```

#### 5. Add Regression Test
```javascript
// Add test to prevent regression
test('prevents regression', () => {
  // Test that ensures bug doesn't return
});
```

### Known Issues and Fixes

#### OAuth2 Authentication Client Issue
**Problem**: When using OAuth2 authentication, the `GoogleSheetsClient.initialize()` method fails with `TypeError: this.auth.getClient is not a function`.

**Root Cause**: The authentication setup returns different types of auth objects:
- Service Account/ADC: Returns `GoogleAuth` instance with `getClient()` method
- OAuth2: Returns `OAuth2Client` instance without `getClient()` method

**Fix**: Updated the initialization logic to handle both auth types:

```javascript
// Handle different auth types
if (this.auth.getClient) {
  // GoogleAuth instance (Service Account, ADC)
  this.authClient = await this.auth.getClient();
} else {
  // OAuth2Client instance (OAuth2)
  this.authClient = this.auth;
}
```

**Verification**: Run `npm run test:oauth-connection` to confirm the fix works.

## 🚀 Deployment

### Development Deployment

#### Local Development
```bash
# Start development server with watch mode
npm run dev

# Test with inspector
npm run inspector

# Run OAuth setup
npm run oauth:setup
```

#### Docker Development
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "run", "dev"]
```

```bash
# Build and run
docker build -f Dockerfile.dev -t google-sheets-mcp:dev .
docker run -p 3000:3000 google-sheets-mcp:dev
```

### Production Deployment

#### Environment Variables
```bash
# Required for production
export SERVICE_ACCOUNT_PATH="/path/to/service-account.json"
export NODE_ENV="production"
export LOG_LEVEL="info"
```

#### Docker Production
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
USER node

CMD ["npm", "start"]
```

## 📊 Performance Optimization

### Code Optimization

#### Memory Management
```javascript
// Use streaming for large datasets
import { Readable } from 'stream';

function processLargeDataset(data) {
  return new Readable({
    read() {
      // Process data in chunks
    }
  });
}
```

#### Caching Strategy
```javascript
// Implement caching for frequently accessed data
const cache = new Map();

function getCachedData(key, ttl = 300000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}
```

### API Optimization

#### Batch Operations
```javascript
// Use batch operations for multiple updates
async function batchUpdate(spreadsheetId, updates) {
  const requests = updates.map(update => ({
    updateCells: {
      range: update.range,
      rows: update.rows,
      fields: 'userEnteredValue'
    }
  }));
  
  return await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests }
  });
}
```

#### Rate Limiting
```javascript
// Implement rate limiting
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

## 🔒 Security Best Practices

### Input Validation
```javascript
// Always validate inputs
import { z } from 'zod';

const inputSchema = z.object({
  spreadsheet_id: z.string().regex(/^[a-zA-Z0-9-_]+$/),
  range: z.string().regex(/^[A-Za-z0-9_]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$/)
});

function validateInput(input) {
  return inputSchema.parse(input);
}
```

### Credential Security
```javascript
// Never log sensitive data
function sanitizeLogData(data) {
  const sensitiveFields = ['private_key', 'client_secret', 'access_token'];
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (sensitiveFields.includes(key)) {
      return '[REDACTED]';
    }
    return value;
  }));
}
```

### Error Handling
```javascript
// Don't expose internal errors
function handleError(error) {
  console.error('Internal error:', error);
  
  return {
    content: [{
      type: "text",
      text: "An error occurred while processing your request."
    }],
    isError: true
  };
}
```

## 📋 Development Checklist

### Before Committing
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No sensitive data in commits
- [ ] Error handling is implemented
- [ ] Performance impact considered

### Before Releasing
- [ ] All integration tests pass
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation is complete
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Deployment tested

### Code Review Checklist
- [ ] Code is readable and well-documented
- [ ] Error handling is comprehensive
- [ ] Security considerations addressed
- [ ] Performance impact evaluated
- [ ] Tests cover edge cases
- [ ] No breaking changes (or documented)
- [ ] Follows project conventions 