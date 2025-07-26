# API Specification

## 📋 Overview

The Google Sheets MCP server implements the Model Context Protocol (MCP) to provide programmatic access to Google Sheets functionality. This document specifies the API endpoints, request/response formats, and data models.

## 🔧 MCP Protocol Implementation

### Server Information
```json
{
  "name": "google-sheets-mcp",
  "version": "1.0.0",
  "capabilities": {
    "tools": {}
  }
}
```

### Transport Layer
- **Protocol**: MCP over stdio
- **Encoding**: JSON-RPC 2.0
- **Transport**: Standard I/O (stdin/stdout)

## 🛠️ Tool Specifications

### 1. Spreadsheet Management

#### `list_spreadsheets`
**Description**: List all spreadsheets accessible to the authenticated user.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "folder_id": {
      "type": "string",
      "description": "Optional Google Drive folder ID to filter spreadsheets"
    }
  }
}
```

**Response Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "spreadsheets": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "url": { "type": "string" },
              "createdTime": { "type": "string" },
              "modifiedTime": { "type": "string" }
            }
          }
        },
        "count": { "type": "number" }
      }
    }
  }
}
```

#### `create_spreadsheet`
**Description**: Create a new spreadsheet with specified properties.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Title of the spreadsheet"
    },
    "folder_id": {
      "type": "string",
      "description": "Optional folder ID to place the spreadsheet"
    },
    "sheets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "gridProperties": {
            "type": "object",
            "properties": {
              "rowCount": { "type": "number" },
              "columnCount": { "type": "number" }
            }
          }
        }
      }
    }
  },
  "required": ["title"]
}
```

### 2. Sheet Management

#### `get_sheet_data`
**Description**: Retrieve data from a specific sheet range.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID"
    },
    "range": {
      "type": "string",
      "description": "A1 notation range (e.g., 'Sheet1!A1:D10')"
    },
    "value_render_option": {
      "type": "string",
      "enum": ["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"],
      "default": "FORMATTED_VALUE"
    }
  },
  "required": ["spreadsheet_id", "range"]
}
```

#### `update_cells`
**Description**: Update cell values in a spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID"
    },
    "range": {
      "type": "string",
      "description": "A1 notation range"
    },
    "values": {
      "type": "array",
      "items": {
        "type": "array",
        "items": { "type": ["string", "number", "boolean"] }
      }
    },
    "value_input_option": {
      "type": "string",
      "enum": ["RAW", "USER_ENTERED"],
      "default": "USER_ENTERED"
    }
  },
  "required": ["spreadsheet_id", "range", "values"]
}
```

### 3. Sheet Operations

#### `add_sheet`
**Description**: Add a new sheet to an existing spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID"
    },
    "title": {
      "type": "string",
      "description": "Title of the new sheet"
    },
    "grid_properties": {
      "type": "object",
      "properties": {
        "row_count": { "type": "number", "default": 1000 },
        "column_count": { "type": "number", "default": 26 }
      }
    }
  },
  "required": ["spreadsheet_id", "title"]
}
```

#### `delete_sheet`
**Description**: Delete a sheet from a spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID"
    },
    "sheet_id": {
      "type": "number",
      "description": "Sheet ID to delete"
    }
  },
  "required": ["spreadsheet_id", "sheet_id"]
}
```

### 4. Batch Operations

#### `batch_update`
**Description**: Perform multiple operations in a single request.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID"
    },
    "requests": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "updateCells": {
            "type": "object",
            "properties": {
              "range": { "type": "object" },
              "rows": { "type": "array" },
              "fields": { "type": "string" }
            }
          },
          "updateSheetProperties": {
            "type": "object",
            "properties": {
              "properties": { "type": "object" },
              "fields": { "type": "string" }
            }
          }
        }
      }
    }
  },
  "required": ["spreadsheet_id", "requests"]
}
```

### 5. Utility Functions

#### `get_spreadsheet_info`
**Description**: Get detailed information about a spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID"
    }
  },
  "required": ["spreadsheet_id"]
}
```

#### `search_spreadsheets`
**Description**: Search for spreadsheets by name or content.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "folder_id": {
      "type": "string",
      "description": "Optional folder ID to limit search"
    },
    "max_results": {
      "type": "number",
      "default": 10,
      "description": "Maximum number of results to return"
    }
  },
  "required": ["query"]
}
```

## 📊 Response Formats

### Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON stringified response data"
    }
  ]
}
```

### Error Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message"
    }
  ],
  "isError": true
}
```

## 🔍 Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication not configured
- `INVALID_CREDENTIALS`: Invalid or expired credentials
- `INSUFFICIENT_PERMISSIONS`: Insufficient API permissions

### API Errors
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID format
- `SPREADSHEET_NOT_FOUND`: Spreadsheet does not exist
- `SHEET_NOT_FOUND`: Sheet does not exist
- `INVALID_RANGE`: Invalid A1 notation range
- `QUOTA_EXCEEDED`: API quota exceeded

### Validation Errors
- `INVALID_INPUT`: Invalid input parameters
- `MISSING_REQUIRED_FIELD`: Required field missing
- `TYPE_MISMATCH`: Data type mismatch

## 📈 Rate Limiting

### Google Sheets API Limits
- **Read requests**: 300 requests per minute per project
- **Write requests**: 300 requests per minute per project
- **Batch requests**: 100 requests per minute per project

### Implementation
- Automatic retry with exponential backoff
- Request queuing for high-volume operations
- Graceful degradation when limits are exceeded

## 🔐 Security Considerations

### Input Validation
- All inputs validated against JSON schemas
- SQL injection prevention through parameterized queries
- XSS prevention through output sanitization

### Authentication
- Multiple authentication methods supported
- Secure credential storage
- Token refresh handling

### Data Protection
- No sensitive data in logs
- Encrypted communication with Google APIs
- Environment variable protection

## 📝 Usage Examples

### List Spreadsheets
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_spreadsheets",
    "arguments": {}
  }
}
```

### Create Spreadsheet
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_spreadsheet",
    "arguments": {
      "title": "My New Spreadsheet",
      "sheets": [
        {
          "title": "Sheet1",
          "gridProperties": {
            "rowCount": 1000,
            "columnCount": 26
          }
        }
      ]
    }
  }
}
```

### Update Cells
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "update_cells",
    "arguments": {
      "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "range": "Sheet1!A1:C3",
      "values": [
        ["Name", "Age", "City"],
        ["John", 30, "New York"],
        ["Jane", 25, "Los Angeles"]
      ]
    }
  }
}
``` 