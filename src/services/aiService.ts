import { mcpClient } from './mcpClient';

// Minimal message shapes for our local history
type Role = 'system' | 'user' | 'assistant';
type LocalMsg =
  | { role: Role; content: string | any[] | any }
  | { role: 'tool'; name: string; content: string; toolCallId?: string };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL =
  import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-opus-4-1-20250805';
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

