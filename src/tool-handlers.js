import { z } from "zod";

/**
 * Tool handlers for Google Sheets MCP Server
 * These implement the actual functionality for each tool
 */

/**
 * Handle tool calls and route them to appropriate handlers
 */
export async function handleToolCall(request, googleSheetsClient) {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      // Spreadsheet Management
      case "list_spreadsheets":
        result = await handleListSpreadsheets(googleSheetsClient, args);
        break;
      case "create_spreadsheet":
        result = await handleCreateSpreadsheet(googleSheetsClient, args);
        break;
      case "get_spreadsheet_info":
        result = await handleGetSpreadsheetInfo(googleSheetsClient, args);
        break;

      // Sheet Management
      case "list_sheets":
        result = await handleListSheets(googleSheetsClient, args);
        break;
      case "create_sheet":
        result = await handleCreateSheet(googleSheetsClient, args);
        break;

      // Data Operations
      case "get_sheet_data":
        result = await handleGetSheetData(googleSheetsClient, args);
        break;
      case "update_cells":
        result = await handleUpdateCells(googleSheetsClient, args);
        break;
      case "append_rows":
        result = await handleAppendRows(googleSheetsClient, args);
        break;
      case "batch_update_cells":
        result = await handleBatchUpdateCells(googleSheetsClient, args);
        break;

      // Collaboration
      case "share_spreadsheet":
        result = await handleShareSpreadsheet(googleSheetsClient, args);
        break;

      // Utility
      case "clear_range":
        result = await handleClearRange(googleSheetsClient, args);
        break;
      case "find_and_replace":
        result = await handleFindAndReplace(googleSheetsClient, args);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

// Spreadsheet Management Handlers

async function handleListSpreadsheets(client, args) {
  const folderId = args.folder_id;
  const spreadsheets = await client.listSpreadsheets(folderId);
  
  return {
    success: true,
    data: {
      spreadsheets,
      count: spreadsheets.length,
    },
  };
}

async function handleCreateSpreadsheet(client, args) {
  const { title, folder_id } = args;
  const spreadsheet = await client.createSpreadsheet(title, folder_id);
  
  return {
    success: true,
    data: spreadsheet,
    message: `Created spreadsheet '${title}' successfully`,
  };
}

async function handleGetSpreadsheetInfo(client, args) {
  const { spreadsheet_id } = args;
  const info = await client.getSpreadsheetInfo(spreadsheet_id);
  
  return {
    success: true,
    data: info,
  };
}

// Sheet Management Handlers

async function handleListSheets(client, args) {
  const { spreadsheet_id } = args;
  const sheets = await client.listSheets(spreadsheet_id);
  
  return {
    success: true,
    data: {
      sheets,
      count: sheets.length,
    },
  };
}

async function handleCreateSheet(client, args) {
  const { spreadsheet_id, title } = args;
  const sheet = await client.createSheet(spreadsheet_id, title);
  
  return {
    success: true,
    data: sheet,
    message: `Created sheet '${title}' successfully`,
  };
}

// Data Operation Handlers

async function handleGetSheetData(client, args) {
  const { spreadsheet_id, sheet_name = "Sheet1", range } = args;
  const data = await client.getSheetData(spreadsheet_id, sheet_name, range);
  
  return {
    success: true,
    data: {
      ...data,
      rowCount: data.values.length,
      columnCount: data.values.length > 0 ? Math.max(...data.values.map(row => row.length)) : 0,
    },
  };
}

async function handleUpdateCells(client, args) {
  const { spreadsheet_id, sheet_name = "Sheet1", range, values } = args;
  
  // Validate input
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Values must be a non-empty 2D array");
  }
  
  const result = await client.updateCells(spreadsheet_id, sheet_name, range, values);
  
  return {
    success: true,
    data: result,
    message: `Updated ${result.updatedCells} cells in range ${range}`,
  };
}

async function handleAppendRows(client, args) {
  const { spreadsheet_id, sheet_name = "Sheet1", values } = args;
  
  // Validate input
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Values must be a non-empty 2D array");
  }
  
  const result = await client.appendRows(spreadsheet_id, sheet_name, values);
  
  return {
    success: true,
    data: result,
    message: `Appended ${values.length} row(s) to sheet '${sheet_name}'`,
  };
}

async function handleBatchUpdateCells(client, args) {
  const { spreadsheet_id, updates } = args;
  
  // Validate input
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("Updates must be a non-empty array");
  }
  
  const result = await client.batchUpdateCells(spreadsheet_id, updates);
  
  return {
    success: true,
    data: result,
    message: `Batch updated ${result.totalUpdatedCells} cells across ${updates.length} range(s)`,
  };
}

// Collaboration Handlers

async function handleShareSpreadsheet(client, args) {
  const { spreadsheet_id, recipients, send_notification = true } = args;
  
  // Validate recipients
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("Recipients must be a non-empty array");
  }
  
  for (const recipient of recipients) {
    if (!recipient.email) {
      throw new Error("Each recipient must have an email address");
    }
    if (recipient.role && !["reader", "commenter", "writer"].includes(recipient.role)) {
      throw new Error(`Invalid role '${recipient.role}'. Must be 'reader', 'commenter', or 'writer'`);
    }
  }
  
  const result = await client.shareSpreadsheet(spreadsheet_id, recipients, send_notification);
  
  return {
    success: true,
    data: result,
    message: `Shared spreadsheet with ${result.successes.length} recipient(s). ${result.failures.length} failed.`,
  };
}

// Utility Handlers

async function handleClearRange(client, args) {
  const { spreadsheet_id, sheet_name = "Sheet1", range } = args;
  
  // Clear range by updating with empty values
  // First, we need to determine the size of the range to clear
  const currentData = await client.getSheetData(spreadsheet_id, sheet_name, range);
  
  if (currentData.values.length === 0) {
    return {
      success: true,
      message: "Range is already empty",
      data: { clearedCells: 0 },
    };
  }
  
  // Create empty values array matching the current data size
  const emptyValues = currentData.values.map(row => 
    new Array(row.length).fill("")
  );
  
  const result = await client.updateCells(spreadsheet_id, sheet_name, range, emptyValues);
  
  return {
    success: true,
    data: { clearedCells: result.updatedCells },
    message: `Cleared ${result.updatedCells} cells in range ${range}`,
  };
}

async function handleFindAndReplace(client, args) {
  const { 
    spreadsheet_id, 
    sheet_name = "Sheet1", 
    find, 
    replace, 
    range,
    match_case = false,
    match_entire_cell = false 
  } = args;
  
  // Get the data from the range (or entire sheet if no range specified)
  const data = await client.getSheetData(spreadsheet_id, sheet_name, range);
  
  if (data.values.length === 0) {
    return {
      success: true,
      data: { replacements: 0 },
      message: "No data found in the specified range",
    };
  }
  
  let replacements = 0;
  const updatedValues = data.values.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return cell;
      
      const cellStr = String(cell);
      let shouldReplace = false;
      
      if (match_entire_cell) {
        if (match_case) {
          shouldReplace = cellStr === find;
        } else {
          shouldReplace = cellStr.toLowerCase() === find.toLowerCase();
        }
      } else {
        if (match_case) {
          shouldReplace = cellStr.includes(find);
        } else {
          shouldReplace = cellStr.toLowerCase().includes(find.toLowerCase());
        }
      }
      
      if (shouldReplace) {
        replacements++;
        if (match_entire_cell) {
          return replace;
        } else {
          if (match_case) {
            return cellStr.replaceAll(find, replace);
          } else {
            return cellStr.replaceAll(new RegExp(find, 'gi'), replace);
          }
        }
      }
      
      return cell;
    })
  );
  
  if (replacements > 0) {
    // Update the range with the modified values
    const targetRange = range || sheet_name;
    await client.updateCells(spreadsheet_id, sheet_name, targetRange, updatedValues);
  }
  
  return {
    success: true,
    data: { replacements },
    message: `Made ${replacements} replacement(s) of '${find}' with '${replace}'`,
  };
} 