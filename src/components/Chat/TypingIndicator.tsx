import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.md};
`;

const TypingBubble = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.text.muted};
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite ease-in-out;
  
  &:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  &:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  &:nth-child(3) {
    animation-delay: 0;
  }
`;

const TypingText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

interface TypingIndicatorProps {
  show: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ show }) => {
  if (!show) return null;

  return (
    <TypingContainer>
      <TypingBubble>
        <Dot />
        <Dot />
        <Dot />
        <TypingText>Assistant is typing...</TypingText>
      </TypingBubble>
    </TypingContainer>
  );
};