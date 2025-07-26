# Error Handling Specification

## 📋 Overview

This document specifies the error handling strategy, error codes, error messages, and recovery procedures for the Google Sheets MCP server. Proper error handling is critical for system reliability and user experience.

## 🏗️ Error Handling Architecture

### Error Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tool Call     │    │  Error Handler   │    │  Error Response │
│                 │───►│  (Validation)    │───►│  (Formatted)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Logging &       │
                       │  Monitoring      │
                       └──────────────────┘
```

### Error Categories

1. **Authentication Errors** - Credential and permission issues
2. **Validation Errors** - Input validation failures
3. **API Errors** - Google Sheets API failures
4. **Network Errors** - Connectivity issues
5. **System Errors** - Internal server errors

## 🔍 Error Codes and Messages

### Authentication Errors

#### `AUTH_REQUIRED`
- **Code**: `AUTH_REQUIRED`
- **Message**: "No valid authentication method found"
- **Description**: No authentication method is configured
- **Solution**: Set up one of the supported authentication methods
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: No valid authentication method found. Please set up one of the following:\n1. SERVICE_ACCOUNT_PATH environment variable\n2. CREDENTIALS_CONFIG environment variable (base64 encoded)\n3. GOOGLE_APPLICATION_CREDENTIALS environment variable\n4. CREDENTIALS_PATH and TOKEN_PATH for OAuth2"
      }
    ],
    "isError": true
  }
  ```

#### `INVALID_CREDENTIALS`
- **Code**: `INVALID_CREDENTIALS`
- **Message**: "Invalid or expired credentials"
- **Description**: Credentials are invalid, expired, or corrupted
- **Solution**: Refresh credentials or regenerate service account
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Invalid or expired credentials. Please refresh your authentication."
      }
    ],
    "isError": true
  }
  ```

#### `INSUFFICIENT_PERMISSIONS`
- **Code**: `INSUFFICIENT_PERMISSIONS`
- **Message**: "Insufficient API permissions"
- **Description**: Service account or OAuth token lacks required permissions
- **Solution**: Enable required APIs and assign proper roles
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Insufficient permissions. Please enable Google Sheets API and Google Drive API."
      }
    ],
    "isError": true
  }
  ```

### Validation Errors

#### `INVALID_INPUT`
- **Code**: `INVALID_INPUT`
- **Message**: "Invalid input parameters"
- **Description**: Tool input fails schema validation
- **Solution**: Check input format and required fields
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Invalid input parameters. Required field 'spreadsheet_id' is missing."
      }
    ],
    "isError": true
  }
  ```

#### `MISSING_REQUIRED_FIELD`
- **Code**: `MISSING_REQUIRED_FIELD`
- **Message**: "Required field missing"
- **Description**: Required parameter is not provided
- **Solution**: Provide all required parameters
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Required field 'title' is missing for create_spreadsheet tool."
      }
    ],
    "isError": true
  }
  ```

#### `TYPE_MISMATCH`
- **Code**: `TYPE_MISMATCH`
- **Message**: "Data type mismatch"
- **Description**: Parameter has incorrect data type
- **Solution**: Provide correct data type
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Data type mismatch. Expected 'string' for 'title', got 'number'."
      }
    ],
    "isError": true
  }
  ```

### API Errors

#### `INVALID_SPREADSHEET_ID`
- **Code**: `INVALID_SPREADSHEET_ID`
- **Message**: "Invalid spreadsheet ID format"
- **Description**: Spreadsheet ID format is invalid
- **Solution**: Use valid Google Sheets spreadsheet ID
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Invalid spreadsheet ID format. Expected format: [a-zA-Z0-9-_]+"
      }
    ],
    "isError": true
  }
  ```

#### `SPREADSHEET_NOT_FOUND`
- **Code**: `SPREADSHEET_NOT_FOUND`
- **Message**: "Spreadsheet does not exist"
- **Description**: Spreadsheet ID is valid but spreadsheet doesn't exist
- **Solution**: Check spreadsheet ID or create new spreadsheet
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Spreadsheet not found. Please check the spreadsheet ID or ensure you have access."
      }
    ],
    "isError": true
  }
  ```

#### `SHEET_NOT_FOUND`
- **Code**: `SHEET_NOT_FOUND`
- **Message**: "Sheet does not exist"
- **Description**: Sheet name or ID doesn't exist in spreadsheet
- **Solution**: Check sheet name or create new sheet
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Sheet 'Data' not found in spreadsheet. Available sheets: ['Sheet1', 'Summary']"
      }
    ],
    "isError": true
  }
  ```

#### `INVALID_RANGE`
- **Code**: `INVALID_RANGE`
- **Message**: "Invalid A1 notation range"
- **Description**: Range format is invalid
- **Solution**: Use valid A1 notation (e.g., 'Sheet1!A1:D10')
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Invalid range format. Expected A1 notation like 'Sheet1!A1:D10'"
      }
    ],
    "isError": true
  }
  ```

#### `QUOTA_EXCEEDED`
- **Code**: `QUOTA_EXCEEDED`
- **Message**: "API quota exceeded"
- **Description**: Google API quota limit reached
- **Solution**: Wait for quota reset or implement rate limiting
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: API quota exceeded. Please wait before making more requests."
      }
    ],
    "isError": true
  }
  ```

### Network Errors

#### `NETWORK_ERROR`
- **Code**: `NETWORK_ERROR`
- **Message**: "Network connectivity issue"
- **Description**: Unable to connect to Google APIs
- **Solution**: Check internet connection and firewall settings
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Network connectivity issue. Please check your internet connection."
      }
    ],
    "isError": true
  }
  ```

#### `TIMEOUT_ERROR`
- **Code**: `TIMEOUT_ERROR`
- **Message**: "Request timeout"
- **Description**: API request timed out
- **Solution**: Retry request or check network performance
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Request timeout. Please try again or check network performance."
      }
    ],
    "isError": true
  }
  ```

### System Errors

#### `INTERNAL_ERROR`
- **Code**: `INTERNAL_ERROR`
- **Message**: "Internal server error"
- **Description**: Unexpected internal error
- **Solution**: Check server logs and restart if necessary
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Internal server error. Please check server logs for details."
      }
    ],
    "isError": true
  }
  ```

#### `UNKNOWN_TOOL`
- **Code**: `UNKNOWN_TOOL`
- **Message**: "Unknown tool"
- **Description**: Tool name is not recognized
- **Solution**: Check available tools or update server
- **Example**:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error: Unknown tool 'invalid_tool'. Available tools: list_spreadsheets, create_spreadsheet, get_sheet_data, update_cells, add_sheet, delete_sheet, batch_update, get_spreadsheet_info, search_spreadsheets"
      }
    ],
    "isError": true
  }
  ```

## 🔄 Error Recovery Strategies

### Automatic Recovery

#### Retry Logic
```javascript
// Exponential backoff retry
async function retryWithBackoff(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### Token Refresh
```javascript
// Automatic token refresh
async function refreshTokenIfNeeded(token) {
  if (token.expiry_date && Date.now() >= token.expiry_date - 60000) {
    try {
      const newToken = await oauth2Client.refreshAccessToken();
      await saveToken(newToken.credentials);
      return newToken.credentials;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }
  return token;
}
```

### Manual Recovery

#### Authentication Issues
1. **Service Account**: Regenerate service account key
2. **OAuth 2.0**: Run `npm run oauth:setup`
3. **ADC**: Run `gcloud auth application-default login`

#### API Issues
1. **Quota Exceeded**: Wait for quota reset (usually 1 hour)
2. **Permission Issues**: Check Google Cloud Console settings
3. **Network Issues**: Check connectivity and firewall

## 📊 Error Logging and Monitoring

### Log Format
```javascript
// Structured error logging
const errorLog = {
  timestamp: new Date().toISOString(),
  errorCode: 'INVALID_SPREADSHEET_ID',
  errorMessage: 'Invalid spreadsheet ID format',
  toolName: 'get_sheet_data',
  userId: 'user123',
  requestId: 'req-456',
  stackTrace: error.stack,
  context: {
    spreadsheetId: 'invalid-id',
    range: 'Sheet1!A1:D10'
  }
};
```

### Error Metrics
- **Error Rate**: Percentage of failed requests
- **Error Types**: Distribution of error codes
- **Response Time**: Impact of errors on performance
- **Recovery Time**: Time to resolve errors

### Monitoring Alerts
- **High Error Rate**: >5% error rate triggers alert
- **Critical Errors**: Authentication failures trigger immediate alert
- **Quota Warnings**: >80% quota usage triggers warning
- **Network Issues**: Connection failures trigger alert

## 🛠️ Error Handling Implementation

### Input Validation
```javascript
// Zod schema validation
const inputSchema = z.object({
  spreadsheet_id: z.string().regex(/^[a-zA-Z0-9-_]+$/),
  range: z.string().regex(/^[A-Za-z0-9_]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$/),
  value_render_option: z.enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA']).optional()
});

try {
  const validatedInput = inputSchema.parse(input);
  // Process validated input
} catch (error) {
  throw new Error(`Validation error: ${error.message}`);
}
```

### API Error Handling
```javascript
// Google API error handling
try {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: range
  });
  return response.data;
} catch (error) {
  if (error.code === 404) {
    throw new Error('SPREADSHEET_NOT_FOUND');
  } else if (error.code === 403) {
    throw new Error('INSUFFICIENT_PERMISSIONS');
  } else if (error.code === 429) {
    throw new Error('QUOTA_EXCEEDED');
  } else {
    throw new Error('API_ERROR');
  }
}
```

### Error Response Format
```javascript
// Standardized error response
function createErrorResponse(errorCode, message, details = null) {
  return {
    content: [
      {
        type: "text",
        text: `Error: ${message}${details ? `\n\nDetails: ${details}` : ''}`
      }
    ],
    isError: true,
    metadata: {
      errorCode,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}
```

## 📋 Error Handling Checklist

### Development
- [ ] All inputs validated with Zod schemas
- [ ] API errors mapped to internal error codes
- [ ] Error messages are user-friendly
- [ ] Stack traces logged but not exposed
- [ ] Retry logic implemented for transient errors

### Testing
- [ ] Error scenarios covered in unit tests
- [ ] Integration tests verify error handling
- [ ] Error recovery procedures tested
- [ ] Performance impact of error handling measured

### Production
- [ ] Error monitoring and alerting configured
- [ ] Error logs centralized and searchable
- [ ] Error recovery procedures documented
- [ ] Error rate metrics tracked

## 🔧 Troubleshooting Guide

### Common Error Scenarios

#### Authentication Failures
1. **Check credentials**: Verify credential files exist and are valid
2. **Check permissions**: Ensure APIs are enabled and roles assigned
3. **Check environment**: Verify environment variables are set correctly
4. **Test connection**: Run `npm run oauth:test` for OAuth

#### API Failures
1. **Check quota**: Verify API quota limits
2. **Check permissions**: Ensure proper access to spreadsheets
3. **Check network**: Test connectivity to Google APIs
4. **Check format**: Verify input parameters are correct

#### Validation Failures
1. **Check schema**: Verify input matches expected format
2. **Check types**: Ensure data types are correct
3. **Check required fields**: Provide all required parameters
4. **Check constraints**: Respect parameter limits and patterns

### Debug Commands
```bash
# Test authentication
npm run test:setup

# Test OAuth connection
npm run oauth:test

# Check environment variables
env | grep -E "(SERVICE_ACCOUNT|CREDENTIALS|GOOGLE_APPLICATION)"

# Check server logs
npm start 2>&1 | grep -i error
``` 