import { ThemeProvider } from './components/Common/ThemeProvider';
import { GlobalStyles } from './components/Common/GlobalStyles';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { LoginButton } from './components/Auth/LoginButton';
import { AuthCallback } from './components/Auth/AuthCallback';
import { ChatContainer } from './components/Chat/ChatContainer';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (window.location.pathname === '/auth/callback') {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <GlobalStyles />
          <AuthCallback />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (loading) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <GlobalStyles />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}>
            Loading...
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GlobalStyles />
        {isAuthenticated ? (
          <ChatContainer user={user} />
        ) : (
          <LoginButton />
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;