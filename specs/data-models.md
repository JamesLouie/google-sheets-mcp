# Data Models Specification

## 📋 Overview

This document defines all data models, schemas, and data structures used throughout the Google Sheets MCP server. These models ensure consistency, type safety, and proper validation across the application.

## 🏗️ Data Model Architecture

### Model Categories

1. **MCP Protocol Models** - Request/response structures
2. **Google Sheets Models** - Spreadsheet and sheet data
3. **Authentication Models** - Credential and token structures
4. **Error Models** - Error response formats
5. **Utility Models** - Helper data structures

## 📊 Core Data Models

### 1. MCP Protocol Models

#### Tool Definition Schema
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
```

#### Tool Call Request Schema
```typescript
interface ToolCallRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "tools/call";
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}
```

#### Tool Call Response Schema
```typescript
interface ToolCallResponse {
  jsonrpc: "2.0";
  id: string | number;
  result: {
    content: Array<{
      type: "text";
      text: string;
    }>;
    isError?: boolean;
  };
}
```

#### List Tools Response Schema
```typescript
interface ListToolsResponse {
  jsonrpc: "2.0";
  id: string | number;
  result: {
    tools: ToolDefinition[];
  };
}
```

### 2. Google Sheets Models

#### Spreadsheet Model
```typescript
interface Spreadsheet {
  spreadsheetId: string;
  title: string;
  url: string;
  createdTime: string;
  modifiedTime: string;
  sheets: Sheet[];
  properties: SpreadsheetProperties;
}

interface SpreadsheetProperties {
  title: string;
  locale: string;
  timeZone: string;
  autoRecalc: string;
  defaultFormat: CellFormat;
}

interface Sheet {
  sheetId: number;
  title: string;
  index: number;
  sheetType: string;
  gridProperties: GridProperties;
  hidden: boolean;
  tabColor: Color;
  rightToLeft: boolean;
}

interface GridProperties {
  rowCount: number;
  columnCount: number;
  frozenRowCount: number;
  frozenColumnCount: number;
  hideGridlines: boolean;
  rowGroupControlAfter: boolean;
  columnGroupControlAfter: boolean;
}
```

#### Cell Data Models
```typescript
interface CellData {
  userEnteredValue: ExtendedValue;
  effectiveValue: ExtendedValue;
  formattedValue: string;
  userEnteredFormat: CellFormat;
  effectiveFormat: CellFormat;
  hyperlink: string;
  note: string;
  pivotTable: PivotTable;
  dataValidation: DataValidationRule;
}

interface ExtendedValue {
  stringValue?: string;
  numberValue?: number;
  boolValue?: boolean;
  formulaValue?: string;
  errorValue?: ErrorValue;
}

interface CellFormat {
  numberFormat: NumberFormat;
  backgroundColor: Color;
  borders: Borders;
  padding: Padding;
  horizontalAlignment: string;
  verticalAlignment: string;
  wrapStrategy: string;
  textDirection: string;
  textFormat: TextFormat;
  hyperlinkDisplayType: string;
  textRotation: TextRotation;
}

interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}
```

#### Range Models
```typescript
interface GridRange {
  sheetId: number;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

interface A1Range {
  sheetName: string;
  startCell: string;
  endCell: string;
}

interface RangeData {
  range: string;
  majorDimension: "ROWS" | "COLUMNS";
  values: Array<Array<string | number | boolean | null>>;
}
```

### 3. Authentication Models

#### Service Account Credentials
```typescript
interface ServiceAccountCredentials {
  type: "service_account";
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}
```

#### OAuth 2.0 Credentials
```typescript
interface OAuth2Credentials {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
    javascript_origins: string[];
  };
}
```

#### OAuth 2.0 Token
```typescript
interface OAuth2Token {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: "Bearer";
  expiry_date: number;
}
```

### 4. Error Models

#### Error Response Schema
```typescript
interface ErrorResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError: true;
  metadata?: {
    errorCode: string;
    timestamp: string;
    requestId: string;
  };
}
```

#### Error Log Entry
```typescript
interface ErrorLogEntry {
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  toolName: string;
  userId?: string;
  requestId: string;
  stackTrace?: string;
  context: Record<string, any>;
}
```

### 5. Utility Models

#### Request Context
```typescript
interface RequestContext {
  requestId: string;
  userId?: string;
  timestamp: string;
  toolName: string;
  parameters: Record<string, any>;
}
```

#### Performance Metrics
```typescript
interface PerformanceMetrics {
  requestId: string;
  toolName: string;
  startTime: number;
  endTime: number;
  duration: number;
  apiCalls: number;
  memoryUsage: number;
}
```

## 🔧 Schema Validation

### Zod Schemas

#### Spreadsheet ID Validation
```typescript
import { z } from "zod";

const SpreadsheetIdSchema = z.string().regex(/^[a-zA-Z0-9-_]+$/, {
  message: "Invalid spreadsheet ID format"
});
```

#### Range Validation
```typescript
const RangeSchema = z.string().regex(/^[A-Za-z0-9_]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$/, {
  message: "Invalid A1 notation range"
});
```

#### Tool Input Validation
```typescript
const GetSheetDataSchema = z.object({
  spreadsheet_id: SpreadsheetIdSchema,
  range: RangeSchema,
  value_render_option: z.enum(["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"]).optional()
});
```

#### Update Cells Schema
```typescript
const UpdateCellsSchema = z.object({
  spreadsheet_id: SpreadsheetIdSchema,
  range: RangeSchema,
  values: z.array(z.array(z.union([z.string(), z.number(), z.boolean()]))),
  value_input_option: z.enum(["RAW", "USER_ENTERED"]).optional()
});
```

## 📊 Data Transformations

### Google Sheets to MCP Format

#### Spreadsheet List Transformation
```typescript
function transformSpreadsheetList(apiResponse: any): SpreadsheetListResponse {
  return {
    success: true,
    data: {
      spreadsheets: apiResponse.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        url: `https://docs.google.com/spreadsheets/d/${file.id}`,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        permissions: file.permissions || []
      })),
      count: apiResponse.files.length
    }
  };
}
```

#### Sheet Data Transformation
```typescript
function transformSheetData(apiResponse: any): SheetDataResponse {
  return {
    success: true,
    data: {
      range: apiResponse.range,
      majorDimension: apiResponse.majorDimension,
      values: apiResponse.values || []
    }
  };
}
```

### MCP to Google Sheets Format

#### Update Request Transformation
```typescript
function transformUpdateRequest(mcpRequest: any): GoogleSheetsUpdateRequest {
  return {
    spreadsheetId: mcpRequest.spreadsheet_id,
    range: mcpRequest.range,
    valueInputOption: mcpRequest.value_input_option || "USER_ENTERED",
    resource: {
      values: mcpRequest.values
    }
  };
}
```

## 🔒 Data Security

### Sensitive Data Handling

#### Credential Masking
```typescript
function maskCredentials(credentials: ServiceAccountCredentials): Partial<ServiceAccountCredentials> {
  return {
    type: credentials.type,
    project_id: credentials.project_id,
    client_email: credentials.client_email,
    client_id: credentials.client_id,
    // private_key and other sensitive fields omitted
  };
}
```

#### Log Sanitization
```typescript
function sanitizeLogData(data: any): any {
  const sensitiveFields = ['private_key', 'client_secret', 'access_token', 'refresh_token'];
  
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (sensitiveFields.includes(key)) {
      return '[REDACTED]';
    }
    return value;
  }));
}
```

## 📈 Performance Considerations

### Data Caching

#### Spreadsheet Metadata Cache
```typescript
interface SpreadsheetCache {
  spreadsheetId: string;
  metadata: Spreadsheet;
  lastUpdated: number;
  ttl: number;
}

const SPREADSHEET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

#### Authentication Cache
```typescript
interface AuthCache {
  credentials: ServiceAccountCredentials | OAuth2Token;
  expiresAt: number;
  scopes: string[];
}
```

### Memory Management

#### Large Data Handling
```typescript
interface DataChunk {
  chunkId: string;
  data: Array<Array<any>>;
  totalChunks: number;
  currentChunk: number;
}

function processLargeDataset(data: Array<Array<any>>, chunkSize: number = 1000): DataChunk[] {
  const chunks: DataChunk[] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push({
      chunkId: `chunk_${i / chunkSize}`,
      data: data.slice(i, i + chunkSize),
      totalChunks: Math.ceil(data.length / chunkSize),
      currentChunk: Math.floor(i / chunkSize) + 1
    });
  }
  return chunks;
}
```

## 🧪 Data Model Testing

### Schema Validation Tests
```typescript
describe('Data Model Validation', () => {
  test('validates spreadsheet ID format', () => {
    const validId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    const invalidId = 'invalid-id!@#';
    
    expect(SpreadsheetIdSchema.safeParse(validId).success).toBe(true);
    expect(SpreadsheetIdSchema.safeParse(invalidId).success).toBe(false);
  });
  
  test('validates range format', () => {
    const validRange = 'Sheet1!A1:D10';
    const invalidRange = 'Sheet1!A1';
    
    expect(RangeSchema.safeParse(validRange).success).toBe(true);
    expect(RangeSchema.safeParse(invalidRange).success).toBe(false);
  });
});
```

### Transformation Tests
```typescript
describe('Data Transformations', () => {
  test('transforms Google Sheets API response to MCP format', () => {
    const apiResponse = {
      files: [
        {
          id: '123',
          name: 'Test Spreadsheet',
          createdTime: '2024-01-01T00:00:00Z'
        }
      ]
    };
    
    const result = transformSpreadsheetList(apiResponse);
    
    expect(result.success).toBe(true);
    expect(result.data.spreadsheets).toHaveLength(1);
    expect(result.data.spreadsheets[0].id).toBe('123');
  });
});
```

## 📋 Data Model Checklist

### Development
- [ ] All data models have TypeScript interfaces
- [ ] Zod schemas validate all inputs
- [ ] Transformations handle edge cases
- [ ] Sensitive data is properly masked
- [ ] Memory usage is optimized

### Testing
- [ ] Schema validation tests cover all cases
- [ ] Transformation tests verify data integrity
- [ ] Performance tests measure memory usage
- [ ] Error handling tests validate error models

### Documentation
- [ ] All models are documented with examples
- [ ] Schema constraints are clearly defined
- [ ] Transformation logic is explained
- [ ] Security considerations are noted 