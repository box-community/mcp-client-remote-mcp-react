import React from 'react';
import styled from 'styled-components';
import { ChatMessage } from '../../types/chat';

const BubbleContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${({ $isUser }) => $isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.sm};
  }
`;

const Bubble = styled.div<{ $isUser: boolean; $status: string }>`
  max-width: 70%;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background-color: ${({ theme, $isUser }) => 
    $isUser ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme, $isUser }) => 
    $isUser ? 'white' : theme.colors.text.primary};
  word-wrap: break-word;
  position: relative;
  
  ${({ $status, theme }) => 
    $status === 'error' && `
      background-color: ${theme.colors.error};
      color: white;
    `}
  
  ${({ $status, theme }) => 
    $status === 'sending' && `
      opacity: 0.7;
    `}

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 85%;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  }
`;

const MessageContent = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  white-space: pre-wrap;
`;

const MessageMeta = styled.div<{ $isUser: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $isUser }) => $isUser ? 'flex-end' : 'flex-start'};
  margin-top: ${({ theme }) => theme.spacing.xs};
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Timestamp = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const StatusIndicator = styled.span<{ $status: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  color: ${({ theme, $status }) => {
    switch ($status) {
      case 'sending': return theme.colors.text.muted;
      case 'sent': return theme.colors.success;
      case 'delivered': return theme.colors.success;
      case 'error': return theme.colors.error;
      default: return theme.colors.text.muted;
    }
  }};
`;

const ToolCallsContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const ToolCall = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.small};
`;

const ToolName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ToolResult = styled.div`
  color: rgba(255, 255, 255, 0.8);
`;

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sending': return '●';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'error': return '✗';
      default: return '';
    }
  };

  return (
    <BubbleContainer $isUser={isUser}>
      <div>
        <Bubble $isUser={isUser} $status={message.status}>
          <MessageContent>{message.content}</MessageContent>
          
          {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
            <ToolCallsContainer>
              {message.metadata.toolCalls.map((toolCall, index) => (
                <ToolCall key={`${toolCall.name}-${index}`}>
                  <ToolName>🛠 {toolCall.name}</ToolName>
                  {toolCall.result && (
                    <ToolResult>{JSON.stringify(toolCall.result, null, 2)}</ToolResult>
                  )}
                  {toolCall.error && (
                    <ToolResult style={{ color: '#ffcccc' }}>
                      Error: {toolCall.error}
                    </ToolResult>
                  )}
                </ToolCall>
              ))}
            </ToolCallsContainer>
          )}
        </Bubble>
        
        <MessageMeta $isUser={isUser}>
          <Timestamp>{formatTime(message.timestamp)}</Timestamp>
          {isUser && (
            <StatusIndicator $status={message.status}>
              {getStatusText(message.status)}
            </StatusIndicator>
          )}
        </MessageMeta>
      </div>
    </BubbleContainer>
  );
};