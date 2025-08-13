import { createGlobalStyle } from 'styled-components';
import { Theme } from '../../styles/theme';

export const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background};
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    outline: none;
    
    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }
  }

  input, textarea {
    font-family: inherit;
    border: none;
    outline: none;
    
    &:focus {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: -2px;
    }
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primaryHover};
      text-decoration: underline;
    }
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.text.muted};
  }
`;