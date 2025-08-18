// import { mcpClient } from './mcpClient';

// interface ToolCall {
//   name: string;
//   parameters: any;
//   reasoning: string;
// }

// interface AIResponse {
//   response: string;
//   toolCalls?: ToolCall[];
//   toolResults?: any[];
// }

// interface ConversationMessage {
//   role: 'user' | 'assistant' | 'system' | 'tool';
//   content: string;
//   tool_calls?: any[];
//   tool_call_id?: string;
//   name?: string;
// }

// export class AIService {
//   private openaiApiKey: string;
//   private baseUrl: string;
//   private conversationHistory: ConversationMessage[] = [];

//   constructor() {
//     this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
//     this.baseUrl = 'https://api.openai.com/v1';
//     this.initializeSystemMessage();
//   }

//   private initializeSystemMessage() {
//     this.conversationHistory = [{
//       role: 'system',
//       content: `You are a helpful assistant that can use Box tools to help users manage their files and data. 

// When a user asks something, determine if you need to use any Box tools to answer their question. 
// For example:
// - "Who am I?" -> Use who_am_i tool
// - "List my files" -> Use list_folder_content_by_folder_id with folder_id="0" 
// - "Search for contracts" -> Use search_files_keyword with query="contract"
// - "What's in this file?" -> Use ai_qa_single_file if they provide a file ID

// Always provide helpful, conversational responses based on the tool results. Remember the context of our conversation and refer back to previous information when relevant.`
//     }];
//   }

//   async processMessage(userMessage: string): Promise<AIResponse> {
//     try {
//       // Add user message to conversation history
//       this.conversationHistory.push({
//         role: 'user',
//         content: userMessage
//       });

//       // Get available tools from MCP
//       const availableTools = await mcpClient.getTools();

//       if (availableTools.length === 0) {
//         const response = "I'm connected to Box but no tools are available. Please check the MCP server configuration.";

//         // Add assistant response to history
//         this.conversationHistory.push({
//           role: 'assistant',
//           content: response
//         });

//         return { response };
//       }

//       // Create tool descriptions for the AI
//       const toolDescriptions = availableTools.map(tool => ({
//         name: tool.name,
//         description: tool.description,
//         parameters: tool.inputSchema || {}
//       }));

//       // Call OpenAI with function calling and conversation history
//       const completion = await this.callOpenAI(toolDescriptions);

//       // Check if AI wants to call tools
//       if (completion.tool_calls && completion.tool_calls.length > 0) {
//         // Add assistant message with tool calls to history
//         this.conversationHistory.push({
//           role: 'assistant',
//           content: completion.content || '',
//           tool_calls: completion.tool_calls
//         });

//         const toolResults = [];

//         // Execute each tool call and add results to history
//         for (const toolCall of completion.tool_calls) {
//           try {
//             console.log(`AI is calling tool: ${toolCall.function.name}`, toolCall.function.arguments);
//             const toolResponse = await mcpClient.callTool(
//               toolCall.function.name,
//               JSON.parse(toolCall.function.arguments)
//             );

//             const toolResult = {
//               name: toolCall.function.name,
//               result: toolResponse.result
//             };
//             toolResults.push(toolResult);

//             // Add tool result to conversation history
//             this.conversationHistory.push({
//               role: 'tool',
//               content: JSON.stringify(toolResponse.result),
//               tool_call_id: toolCall.id,
//               name: toolCall.function.name
//             });

//           } catch (error) {
//             console.error(`Tool call failed: ${toolCall.function.name}`, error);
//             const toolResult = {
//               name: toolCall.function.name,
//               error: error instanceof Error ? error.message : 'Unknown error'
//             };
//             toolResults.push(toolResult);

//             // Add tool error to conversation history
//             this.conversationHistory.push({
//               role: 'tool',
//               content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
//               tool_call_id: toolCall.id,
//               name: toolCall.function.name
//             });
//           }
//         }

//         // Get final response from AI based on tool results with full conversation context
//         const finalResponse = await this.generateFinalResponseWithHistory();

//         // Add final response to conversation history
//         this.conversationHistory.push({
//           role: 'assistant',
//           content: finalResponse
//         });

//         return {
//           response: finalResponse,
//           toolCalls: completion.tool_calls.map(tc => ({
//             name: tc.function.name,
//             parameters: JSON.parse(tc.function.arguments),
//             reasoning: 'AI determined this tool was needed'
//           })),
//           toolResults
//         };
//       }

//       // No tools needed, add direct response to history
//       const directResponse = completion.content || "I'm not sure how to help with that.";
//       this.conversationHistory.push({
//         role: 'assistant',
//         content: directResponse
//       });

//       return {
//         response: directResponse
//       };

//     } catch (error) {
//       console.error('AI processing failed:', error);
//       return {
//         response: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
//       };
//     }
//   }

//   private async callOpenAI(tools: any[]): Promise<any> {
//     if (!this.openaiApiKey) {
//       throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
//     }

//     const response = await fetch(`${this.baseUrl}/chat/completions`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${this.openaiApiKey}`
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o',
//         messages: this.conversationHistory.map(msg => ({
//           role: msg.role,
//           content: msg.content,
//           ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
//           ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
//           ...(msg.name && { name: msg.name })
//         })),
//         tools: tools.map(tool => ({
//           type: 'function',
//           function: {
//             name: tool.name,
//             description: tool.description,
//             parameters: tool.parameters
//           }
//         })),
//         tool_choice: 'auto'
//       })
//     });

//     if (!response.ok) {
//       const error = await response.text();
//       throw new Error(`OpenAI API error: ${response.status} ${error}`);
//     }

//     const data = await response.json();
//     return data.choices[0].message;
//   }

//   private async generateFinalResponse(originalMessage: string, toolResults: any[]): Promise<string> {
//     const response = await fetch(`${this.baseUrl}/chat/completions`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${this.openaiApiKey}`
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o',
//         messages: [
//           {
//             role: 'system',
//             content: 'Based on the user\'s question and the tool results, provide a helpful, conversational response. Format the information clearly and naturally.'
//           },
//           {
//             role: 'user',
//             content: `Original question: ${originalMessage}\n\nTool results: ${JSON.stringify(toolResults, null, 2)}\n\nPlease provide a natural, helpful response based on this information.`
//           }
//         ]
//       })
//     });

//     const data = await response.json();
//     return data.choices[0].message.content;
//   }

//   private async generateFinalResponseWithHistory(): Promise<string> {
//     const response = await fetch(`${this.baseUrl}/chat/completions`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${this.openaiApiKey}`
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o',
//         messages: [
//           ...this.conversationHistory,
//           {
//             role: 'user',
//             content: 'Please provide a natural, helpful response based on the tool results above. Remember our conversation context.'
//           }
//         ]
//       })
//     });

//     const data = await response.json();
//     return data.choices[0].message.content;
//   }

//   clearConversationHistory() {
//     this.initializeSystemMessage();
//   }

//   getConversationHistory(): ConversationMessage[] {
//     return [...this.conversationHistory];
//   }
// }

// export const aiService = new AIService();

// src/services/aiService.ts
import { mcpClient } from './mcpClient';

// Minimal message shapes for our local history
type Role = 'system' | 'user' | 'assistant';
type LocalMsg =
  | { role: Role; content: string | any[] | any }
  | { role: 'tool'; name: string; content: string; toolCallId?: string };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL =
  import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

if (!ANTHROPIC_API_KEY) {
  // Fail fast so users see a clear setup error
  throw new Error('Missing VITE_ANTHROPIC_API_KEY in .env');
}

class AIService {
  private conversation: LocalMsg[] = [
    {
      role: 'system',
      content:
        'You are a helpful assistant for Box. Prefer using available Box MCP tools when the user asks about Box content or actions.',
    },
  ];

  // Optional: map MCP tools to Anthropic tool specs (JSON Schema) so Claude can call them proactively.
  public async getAnthropicTools() {
    try {
      const tools = await mcpClient.getTools();
      // Expecting something like [{ name, description, inputSchema }, ...]
      return (tools || []).map((t: any) => ({
        name: t.name,
        description: t.description || '',
        input_schema: t.inputSchema || { type: 'object' },
      }));
    } catch {
      return undefined;
    }
  }

  // Public entry: take a user prompt, return assistant response object
  async processMessage(userText: string): Promise<{ response: string; toolCalls?: any[]; toolResults?: any[] }> {
    this.conversation.push({ role: 'user', content: userText });
    const responseText = await this.askClaudeWithTools();


    return {
      response: responseText,
      // Note: Could extend this to include tool call information in the future
      toolCalls: undefined,
      toolResults: undefined
    };
  }

  // Core loop:
  // 1) send messages to Claude (with tools)
  // 2) if Claude requests tool_use, call MCP tools and send tool_result(s)
  // 3) return the final assistant text
  private async askClaudeWithTools(): Promise<string> {
    const { system, chat } = this.toAnthropicMessages(this.conversation);
    const tools = await this.getAnthropicTools();

    // Prepare the request body - only include tools and tool_choice if we have tools
    const requestBody: any = {
      system,
      messages: chat,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = { "type": "auto" };
    }

    // First call: allow Claude to decide on tools
    const first = await this.claudeCall(requestBody);

    const { text: firstText, toolCalls } = this.parseClaude(first);

    // No tools requested → return text directly
    if (!toolCalls.length) {
      const responseText = firstText || '';
      if (responseText) {
        this.conversation.push({ role: 'assistant', content: responseText });
      }
      return responseText;
    }

    // Add the assistant's tool_use message to our conversation history
    // We need to reconstruct the tool_use blocks from the toolCalls
    const toolUseBlocks = toolCalls.map(call => ({
      type: 'tool_use',
      id: call.id,
      name: call.name,
      input: call.args || {}
    }));

    // Create the assistant message with both text and tool_use blocks
    const assistantContent = [];
    if (firstText) {
      assistantContent.push({ type: 'text', text: firstText });
    }
    assistantContent.push(...toolUseBlocks);

    this.conversation.push({
      role: 'assistant',
      content: assistantContent.length === 1 ? assistantContent[0] : assistantContent
    });

    // Execute each requested tool via MCP and collect results
    const toolResultsBlocks: Array<any> = [];
    for (const call of toolCalls) {
      try {
        const result = await mcpClient.callTool(call.name, call.args || {});
        toolResultsBlocks.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content:
            typeof (result as any)?.result === 'string'
              ? (result as any).result
              : JSON.stringify((result as any)?.result ?? result),
        });
      } catch (err: any) {
        toolResultsBlocks.push({
          type: 'tool_result',
          tool_use_id: call.id,
          is_error: true,
          content: `Tool error: ${err?.message || String(err)}`,
        });
      }
    }

    // Add the tool results as a user message to our conversation history
    this.conversation.push({
      role: 'user',
      content: toolResultsBlocks
    });

    // Second call: use the updated conversation history
    const { system: updatedSystem, chat: updatedChat } = this.toAnthropicMessages(this.conversation);
    const secondRequestBody: any = {
      system: updatedSystem,
      messages: updatedChat,
    };

    if (tools && tools.length > 0) {
      secondRequestBody.tools = tools;
      secondRequestBody.tool_choice = { "type": "auto" };
    }

    const second = await this.claudeCall(secondRequestBody);

    const { text: finalText } = this.parseClaude(second);

    // Add the final assistant response to conversation history
    if (finalText) {
      this.conversation.push({ role: 'assistant', content: finalText });
    }

    return finalText || '';
  }

  // --- Anthropic helpers ---

  private async claudeCall(body: any) {
    // NOTE: The header below enables direct-from-browser CORS requests.
    // This exposes your API key to the client; use only for demos/dev.
    const requestBody = {
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      ...body,
    };

    // Debug: Log what we're sending to Anthropic  
    // console.log('Sending to Anthropic:', JSON.stringify(requestBody, null, 2));

    const resp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      throw new Error(`Anthropic error ${resp.status}: ${err}`);
    }
    return resp.json();
  }

  private toAnthropicMessages(all: LocalMsg[]) {
    let system: string | undefined;
    const chat: Array<{ role: 'user' | 'assistant'; content: any }> = [];

    for (const m of all) {
      if (m.role === 'system') {
        system = system ? `${system}\n\n${m.content}` : m.content;
      } else if (m.role === 'user' || m.role === 'assistant') {
        // Handle both string content and complex content (arrays)
        chat.push({ role: m.role, content: m.content });
      }
      // Note: 'tool' messages are not pushed here; tool results are added explicitly after tool_use.
    }
    return { system, messages: chat, chat };
  }

  private parseClaude(data: any): {
    text?: string;
    toolCalls: Array<{ id: string; name: string; args: any }>;
  } {
    const toolCalls: Array<{ id: string; name: string; args: any }> = [];
    let text: string | undefined;

    // Anthropic returns an array of content blocks on the assistant message
    const content = data?.content ?? [];
    for (const block of content) {
      if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          args: block.input ?? {},
        });
      } else if (block.type === 'text') {
        text = text ? `${text}\n${block.text}` : block.text;
      }
    }
    return { text, toolCalls };
  }

  // Clear conversation history
  clearConversationHistory() {
    this.conversation = [
      {
        role: 'system',
        content: 'You are a helpful assistant for Box. Prefer using available Box MCP tools when the user asks about Box content or actions.',
      },
    ];
  }

  // Get conversation history (for debugging/inspection)
  getConversationHistory() {
    return [...this.conversation];
  }
}

export const aiService = new AIService();

