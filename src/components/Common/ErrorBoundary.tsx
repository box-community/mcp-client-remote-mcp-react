import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.background};
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h1`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 2rem;
  max-width: 500px;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  padding: 0.75rem 2rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const ErrorDetails = styled.details`
  margin-top: 2rem;
  max-width: 600px;
  
  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: 1rem;
    
    &:hover {
      color: ${({ theme }) => theme.colors.text.primary};
    }
  }
`;

const ErrorStack = styled.pre`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  overflow-x: auto;
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorIcon>💥</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            The application encountered an unexpected error. 
            This might be a temporary issue. Please try refreshing the page or contact support if the problem persists.
          </ErrorMessage>
          
          <RetryButton onClick={this.handleRetry}>
            Try Again
          </RetryButton>

          {this.state.error && (
            <ErrorDetails>
              <summary>Technical Details</summary>
              <ErrorStack>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </ErrorStack>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}