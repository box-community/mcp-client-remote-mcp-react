import React from 'react';
import styled from 'styled-components';
import { User } from '../../types/auth';
import { useTheme } from '../Common/ThemeProvider';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BoxLogo = styled.div`
  width: 32px;
  height: 32px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ConnectionStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme, $connected }) => 
    $connected ? theme.colors.success : theme.colors.error};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.small};
`;

const StatusDot = styled.div<{ $connected: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  animation: ${({ $connected }) => $connected ? 'none' : 'blink 1s infinite'};
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UserAvatar = styled.div<{ $avatarUrl?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  background-image: ${({ $avatarUrl }) => $avatarUrl ? `url(${$avatarUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const ThemeToggle = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const MenuButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ClearButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

interface ChatHeaderProps {
  user: User | null;
  connected: boolean;
  onMenuClick?: () => void;
  onClearConversation?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  connected,
  onMenuClick,
  onClearConversation
}) => {
  const { isDark, toggleTheme } = useTheme();

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <BoxLogo>B</BoxLogo>
        <TitleSection>
          <Title>Box Assistant</Title>
          <Subtitle>Powered by Model Context Protocol</Subtitle>
        </TitleSection>
      </LeftSection>

      <RightSection>
        <ConnectionStatus $connected={connected}>
          <StatusDot $connected={connected} />
          {connected ? 'Connected' : 'Connecting...'}
        </ConnectionStatus>

        {user && (
          <UserSection>
            <UserName>{user.name}</UserName>
            <UserAvatar $avatarUrl={user.avatar_url}>
              {!user.avatar_url && getUserInitials(user.name)}
            </UserAvatar>
          </UserSection>
        )}

        <ClearButton onClick={onClearConversation} title="Clear conversation">
          🗑️
        </ClearButton>

        <ThemeToggle onClick={toggleTheme} title="Toggle theme">
          {isDark ? '☀️' : '🌙'}
        </ThemeToggle>

        <MenuButton onClick={onMenuClick} title="Menu">
          ⚙️
        </MenuButton>
      </RightSection>
    </HeaderContainer>
  );
};