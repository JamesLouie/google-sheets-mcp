#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GoogleSheetsClient } from "./google-sheets-client.js";
import { toolDefinitions } from "./tools.js";
import { handleToolCall } from "./tool-handlers.js";
import { OAuthStartup } from "./oauth-startup.js";
import dotenv from 'dotenv';
import { z } from "zod";
import path from 'path';
import fs from 'fs/promises';

// Load environment variables from .env file
// Temporarily suppress stderr during dotenv loading to avoid MCP protocol interference
const originalStderr = process.stderr.write;
process.stderr.write = () => {};
try {
  dotenv.config();
} finally {
  process.stderr.write = originalStderr;
}

/**
 * Validate OAuth environment variables and provide fallbacks
 */
function validateEnvironment() {
  // Check if OAuth credentials are configured
  if (!process.env.CREDENTIALS_PATH) {
    console.error('Error: OAuth credentials not configured.');
    console.error('Please set the following environment variables:');
    console.error('- CREDENTIALS_PATH: Path to OAuth credentials JSON file');
    console.error('- TOKEN_PATH: Path to store OAuth tokens');
    console.error('');
    console.error('Example:');
    console.error('export CREDENTIALS_PATH="./credentials.json"');
    console.error('export TOKEN_PATH="./token.json"');
    process.exit(1);
  }
  
  // Validate OAuth configuration
  if (!process.env.TOKEN_PATH) {
    console.error('Error: CREDENTIALS_PATH requires TOKEN_PATH to be set');
    console.error('Please set TOKEN_PATH environment variable');
    process.exit(1);
  }

  // Debug: Log the current working directory and file paths
  console.error('Debug: Current working directory:', process.cwd());
  console.error('Debug: CREDENTIALS_PATH:', process.env.CREDENTIALS_PATH);
  console.error('Debug: TOKEN_PATH:', process.env.TOKEN_PATH);
  
  // Check if files exist and are readable
  try {
    const credentialsPath = path.resolve(process.env.CREDENTIALS_PATH);
    const tokenPath = path.resolve(process.env.TOKEN_PATH);
    
    console.error('Debug: Resolved CREDENTIALS_PATH:', credentialsPath);
    console.error('Debug: Resolved TOKEN_PATH:', tokenPath);
    
    // Test file access
    fs.access(credentialsPath, fs.constants.R_OK)
      .then(() => console.error('Debug: Credentials file is readable'))
      .catch(err => console.error('Debug: Credentials file access error:', err.message));
      
    fs.access(tokenPath, fs.constants.R_OK)
      .then(() => console.error('Debug: Token file is readable'))
      .catch(err => console.error('Debug: Token file access error:', err.message));
      
  } catch (error) {
    console.error('Debug: Error resolving paths:', error.message);
  }
}

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
    // Handle OAuth startup if needed
    const oauthStartup = new OAuthStartup();
    const oauthResult = await oauthStartup.handleStartupOAuth();
    
    if (!oauthResult.success) {
      console.error("Failed to handle OAuth startup:", oauthResult.error);
      process.exit(1);
    }

    // Initialize Google Sheets client
    await this.googleSheetsClient.initialize();

    // Start the server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("Google Sheets MCP server running on stdio");
  }
}

// Validate environment and start the server
validateEnvironment();
const server = new GoogleSheetsMCPServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
}); 