import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChatMessage, ChatState } from '../../types/chat';
import { User } from '../../types/auth';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { mcpClient } from '../../services/mcpClient';
import { aiService } from '../../services/aiService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ErrorBanner = styled.div`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.small};
`;

interface ChatContainerProps {
  user: User | null;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ user }) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    connected: false,
    error: null,
  });

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await mcpClient.connect();
        
        // Log available tools for debugging
        try {
          const tools = await mcpClient.getTools();
          console.log('MCP Tools available:', tools);
          if (tools.length > 0) {
            console.log('Tool details:', tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              hasInputSchema: !!tool.inputSchema
            })));
          } else {
            console.log('No tools available from MCP server');
          }
        } catch (toolError) {
          console.warn('Could not fetch tools:', toolError);
        }
        
        setChatState(prev => ({ ...prev, connected: true, error: null }));
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        setChatState(prev => ({
          ...prev,
          connected: false,
          error: `MCP Server connection failed. Please check VITE_BOX_MCP_SERVER_URL in .env file. Error: ${errorMessage}`
        }));
      }
    };

    initializeConnection();

    return () => {
      mcpClient.disconnect();
    };
  }, []);

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    return newMessage;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  };

  const handleSendMessage = async (content: string) => {
    if (!chatState.connected) {
      setChatState(prev => ({
        ...prev,
        error: 'Not connected to MCP server'
      }));
      return;
    }

    const userMessage = addMessage({
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    });

    updateMessage(userMessage.id, { status: 'sent' });

    setChatState(prev => ({ ...prev, isTyping: true, error: null }));

    try {
      // Use AI service to process the message and generate conversational responses
      const aiResponse = await aiService.processMessage(content);
      
      addMessage({
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        status: 'delivered',
        metadata: aiResponse.toolCalls ? { toolCalls: aiResponse.toolCalls } : undefined,
      });

      updateMessage(userMessage.id, { status: 'delivered' });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        status: 'error',
      });

      updateMessage(userMessage.id, { status: 'error' });

      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Message send failed'
      }));
    } finally {
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  const handleClearConversation = () => {
    // Clear AI service conversation history
    aiService.clearConversationHistory();
    
    // Clear local chat messages
    setChatState(prev => ({
      ...prev,
      messages: []
    }));
  };

  const clearError = () => {
    setChatState(prev => ({ ...prev, error: null }));
  };

  return (
    <Container>
      <ChatHeader
        user={user}
        connected={chatState.connected}
        onMenuClick={handleMenuClick}
        onClearConversation={handleClearConversation}
      />
      
      {chatState.error && (
        <ErrorBanner onClick={clearError}>
          {chatState.error} (Click to dismiss)
        </ErrorBanner>
      )}

      <MainContent>
        <MessageList
          messages={chatState.messages}
          isTyping={chatState.isTyping}
          onSuggestionClick={handleSuggestionClick}
        />
        
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!chatState.connected || chatState.isTyping}
          placeholder={
            chatState.connected
              ? "Ask me about your Box files..."
              : "Connecting to Box..."
          }
        />
      </MainContent>
    </Container>
  );
};