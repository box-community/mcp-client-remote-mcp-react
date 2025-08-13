import React from 'react';
import styled from 'styled-components';
import { authService } from '../../services/authService';

const StyledButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xlarge};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  max-width: 400px;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const BoxLogo = styled.div`
  width: 64px;
  height: 64px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

interface LoginButtonProps {
  loading?: boolean;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ loading = false }) => {
  const handleLogin = async () => {
    try {
      await authService.initiateOAuth();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <LoginContainer>
      <BoxLogo>B</BoxLogo>
      <Title>Box MCP Client</Title>
      <Description>
        Connect to Box through the Model Context Protocol to chat with your files and folders.
      </Description>
      <StyledButton onClick={handleLogin} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect to Box'}
      </StyledButton>
    </LoginContainer>
  );
};