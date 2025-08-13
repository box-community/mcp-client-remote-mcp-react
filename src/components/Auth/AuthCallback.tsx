import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { authService } from '../../services/authService';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.border};
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  text-align: center;
  max-width: 400px;
`;

const RetryButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

export const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        await authService.handleCallback(code, state || '');
        
        window.location.href = '/';
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  const handleRetry = () => {
    authService.initiateOAuth();
  };

  if (loading) {
    return (
      <CallbackContainer>
        <Spinner />
        <Message>Completing authentication...</Message>
      </CallbackContainer>
    );
  }

  if (error) {
    return (
      <CallbackContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={handleRetry}>
          Try Again
        </RetryButton>
      </CallbackContainer>
    );
  }

  return null;
};