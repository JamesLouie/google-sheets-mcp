/**
 * Tool definitions for Google Sheets MCP Server
 * These define the available operations that can be performed
 */
export const toolDefinitions = [
  // Spreadsheet Management
  {
    name: "list_spreadsheets",
    description: "List all spreadsheets accessible to the authenticated user. Optionally filter by folder.",
    inputSchema: {
      type: "object",
      properties: {
        folder_id: {
          type: "string",
          description: "Optional Google Drive folder ID to filter spreadsheets. If not provided, uses DRIVE_FOLDER_ID environment variable.",
        },
      },
    },
  },
  {
    name: "create_spreadsheet",
    description: "Create a new spreadsheet with the specified title.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title for the new spreadsheet.",
        },
        folder_id: {
          type: "string",
          description: "Optional Google Drive folder ID to create the spreadsheet in. If not provided, uses DRIVE_FOLDER_ID environment variable.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "get_spreadsheet_info",
    description: "Get detailed information about a spreadsheet including its properties and sheets.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
      },
      required: ["spreadsheet_id"],
    },
  },

  // Sheet Management
  {
    name: "list_sheets",
    description: "List all sheets (tabs) within a spreadsheet.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
      },
      required: ["spreadsheet_id"],
    },
  },
  {
    name: "create_sheet",
    description: "Create a new sheet (tab) within an existing spreadsheet.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        title: {
          type: "string",
          description: "The title for the new sheet.",
        },
      },
      required: ["spreadsheet_id", "title"],
    },
  },

  // Data Operations
  {
    name: "get_sheet_data",
    description: "Read data from a specified range in a sheet. If no range is provided, reads the entire sheet. If no sheet_name is provided, defaults to 'Sheet1'.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        sheet_name: {
          type: "string",
          description: "The name of the sheet to read from. Defaults to 'Sheet1' if not provided.",
          default: "Sheet1",
        },
        range: {
          type: "string",
          description: "Optional A1 notation range (e.g., 'A1:C10', 'B2:D'). If not provided, reads the entire sheet.",
        },
      },
      required: ["spreadsheet_id"],
    },
  },
  {
    name: "update_cells",
    description: "Update cells in a specific range with new values. Overwrites existing data in the range. If no sheet_name is provided, defaults to 'Sheet1'.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        sheet_name: {
          type: "string",
          description: "The name of the sheet to update. Defaults to 'Sheet1' if not provided.",
          default: "Sheet1",
        },
        range: {
          type: "string",
          description: "A1 notation range to update (e.g., 'A1:C3').",
        },
        values: {
          type: "array",
          description: "2D array of values to write. Each inner array represents a row.",
          items: {
            type: "array",
            items: {
              type: ["string", "number", "boolean", "null"],
            },
          },
        },
      },
      required: ["spreadsheet_id", "range", "values"],
    },
  },
  {
    name: "append_rows",
    description: "Append new rows to the end of a sheet (after the last row with data). If no sheet_name is provided, defaults to 'Sheet1'.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        sheet_name: {
          type: "string",
          description: "The name of the sheet to append to. Defaults to 'Sheet1' if not provided.",
          default: "Sheet1",
        },
        values: {
          type: "array",
          description: "2D array of values to append. Each inner array represents a row.",
          items: {
            type: "array",
            items: {
              type: ["string", "number", "boolean", "null"],
            },
          },
        },
      },
      required: ["spreadsheet_id", "values"],
    },
  },
  {
    name: "batch_update_cells",
    description: "Update multiple ranges within a spreadsheet in a single operation for better performance.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        updates: {
          type: "array",
          description: "Array of update operations.",
          items: {
            type: "object",
            properties: {
              sheet_name: {
                type: "string",
                description: "The name of the sheet to update.",
              },
              range: {
                type: "string",
                description: "A1 notation range to update (e.g., 'A1:C3').",
              },
              values: {
                type: "array",
                description: "2D array of values to write.",
                items: {
                  type: "array",
                  items: {
                    type: ["string", "number", "boolean", "null"],
                  },
                },
              },
            },
            required: ["sheet_name", "range", "values"],
          },
        },
      },
      required: ["spreadsheet_id", "updates"],
    },
  },

  // Collaboration
  {
    name: "share_spreadsheet",
    description: "Share a spreadsheet with other users by email, granting them specific permissions.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet to share.",
        },
        recipients: {
          type: "array",
          description: "Array of recipients to share with.",
          items: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "Email address of the recipient.",
              },
              role: {
                type: "string",
                enum: ["reader", "commenter", "writer"],
                description: "Permission level to grant. 'reader' can view, 'commenter' can view and comment, 'writer' can edit.",
                default: "reader",
              },
            },
            required: ["email"],
          },
        },
        send_notification: {
          type: "boolean",
          description: "Whether to send email notifications to recipients.",
          default: true,
        },
      },
      required: ["spreadsheet_id", "recipients"],
    },
  },

  // Utility
  {
    name: "clear_range",
    description: "Clear all values in a specified range while preserving formatting. If no sheet_name is provided, defaults to 'Sheet1'.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        sheet_name: {
          type: "string",
          description: "The name of the sheet. Defaults to 'Sheet1' if not provided.",
          default: "Sheet1",
        },
        range: {
          type: "string",
          description: "A1 notation range to clear (e.g., 'A1:C10').",
        },
      },
      required: ["spreadsheet_id", "range"],
    },
  },
  {
    name: "find_and_replace",
    description: "Find and replace text values within a sheet or specific range. If no sheet_name is provided, defaults to 'Sheet1'.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The ID of the spreadsheet.",
        },
        sheet_name: {
          type: "string",
          description: "The name of the sheet to search in. Defaults to 'Sheet1' if not provided.",
          default: "Sheet1",
        },
        find: {
          type: "string",
          description: "The text to find.",
        },
        replace: {
          type: "string",
          description: "The text to replace with.",
        },
        range: {
          type: "string",
          description: "Optional A1 notation range to limit the search. If not provided, searches the entire sheet.",
        },
        match_case: {
          type: "boolean",
          description: "Whether the search should be case-sensitive.",
          default: false,
        },
        match_entire_cell: {
          type: "boolean",
          description: "Whether to match the entire cell content.",
          default: false,
        },
      },
      required: ["spreadsheet_id", "find", "replace"],
    },
  },
]; 