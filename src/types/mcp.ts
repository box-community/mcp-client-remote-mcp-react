export interface MCPMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tools?: MCPTool[];
  resources?: MCPResource[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface MCPSession {
  sessionId: string;
  connected: boolean;
  serverCapabilities: MCPServerCapabilities;
  availableTools?: MCPTool[];
}

export interface MCPServerCapabilities {
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments: any[];
}

export interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}