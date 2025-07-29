import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';

/**
 * Google Sheets Client with authentication and API operations
 */
export class GoogleSheetsClient {
  constructor() {
    this.sheets = null;
    this.drive = null;
    this.auth = null;
  }

  /**
   * Initialize the Google Sheets client with authentication
   */
  async initialize() {
    try {
      this.auth = await this.setupAuthentication();
      
      // Handle different auth types
      if (this.auth.getClient) {
        // GoogleAuth instance (Service Account, ADC)
        this.authClient = await this.auth.getClient();
      } else {
        // OAuth2Client instance (OAuth2)
        this.authClient = this.auth;
      }
      
      // Initialize Google Sheets and Drive APIs
      this.sheets = google.sheets({ version: 'v4', auth: this.authClient });
      this.drive = google.drive({ version: 'v3', auth: this.authClient });
      
      console.error('Google Sheets client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Sheets client:', error);
      throw error;
    }
  }

  /**
   * Set up OAuth 2.0 authentication
   */
  async setupAuthentication() {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    // OAuth2 credentials for interactive use
    if (process.env.CREDENTIALS_PATH && process.env.TOKEN_PATH) {
      try {
        // Try multiple paths for credentials and token files
        const credentialsPaths = [
          process.env.CREDENTIALS_PATH,
          path.resolve(process.env.CREDENTIALS_PATH),
          path.join(process.cwd(), process.env.CREDENTIALS_PATH),
          './google-oauth-key.json',
          './credentials.json'
        ];
        
        const tokenPaths = [
          process.env.TOKEN_PATH,
          path.resolve(process.env.TOKEN_PATH),
          path.join(process.cwd(), process.env.TOKEN_PATH),
          './token.json'
        ];
        
        let credentials = null;
        let credentialsPath = null;
        
        // Try to read credentials file
        for (const credPath of credentialsPaths) {
          try {
            credentials = JSON.parse(await fs.readFile(credPath, 'utf8'));
            credentialsPath = credPath;
            console.error('Found credentials at:', credPath);
            break;
          } catch (error) {
            console.error('Failed to read credentials from:', credPath, error.message);
          }
        }
        
        if (!credentials) {
          throw new Error('Could not find or read credentials file from any of the attempted paths');
        }
        
        const oauth2Client = new google.auth.OAuth2(
          credentials.web.client_id,
          credentials.web.client_secret,
          credentials.web.redirect_uris[0]
        );

        // Try to read token file
        let token = null;
        let tokenPath = null;
        
        for (const tokPath of tokenPaths) {
          try {
            console.error('Attempting to read token from:', tokPath);
            token = JSON.parse(await fs.readFile(tokPath, 'utf8'));
            tokenPath = tokPath;
            console.error('Successfully read token from:', tokPath);
            break;
          } catch (error) {
            console.error('Failed to read token from:', tokPath, error.message);
          }
        }
        
        if (!token) {
          throw new Error('Could not find or read token file from any of the attempted paths');
        }
        
        // Check if token is expired (with 5 minute buffer)
        if (token.expiry_date && token.expiry_date < Date.now() + 300000) {
          console.error('OAuth token is expired or will expire soon');
          throw new Error('OAuth token expired');
        }
        
        oauth2Client.setCredentials(token);
        console.error('Using OAuth2 authentication with stored token');
        return oauth2Client;
      } catch (error) {
        console.error('OAuth2 authentication failed:', error.message);
        console.error('Token read error:', error.message);
        console.error('Token path attempted:', process.env.TOKEN_PATH);
        console.error('Current working directory:', process.cwd());
        console.error('No valid token found or token expired. OAuth2 setup requires interactive login.');
        throw new Error('OAuth2 token not found or expired. Please run authentication setup first.');
      }
    }

    throw new Error(
      'OAuth 2.0 authentication is required. Please set up the following:\n' +
      '1. CREDENTIALS_PATH environment variable (path to OAuth credentials JSON)\n' +
      '2. TOKEN_PATH environment variable (path to store OAuth tokens)\n' +
      '3. Run "npm run oauth:setup" to complete the OAuth flow'
    );
  }

  /**
   * List spreadsheets accessible to the authenticated user
   */
  async listSpreadsheets(folderId = null) {
    try {
      let query = "mimeType='application/vnd.google-apps.spreadsheet'";
      
      if (folderId || process.env.DRIVE_FOLDER_ID) {
        const targetFolderId = folderId || process.env.DRIVE_FOLDER_ID;
        query += ` and '${targetFolderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files.map(file => ({
        id: file.id,
        title: file.name,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
      }));
    } catch (error) {
      console.error('Error listing spreadsheets:', error);
      throw error;
    }
  }

  /**
   * Create a new spreadsheet
   */
  async createSpreadsheet(title, folderId = null) {
    try {
      const resource = {
        properties: {
          title,
        },
      };

      const response = await this.sheets.spreadsheets.create({
        resource,
      });

      const spreadsheetId = response.data.spreadsheetId;

      // Move to specified folder if provided
      if (folderId || process.env.DRIVE_FOLDER_ID) {
        const targetFolderId = folderId || process.env.DRIVE_FOLDER_ID;
        await this.drive.files.update({
          fileId: spreadsheetId,
          addParents: targetFolderId,
        });
      }

      return {
        spreadsheetId,
        title: response.data.properties.title,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      };
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  /**
   * Get data from a sheet range
   */
  async getSheetData(spreadsheetId, sheetName = "Sheet1", range = null) {
    try {
      const fullRange = range ? `${sheetName}!${range}` : sheetName;
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });

      return {
        values: response.data.values || [],
        range: response.data.range,
        majorDimension: response.data.majorDimension,
      };
    } catch (error) {
      console.error('Error getting sheet data:', error);
      throw error;
    }
  }

  /**
   * Update cells in a sheet
   */
  async updateCells(spreadsheetId, sheetName = "Sheet1", range, values) {
    try {
      const fullRange = `${sheetName}!${range}`;
      
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: fullRange,
        valueInputOption: 'RAW',
        resource: {
          values,
        },
      });

      return {
        updatedCells: response.data.updatedCells,
        updatedColumns: response.data.updatedColumns,
        updatedRows: response.data.updatedRows,
        updatedRange: response.data.updatedRange,
      };
    } catch (error) {
      console.error('Error updating cells:', error);
      throw error;
    }
  }

  /**
   * Append rows to a sheet
   */
  async appendRows(spreadsheetId, sheetName = "Sheet1", values) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values,
        },
      });

      return {
        updatedCells: response.data.updates.updatedCells,
        updatedColumns: response.data.updatedColumns,
        updatedRows: response.data.updatedRows,
        updatedRange: response.data.updates.updatedRange,
        tableRange: response.data.tableRange,
      };
    } catch (error) {
      console.error('Error appending rows:', error);
      throw error;
    }
  }

  /**
   * List all sheets in a spreadsheet
   */
  async listSheets(spreadsheetId) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties',
      });

      return response.data.sheets.map(sheet => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
        sheetType: sheet.properties.sheetType,
        gridProperties: sheet.properties.gridProperties,
      }));
    } catch (error) {
      console.error('Error listing sheets:', error);
      throw error;
    }
  }

  /**
   * Create a new sheet in a spreadsheet
   */
  async createSheet(spreadsheetId, title) {
    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title,
                },
              },
            },
          ],
        },
      });

      const sheet = response.data.replies[0].addSheet.properties;
      return {
        sheetId: sheet.sheetId,
        title: sheet.title,
        index: sheet.index,
      };
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple ranges
   */
  async batchUpdateCells(spreadsheetId, updates) {
    try {
      const data = updates.map(update => ({
        range: `${update.sheetName}!${update.range}`,
        values: update.values,
      }));

      const response = await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data,
        },
      });

      return {
        totalUpdatedCells: response.data.totalUpdatedCells,
        totalUpdatedColumns: response.data.totalUpdatedColumns,
        totalUpdatedRows: response.data.totalUpdatedRows,
        responses: response.data.responses,
      };
    } catch (error) {
      console.error('Error batch updating cells:', error);
      throw error;
    }
  }

  /**
   * Share spreadsheet with users
   */
  async shareSpreadsheet(spreadsheetId, recipients, sendNotification = true) {
    try {
      const results = {
        successes: [],
        failures: [],
      };

      for (const recipient of recipients) {
        try {
          await this.drive.permissions.create({
            fileId: spreadsheetId,
            sendNotificationEmail: sendNotification,
            resource: {
              role: recipient.role || 'reader',
              type: 'user',
              emailAddress: recipient.email,
            },
          });
          results.successes.push(recipient.email);
        } catch (error) {
          results.failures.push({
            email: recipient.email,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sharing spreadsheet:', error);
      throw error;
    }
  }

  /**
   * Get spreadsheet info
   */
  async getSpreadsheetInfo(spreadsheetId) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties,sheets.properties',
      });

      return {
        spreadsheetId: response.data.spreadsheetId,
        title: response.data.properties.title,
        locale: response.data.properties.locale,
        autoRecalc: response.data.properties.autoRecalc,
        timeZone: response.data.properties.timeZone,
        sheets: response.data.sheets.map(sheet => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title,
          index: sheet.properties.index,
          sheetType: sheet.properties.sheetType,
        })),
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      };
    } catch (error) {
      console.error('Error getting spreadsheet info:', error);
      throw error;
    }
  }
} 