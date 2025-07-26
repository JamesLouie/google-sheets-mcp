#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GoogleSheetsClient } from "./google-sheets-client.js";
import { toolDefinitions } from "./tools.js";
import { handleToolCall } from "./tool-handlers.js";
import { z } from "zod";

/**
 * Google Sheets MCP Server
 * Provides integration with Google Sheets API through MCP protocol
 */
class GoogleSheetsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "google-sheets-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.googleSheetsClient = new GoogleSheetsClient();
    this.setupHandlers();
  }

  setupHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolDefinitions,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await handleToolCall(request, this.googleSheetsClient);
    });
  }

  async start() {
    // Initialize Google Sheets client
    await this.googleSheetsClient.initialize();

    // Start the server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("Google Sheets MCP server running on stdio");
  }
}

// Start the server
const server = new GoogleSheetsMCPServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
}); 