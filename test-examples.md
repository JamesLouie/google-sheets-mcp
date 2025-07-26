# Test Examples for Google Sheets MCP Server

This file contains example data and scenarios you can use with the MCP Inspector to test the Google Sheets server.

## Prerequisites

Before testing, make sure you have:
1. Authentication configured (see README.md)
2. A test spreadsheet created (or use the `create_spreadsheet` tool)
3. The MCP Inspector running: `npm run inspector`

## Test Scenarios

### 1. Basic Setup and Discovery

#### List Available Spreadsheets
```json
{
  "tool": "list_spreadsheets"
}
```

#### Create a Test Spreadsheet
```json
{
  "tool": "create_spreadsheet",
  "arguments": {
    "title": "MCP Test Spreadsheet"
  }
}
```

### 2. Sheet Management

#### List Sheets in Spreadsheet
```json
{
  "tool": "list_sheets",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE"
  }
}
```

#### Create a New Sheet
```json
{
  "tool": "create_sheet",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "title": "Test Data"
  }
}
```

### 3. Data Operations

#### Add Headers and Sample Data
```json
{
  "tool": "update_cells",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1",
    "range": "A1:D1",
    "values": [
      ["Name", "Email", "Age", "Department"]
    ]
  }
}
```

#### Add Sample Records
```json
{
  "tool": "append_rows",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1",
    "values": [
      ["John Doe", "john@example.com", 30, "Engineering"],
      ["Jane Smith", "jane@example.com", 28, "Marketing"],
      ["Bob Johnson", "bob@example.com", 35, "Sales"],
      ["Alice Brown", "alice@example.com", 32, "HR"]
    ]
  }
}
```

#### Read All Data
```json
{
  "tool": "get_sheet_data",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1"
  }
}
```

#### Read Specific Range
```json
{
  "tool": "get_sheet_data",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1",
    "range": "A1:B5"
  }
}
```

### 4. Batch Operations

#### Update Multiple Ranges at Once
```json
{
  "tool": "batch_update_cells",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "updates": [
      {
        "sheet_name": "Sheet1",
        "range": "E1",
        "values": [["Status"]]
      },
      {
        "sheet_name": "Sheet1",
        "range": "E2:E5",
        "values": [["Active"], ["Active"], ["Inactive"], ["Active"]]
      },
      {
        "sheet_name": "Sheet1",
        "range": "F1",
        "values": [["Notes"]]
      }
    ]
  }
}
```

### 5. Utility Operations

#### Find and Replace
```json
{
  "tool": "find_and_replace",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1",
    "find": "example.com",
    "replace": "company.com",
    "match_case": false
  }
}
```

#### Clear a Range
```json
{
  "tool": "clear_range",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1",
    "range": "F2:F5"
  }
}
```

### 6. Collaboration

#### Share Spreadsheet
```json
{
  "tool": "share_spreadsheet",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "recipients": [
      {
        "email": "test@example.com",
        "role": "reader"
      },
      {
        "email": "editor@example.com", 
        "role": "writer"
      }
    ],
    "send_notification": false
  }
}
```

### 7. Advanced Data Scenarios

#### Create a Financial Report Template
```json
{
  "tool": "batch_update_cells",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "updates": [
      {
        "sheet_name": "Sheet1",
        "range": "A1:C1",
        "values": [["Financial Report - Q1 2024", "", ""]]
      },
      {
        "sheet_name": "Sheet1",
        "range": "A3:C3",
        "values": [["Category", "Budget", "Actual"]]
      },
      {
        "sheet_name": "Sheet1",
        "range": "A4:C8",
        "values": [
          ["Marketing", 50000, 48500],
          ["Engineering", 200000, 195000],
          ["Sales", 100000, 105000],
          ["Operations", 75000, 73000],
          ["Total", 425000, 421500]
        ]
      }
    ]
  }
}
```

#### Create a Task Tracker
```json
{
  "tool": "create_sheet",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "title": "Task Tracker"
  }
}
```

```json
{
  "tool": "update_cells",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Task Tracker",
    "range": "A1:F1",
    "values": [
      ["Task ID", "Description", "Assignee", "Priority", "Status", "Due Date"]
    ]
  }
}
```

```json
{
  "tool": "append_rows",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Task Tracker",
    "values": [
      ["TSK-001", "Implement authentication", "John Doe", "High", "In Progress", "2024-01-15"],
      ["TSK-002", "Design user interface", "Jane Smith", "Medium", "Not Started", "2024-01-20"],
      ["TSK-003", "Set up database", "Bob Johnson", "High", "Completed", "2024-01-10"],
      ["TSK-004", "Write documentation", "Alice Brown", "Low", "In Progress", "2024-01-25"]
    ]
  }
}
```

## Error Testing

### Test Authentication Errors
Try calling any tool without proper authentication to see error handling.

### Test Invalid Parameters
```json
{
  "tool": "get_sheet_data",
  "arguments": {
    "spreadsheet_id": "invalid_id",
    "sheet_name": "NonExistent"
  }
}
```

### Test Invalid Ranges
```json
{
  "tool": "update_cells",
  "arguments": {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
    "sheet_name": "Sheet1",
    "range": "INVALID_RANGE",
    "values": [["test"]]
  }
}
```

## Tips for Testing

1. **Start Small**: Begin with `list_spreadsheets` to verify authentication
2. **Use the Inspector**: The web interface makes it easy to copy/paste these examples
3. **Replace IDs**: Remember to replace `YOUR_SPREADSHEET_ID_HERE` with actual spreadsheet IDs
4. **Check Responses**: Pay attention to the response structure and error messages
5. **Test Edge Cases**: Try empty values, large datasets, and invalid inputs
6. **Monitor Quotas**: Be aware of Google API quotas when testing extensively

## Common Test Spreadsheet ID Formats

Google Spreadsheet IDs look like:
- `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v`

You can find the ID in the URL:
`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit` 