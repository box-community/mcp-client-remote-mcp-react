import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md} 0;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.text.muted};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const EmptyDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  max-width: 300px;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`;

const SuggestionChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SuggestionChip = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    transform: translateY(-1px);
  }
`;

const DateDivider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.border};
  }
  
  &::before {
    margin-right: ${({ theme }) => theme.spacing.md};
  }
  
  &::after {
    margin-left: ${({ theme }) => theme.spacing.md};
  }
`;

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  "Show my recent files",
  "Search for documents",
  "Create a new folder",
  "What can you help me with?"
];

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  onSuggestionClick
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach((message) => {
      const dateKey = message.timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  if (messages.length === 0) {
    return (
      <ListContainer ref={scrollRef}>
        <EmptyState>
          <EmptyIcon>💬</EmptyIcon>
          <EmptyTitle>Start a conversation</EmptyTitle>
          <EmptyDescription>
            Ask me anything about your Box files, folders, or try one of these suggestions:
          </EmptyDescription>
          <SuggestionChips>
            {suggestions.map((suggestion, index) => (
              <SuggestionChip
                key={index}
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </SuggestionChip>
            ))}
          </SuggestionChips>
        </EmptyState>
      </ListContainer>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <ListContainer ref={scrollRef}>
      {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          <DateDivider>
            {formatDate(new Date(dateKey))}
          </DateDivider>
          {dateMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      ))}
      <TypingIndicator show={isTyping} />
    </ListContainer>
  );
};