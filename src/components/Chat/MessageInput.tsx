import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  resize: none;
  overflow-y: auto;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button<{ $disabled: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, $disabled }) => 
    $disabled ? theme.colors.text.muted : theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  min-width: 60px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    cursor: not-allowed;
    transform: none;
  }
`;

const AttachButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 18px;
  height: 44px;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CharCount = styled.div<{ $warning: boolean }>`
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  color: ${({ theme, $warning }) => 
    $warning ? theme.colors.warning : theme.colors.text.muted};
`;

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2000
}) => {
  const [message, setMessage] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      adjustTextAreaHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextAreaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto';
      textArea.style.height = `${Math.min(textArea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextAreaHeight();
  }, [message]);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        console.log('Files selected:', files);
      }
    };
    input.click();
  };

  const canSend = message.trim() && !disabled && message.length <= maxLength;
  const isWarning = message.length > maxLength * 0.8;

  return (
    <form onSubmit={handleSubmit}>
      <InputContainer>
        <AttachButton 
          type="button" 
          onClick={handleFileUpload}
          disabled={disabled}
          title="Attach files"
        >
          📎
        </AttachButton>
        
        <InputWrapper>
          <TextArea
            ref={textAreaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
          />
          {maxLength && (
            <CharCount $warning={isWarning}>
              {message.length}/{maxLength}
            </CharCount>
          )}
        </InputWrapper>
        
        <SendButton 
          type="submit" 
          $disabled={!canSend}
          disabled={!canSend}
        >
          {disabled ? '⏳' : '➤'}
        </SendButton>
      </InputContainer>
    </form>
  );
};