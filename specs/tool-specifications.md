# Tool Specifications

## 📋 Overview

This document provides detailed specifications for all MCP tools implemented in the Google Sheets MCP server. Each tool is defined with its purpose, input/output schemas, behavior, and usage examples.

## 🛠️ Tool Categories

### 1. Spreadsheet Management Tools
### 2. Sheet Management Tools  
### 3. Data Operation Tools
### 4. Batch Operation Tools
### 5. Utility Tools
### 6. Collaboration Tools

## 📊 Tool Specifications

### 1. Spreadsheet Management

#### `list_spreadsheets`
**Purpose**: Retrieve a list of all spreadsheets accessible to the authenticated user.

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

**Output Schema**:
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
              "modifiedTime": { "type": "string" },
              "permissions": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "role": { "type": "string" },
                    "type": { "type": "string" }
                  }
                }
              }
            }
          }
        },
        "count": { "type": "number" }
      }
    }
  }
}
```

**Behavior**:
- Lists all spreadsheets the authenticated user has access to
- Optionally filters by Google Drive folder ID
- Returns metadata including ID, name, URL, and timestamps
- Includes permission information for each spreadsheet

**Error Cases**:
- `AUTH_REQUIRED`: No authentication configured
- `INSUFFICIENT_PERMISSIONS`: Missing Drive API permissions
- `INVALID_FOLDER_ID`: Invalid folder ID format

**Example Usage**:
```json
{
  "name": "list_spreadsheets",
  "arguments": {
    "folder_id": "1ABC123DEF456"
  }
}
```

#### `create_spreadsheet`
**Purpose**: Create a new Google Sheets spreadsheet with specified properties.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Title of the spreadsheet",
      "minLength": 1,
      "maxLength": 255
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
          "title": { 
            "type": "string",
            "minLength": 1,
            "maxLength": 255
          },
          "gridProperties": {
            "type": "object",
            "properties": {
              "rowCount": { 
                "type": "number",
                "minimum": 1,
                "maximum": 10000000,
                "default": 1000
              },
              "columnCount": { 
                "type": "number",
                "minimum": 1,
                "maximum": 18278,
                "default": 26
              }
            }
          }
        },
        "required": ["title"]
      }
    }
  },
  "required": ["title"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "spreadsheetId": { "type": "string" },
        "title": { "type": "string" },
        "url": { "type": "string" },
        "sheets": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "sheetId": { "type": "number" },
              "title": { "type": "string" },
              "index": { "type": "number" }
            }
          }
        }
      }
    }
  }
}
```

**Behavior**:
- Creates a new spreadsheet with the specified title
- Optionally places it in a specific Google Drive folder
- Creates initial sheets with specified properties
- Returns the new spreadsheet ID and metadata

**Error Cases**:
- `INVALID_TITLE`: Title is empty or too long
- `INVALID_FOLDER_ID`: Folder doesn't exist or no access
- `QUOTA_EXCEEDED`: User has reached spreadsheet limit

**Example Usage**:
```json
{
  "name": "create_spreadsheet",
  "arguments": {
    "title": "Project Budget 2024",
    "sheets": [
      {
        "title": "Income",
        "gridProperties": {
          "rowCount": 100,
          "columnCount": 10
        }
      },
      {
        "title": "Expenses",
        "gridProperties": {
          "rowCount": 200,
          "columnCount": 15
        }
      }
    ]
  }
}
```

### 2. Sheet Management

#### `get_sheet_data`
**Purpose**: Retrieve data from a specific range in a spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID",
      "pattern": "^[a-zA-Z0-9-_]+$"
    },
    "range": {
      "type": "string",
      "description": "A1 notation range (e.g., 'Sheet1!A1:D10')",
      "pattern": "^[A-Za-z0-9_]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$"
    },
    "value_render_option": {
      "type": "string",
      "enum": ["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"],
      "default": "FORMATTED_VALUE",
      "description": "How values should be rendered"
    }
  },
  "required": ["spreadsheet_id", "range"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "range": { "type": "string" },
        "majorDimension": { "type": "string" },
        "values": {
          "type": "array",
          "items": {
            "type": "array",
            "items": { "type": ["string", "number", "boolean", "null"] }
          }
        }
      }
    }
  }
}
```

**Behavior**:
- Retrieves data from the specified range
- Supports different value render options
- Returns data in row-major format by default
- Handles empty ranges gracefully

**Error Cases**:
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID format
- `SPREADSHEET_NOT_FOUND`: Spreadsheet doesn't exist
- `INVALID_RANGE`: Invalid A1 notation range
- `SHEET_NOT_FOUND`: Sheet doesn't exist

**Example Usage**:
```json
{
  "name": "get_sheet_data",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:D10",
    "value_render_option": "FORMATTED_VALUE"
  }
}
```

#### `update_cells`
**Purpose**: Update cell values in a spreadsheet range.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID",
      "pattern": "^[a-zA-Z0-9-_]+$"
    },
    "range": {
      "type": "string",
      "description": "A1 notation range",
      "pattern": "^[A-Za-z0-9_]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$"
    },
    "values": {
      "type": "array",
      "items": {
        "type": "array",
        "items": { "type": ["string", "number", "boolean"] }
      },
      "minItems": 1
    },
    "value_input_option": {
      "type": "string",
      "enum": ["RAW", "USER_ENTERED"],
      "default": "USER_ENTERED",
      "description": "How input data should be interpreted"
    }
  },
  "required": ["spreadsheet_id", "range", "values"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "updatedRange": { "type": "string" },
        "updatedRows": { "type": "number" },
        "updatedColumns": { "type": "number" },
        "updatedCells": { "type": "number" }
      }
    }
  }
}
```

**Behavior**:
- Updates cells in the specified range
- Supports different input options (RAW vs USER_ENTERED)
- Returns update statistics
- Handles formula evaluation when using USER_ENTERED

**Error Cases**:
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID
- `SPREADSHEET_NOT_FOUND`: Spreadsheet doesn't exist
- `INVALID_RANGE`: Invalid A1 notation
- `VALUE_OUT_OF_RANGE`: Values exceed spreadsheet limits

**Example Usage**:
```json
{
  "name": "update_cells",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:C3",
    "values": [
      ["Name", "Age", "City"],
      ["John Doe", 30, "New York"],
      ["Jane Smith", 25, "Los Angeles"]
    ],
    "value_input_option": "USER_ENTERED"
  }
}
```

### 3. Sheet Operations

#### `add_sheet`
**Purpose**: Add a new sheet to an existing spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID",
      "pattern": "^[a-zA-Z0-9-_]+$"
    },
    "title": {
      "type": "string",
      "description": "Title of the new sheet",
      "minLength": 1,
      "maxLength": 255
    },
    "grid_properties": {
      "type": "object",
      "properties": {
        "row_count": { 
          "type": "number",
          "minimum": 1,
          "maximum": 10000000,
          "default": 1000
        },
        "column_count": { 
          "type": "number",
          "minimum": 1,
          "maximum": 18278,
          "default": 26
        }
      }
    }
  },
  "required": ["spreadsheet_id", "title"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "sheetId": { "type": "number" },
        "title": { "type": "string" },
        "index": { "type": "number" },
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
}
```

**Behavior**:
- Adds a new sheet to the specified spreadsheet
- Sets grid properties (rows and columns)
- Returns the new sheet metadata
- Handles duplicate sheet names gracefully

**Error Cases**:
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID
- `SPREADSHEET_NOT_FOUND`: Spreadsheet doesn't exist
- `SHEET_ALREADY_EXISTS`: Sheet with same name exists
- `INVALID_TITLE`: Invalid sheet title

**Example Usage**:
```json
{
  "name": "add_sheet",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "title": "Q4 Data",
    "grid_properties": {
      "row_count": 500,
      "column_count": 20
    }
  }
}
```

#### `delete_sheet`
**Purpose**: Delete a sheet from a spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID",
      "pattern": "^[a-zA-Z0-9-_]+$"
    },
    "sheet_id": {
      "type": "number",
      "description": "Sheet ID to delete",
      "minimum": 0
    }
  },
  "required": ["spreadsheet_id", "sheet_id"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "deletedSheetId": { "type": "number" },
        "message": { "type": "string" }
      }
    }
  }
}
```

**Behavior**:
- Deletes the specified sheet by ID
- Cannot delete the last sheet in a spreadsheet
- Returns confirmation of deletion
- Handles non-existent sheets gracefully

**Error Cases**:
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID
- `SPREADSHEET_NOT_FOUND`: Spreadsheet doesn't exist
- `SHEET_NOT_FOUND`: Sheet doesn't exist
- `CANNOT_DELETE_LAST_SHEET`: Attempting to delete last sheet

**Example Usage**:
```json
{
  "name": "delete_sheet",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "sheet_id": 1234567890
  }
}
```

### 4. Batch Operations

#### `batch_update`
**Purpose**: Perform multiple operations in a single request for efficiency.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID",
      "pattern": "^[a-zA-Z0-9-_]+$"
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
          },
          "addSheet": {
            "type": "object",
            "properties": {
              "properties": { "type": "object" }
            }
          }
        }
      },
      "minItems": 1,
      "maxItems": 100
    }
  },
  "required": ["spreadsheet_id", "requests"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "replies": {
          "type": "array",
          "items": { "type": "object" }
        },
        "updatedSpreadsheet": {
          "type": "object",
          "properties": {
            "spreadsheetId": { "type": "string" },
            "updatedRanges": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

**Behavior**:
- Executes multiple operations atomically
- Supports various operation types
- Returns results for all operations
- Handles partial failures gracefully

**Error Cases**:
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID
- `TOO_MANY_REQUESTS`: Exceeds batch request limit
- `INVALID_REQUEST`: Invalid request format
- `PARTIAL_FAILURE`: Some operations failed

**Example Usage**:
```json
{
  "name": "batch_update",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "requests": [
      {
        "updateCells": {
          "range": {
            "sheetId": 0,
            "startRowIndex": 0,
            "endRowIndex": 1,
            "startColumnIndex": 0,
            "endColumnIndex": 3
          },
          "rows": [
            {
              "values": [
                { "userEnteredValue": { "stringValue": "Header 1" } },
                { "userEnteredValue": { "stringValue": "Header 2" } },
                { "userEnteredValue": { "stringValue": "Header 3" } }
              ]
            }
          ],
          "fields": "userEnteredValue"
        }
      }
    ]
  }
}
```

### 5. Utility Functions

#### `get_spreadsheet_info`
**Purpose**: Get detailed information about a spreadsheet.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheet_id": {
      "type": "string",
      "description": "Google Sheets spreadsheet ID",
      "pattern": "^[a-zA-Z0-9-_]+$"
    }
  },
  "required": ["spreadsheet_id"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "spreadsheetId": { "type": "string" },
        "title": { "type": "string" },
        "url": { "type": "string" },
        "sheets": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "sheetId": { "type": "number" },
              "title": { "type": "string" },
              "index": { "type": "number" },
              "gridProperties": {
                "type": "object",
                "properties": {
                  "rowCount": { "type": "number" },
                  "columnCount": { "type": "number" }
                }
              }
            }
          }
        },
        "properties": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "locale": { "type": "string" },
            "timeZone": { "type": "string" }
          }
        }
      }
    }
  }
}
```

**Behavior**:
- Retrieves comprehensive spreadsheet metadata
- Includes all sheet information
- Returns properties and settings
- Provides access URLs

**Error Cases**:
- `INVALID_SPREADSHEET_ID`: Invalid spreadsheet ID
- `SPREADSHEET_NOT_FOUND`: Spreadsheet doesn't exist
- `ACCESS_DENIED`: No permission to access spreadsheet

**Example Usage**:
```json
{
  "name": "get_spreadsheet_info",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  }
}
```

#### `search_spreadsheets`
**Purpose**: Search for spreadsheets by name or content.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query",
      "minLength": 1
    },
    "folder_id": {
      "type": "string",
      "description": "Optional folder ID to limit search"
    },
    "max_results": {
      "type": "number",
      "default": 10,
      "minimum": 1,
      "maximum": 100,
      "description": "Maximum number of results to return"
    }
  },
  "required": ["query"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "files": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "mimeType": { "type": "string" },
              "createdTime": { "type": "string" },
              "modifiedTime": { "type": "string" },
              "parents": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        },
        "count": { "type": "number" }
      }
    }
  }
}
```

**Behavior**:
- Searches for spreadsheets matching the query
- Supports folder-scoped searches
- Returns metadata for matching files
- Respects user permissions

**Error Cases**:
- `INVALID_QUERY`: Empty or invalid search query
- `INVALID_FOLDER_ID`: Invalid folder ID
- `SEARCH_FAILED`: Search operation failed

**Example Usage**:
```json
{
  "name": "search_spreadsheets",
  "arguments": {
    "query": "budget 2024",
    "max_results": 20
  }
}
```

## 🔄 Tool Lifecycle

### Tool Registration
1. Tool defined in `src/tools.js`
2. Handler implemented in `src/tool-handlers.js`
3. Registered with MCP server in `src/index.js`
4. Available for client discovery

### Tool Execution
1. Client sends tool call request
2. Server validates input schema
3. Handler executes business logic
4. Response formatted and returned
5. Errors handled gracefully

### Tool Validation
- Input schema validation using Zod
- Output schema validation
- Error handling and logging
- Performance monitoring

## 📈 Performance Considerations

### Rate Limiting
- Respect Google API quotas
- Implement exponential backoff
- Queue requests when necessary
- Monitor usage patterns

### Caching
- Cache spreadsheet metadata
- Cache authentication tokens
- Implement request deduplication
- Use appropriate cache TTLs

### Optimization
- Batch operations for efficiency
- Minimize API calls
- Use appropriate value render options
- Optimize data transfer

## 🔒 Security Considerations

### Input Validation
- Validate all tool inputs
- Sanitize user-provided data
- Prevent injection attacks
- Handle malformed requests

### Access Control
- Respect user permissions
- Validate spreadsheet access
- Check folder permissions
- Handle access denied errors

### Data Protection
- No sensitive data in logs
- Secure credential handling
- Encrypted communication
- Audit trail maintenance 