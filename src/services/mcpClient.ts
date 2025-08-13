import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { MCPSession, MCPRequest, MCPResponse, MCPServerCapabilities } from '../types/mcp';
import { authService } from './authService';

class MCPClientService {
  private client: Client | null = null;
  private session: MCPSession | null = null;
  private serverUrl: string;
  private sessionId: string | null = null;

  constructor() {
    this.serverUrl = import.meta.env.VITE_BOX_MCP_SERVER_URL || 'https://box-mcp-server.example.com';
  }

  async connect(): Promise<MCPSession> {
    if (this.session?.connected) {
      return this.session;
    }

    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Check if we have a valid MCP server URL
    if (!this.serverUrl || 
        this.serverUrl === 'https://your-box-mcp-server.example.com' || 
        this.serverUrl === 'https://box-mcp-server.example.com') {
      console.warn('No valid MCP server configured, using mock session for development');
      // Create a mock session for development
      this.session = {
        sessionId: 'mock-session-' + Date.now(),
        connected: true,
        serverCapabilities: {
          prompts: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          tools: { listChanged: false }
        }
      };
      return this.session;
    }

    try {
      this.client = new Client({
        name: "box-mcp-react-client",
        version: "1.0.0"
      }, {
        capabilities: {
          sampling: {},
        }
      });

      const sessionResponse = await this.createSession(token);
      this.sessionId = sessionResponse.sessionId;

      // Use capabilities from the initialize response
      const capabilities = sessionResponse.serverCapabilities || {
        prompts: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        tools: { listChanged: false }
      };

      // Try to get the actual tools list if the server supports it
      let availableTools = [];
      if (capabilities.tools) {
        try {
          availableTools = await this.getAvailableTools();
          console.log('Available tools from MCP server:', availableTools);
        } catch (error) {
          console.warn('Could not fetch tools list:', error);
        }
      }

      this.session = {
        sessionId: this.sessionId,
        connected: true,
        serverCapabilities: capabilities,
        availableTools
      };

      return this.session;
    } catch (error) {
      console.error('MCP connection failed:', error);
      throw new Error(`Failed to connect to MCP server: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.deleteSession();
      } catch (error) {
        console.error('Error disconnecting from MCP server:', error);
      }
    }

    this.client = null;
    this.session = null;
    this.sessionId = null;
  }

  async sendMessage(content: string): Promise<MCPResponse> {
    if (!this.session?.connected) {
      throw new Error('Not connected to MCP server');
    }

    // If using mock session, return a mock response
    if (this.session.sessionId.startsWith('mock-session-')) {
      console.log('Using mock MCP response for development');
      return {
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        result: {
          content: [
            {
              type: 'text',
              text: `Mock response to: "${content}". This is a development placeholder since no real MCP server is configured. To connect to a real Box MCP server, update VITE_BOX_MCP_SERVER_URL in your .env file.`
            }
          ],
          model: 'mock-model',
          role: 'assistant'
        }
      };
    }

    // MCP servers don't typically handle message generation directly
    // Instead, they provide tools. Let's return information about available tools
    // and suggest how to use them.
    const tools = this.session.availableTools || [];
    
    if (tools.length === 0) {
      return {
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        result: {
          content: [
            {
              type: 'text',
              text: `Connected to Box MCP server, but no tools are available. This might be a configuration issue or the server may not have tools enabled.`
            }
          ],
          role: 'assistant'
        }
      };
    }

    // Check if the message is a tool call command (e.g., "!tool toolname param1=value1")
    if (content.startsWith('!tool ')) {
      return await this.handleToolCommand(content);
    }

    // Provide information about available tools
    const toolsList = tools.map(tool => `• ${tool.name}: ${tool.description}`).join('\n');
    
    return {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      result: {
        content: [
          {
            type: 'text',
            text: `You're connected to the Box MCP server! Here are the available tools:\n\n${toolsList}\n\nTo test a tool, type: !tool <toolname> [parameters]\nExample: !tool list_files path=/\n\nNote: MCP servers provide tools but don't generate responses directly - they're meant to be used by AI assistants.`
          }
        ],
        role: 'assistant',
        availableTools: tools
      }
    };
  }

  private async handleToolCommand(command: string): Promise<MCPResponse> {
    // Parse command like "!tool toolname param1=value1 param2=value2"
    const parts = command.slice(6).trim().split(' '); // Remove "!tool "
    const toolName = parts[0];
    
    if (!toolName) {
      return {
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        result: {
          content: [
            {
              type: 'text',
              text: 'Error: Please specify a tool name. Usage: !tool <toolname> [parameters]'
            }
          ],
          role: 'assistant'
        }
      };
    }

    // Parse parameters (simple key=value format)
    const parameters: any = {};
    for (let i = 1; i < parts.length; i++) {
      const param = parts[i];
      if (param.includes('=')) {
        const [key, value] = param.split('=', 2);
        parameters[key] = value;
      }
    }

    try {
      const response = await this.callTool(toolName, parameters);
      return {
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        result: {
          content: [
            {
              type: 'text',
              text: `Tool "${toolName}" executed successfully:\n\n${JSON.stringify(response.result, null, 2)}`
            }
          ],
          role: 'assistant'
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        result: {
          content: [
            {
              type: 'text',
              text: `Tool "${toolName}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          role: 'assistant'
        }
      };
    }
  }

  async callTool(name: string, parameters: any = {}): Promise<MCPResponse> {
    if (!this.session?.connected) {
      throw new Error('Not connected to MCP server');
    }

    console.log(`Calling MCP tool: ${name}`, parameters);

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'tools/call',
      params: {
        name,
        arguments: parameters
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log(`Tool ${name} response:`, response);
      return response;
    } catch (error) {
      console.error(`Tool ${name} failed:`, error);
      throw error;
    }
  }

  async getResource(uri: string): Promise<MCPResponse> {
    if (!this.session?.connected) {
      throw new Error('Not connected to MCP server');
    }

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'resources/read',
      params: {
        uri
      }
    };

    return this.sendRequest(request);
  }

  private async createSession(token: string): Promise<{ sessionId: string; serverCapabilities?: any }> {
    console.log('Attempting to create MCP session with:', {
      serverUrl: this.serverUrl,
      endpoint: this.serverUrl,
      hasToken: !!token
    });

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {
            sampling: {}
          },
          clientInfo: {
            name: 'box-mcp-react-client',
            version: '1.0.0'
          }
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No response body');
      console.error('MCP session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        url: this.serverUrl,
        responseBody: errorBody
      });
      throw new Error(`Session creation failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    // Debug: Log response details
    console.log('MCP session creation response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      contentType: response.headers.get('content-type')
    });

    // First check for session ID in headers
    const sessionId = response.headers.get('Mcp-Session-Id') ||
                     response.headers.get('session-id') || 
                     response.headers.get('x-session-id') ||
                     response.headers.get('mcp-session-id');
    
    if (sessionId) {
      console.log('Found session ID in header:', sessionId);
      return { sessionId };
    }

    // If no header session ID, parse the response body
    try {
      const responseBody = await response.text();
      console.log('Response body:', responseBody);
      
      const jsonResponse = JSON.parse(responseBody);
      
      // Check for session ID in response body
      if (jsonResponse.result?.sessionId) {
        console.log('Found session ID in response body:', jsonResponse.result.sessionId);
        return { 
          sessionId: jsonResponse.result.sessionId,
          serverCapabilities: jsonResponse.result.capabilities || {}
        };
      }
      if (jsonResponse.sessionId) {
        console.log('Found session ID in response body:', jsonResponse.sessionId);
        return { 
          sessionId: jsonResponse.sessionId,
          serverCapabilities: jsonResponse.capabilities || {}
        };
      }

      // If this is a valid MCP initialize response, generate a session ID
      if (jsonResponse.result && jsonResponse.jsonrpc === '2.0' && jsonResponse.result.protocolVersion) {
        console.log('Valid MCP initialize response received, generating session ID');
        const generatedSessionId = `session_${jsonResponse.id || Date.now()}`;
        return { 
          sessionId: generatedSessionId,
          serverCapabilities: jsonResponse.result.capabilities || {}
        };
      }
      
      throw new Error('Invalid MCP response format');
    } catch (e) {
      console.error('Could not parse response body as JSON:', e);
      throw new Error('No session ID received from server');
    }
  }

  private async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    const token = authService.getAccessToken();
    if (!token) return;

    try {
      await fetch(this.serverUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${token}`,
          'Mcp-Session-Id': this.sessionId,
        }
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  private async getAvailableTools(): Promise<any[]> {
    console.log('Fetching tools list from MCP server...');
    
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'tools/list',
      params: {}
    };

    const response = await this.sendRequest(request);
    return response.result?.tools || [];
  }

  async getTools(): Promise<any[]> {
    if (!this.session?.connected) {
      throw new Error('Not connected to MCP server');
    }
    return this.session.availableTools || [];
  }

  private async getServerCapabilities(): Promise<MCPServerCapabilities> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'tools/list',
      params: {}
    };

    const toolsResponse = await this.sendRequest(request);
    
    const resourcesRequest: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'resources/list',
      params: {}
    };

    const resourcesResponse = await this.sendRequest(resourcesRequest);

    return {
      tools: toolsResponse.result?.tools || [],
      resources: resourcesResponse.result?.resources || [],
      prompts: []
    };
  }

  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${token}`,
        'Mcp-Session-Id': this.sessionId,
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      if (response.status === 401) {
        const newToken = await authService.refreshToken();
        if (newToken) {
          return this.sendRequest(request);
        }
        throw new Error('Authentication failed');
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }

    const responseData: MCPResponse = await response.json();
    
    if (responseData.error) {
      throw new Error(`MCP Error: ${responseData.error.message}`);
    }

    return responseData;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSession(): MCPSession | null {
    return this.session;
  }

  isConnected(): boolean {
    return this.session?.connected || false;
  }
}

export const mcpClient = new MCPClientService();