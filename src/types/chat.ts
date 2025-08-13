export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  metadata?: {
    toolCalls?: ToolCall[];
    resources?: ResourceReference[];
    files?: FileAttachment[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  result?: any;
  error?: string;
}

export interface ResourceReference {
  uri: string;
  name: string;
  type: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  connected: boolean;
  error: string | null;
}