# Box MCP Client React

A React-based client application for interacting with Box through the Model Context Protocol (MCP). This application provides a chat interface to communicate with Box MCP servers and access Box content and tools.

## Features

- **Box OAuth Authentication**: Secure login with Box using OAuth 2.0 with AI scope support
- **Box AI Integration**: Access Box AI features for document analysis and summarization
- **MCP Integration**: Connect to Box MCP servers to access Box tools and resources
- **AI-Powered Chat**: Interactive chat UI powered by Claude (Anthropic) for conversational responses
- **Tool Execution**: Execute Box MCP tools directly from the chat interface
- **Development Mode**: Mock responses when no MCP server is configured
- **Modern UI**: Responsive design with styled-components and TypeScript
- **Error Handling**: Comprehensive error boundaries and user-friendly messages

## Architecture

```
React App → AI Service (Claude) → MCP Client → Box MCP Server → Box AI APIs
```

The application follows a layered architecture:
- **Presentation Layer**: React components with styled-components
- **AI Service Layer**: Claude (Anthropic) integration for conversational responses
- **Service Layer**: Authentication and MCP client services
- **MCP Server Layer**: Box MCP Server handles tool execution and Box API integration
- **Integration Layer**: Box APIs (including Box AI) accessed via MCP tools

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Styled Components with theme provider
- **AI Provider**: Claude (Anthropic) for conversational AI
- **MCP SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK)
- **Authentication**: OAuth 2.0 with Box (including AI scopes)
- **Development**: Hot reload and fast refresh

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Box Developer Account with AI features enabled
- An Anthropic API key for Claude integration
- A deployed Box MCP Server (optional for development)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd box-mcp-client-react
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root:
   
   Edit `.env` with your configuration:
   ```env
   # Required: Box OAuth credentials
   VITE_BOX_CLIENT_ID=your_box_client_id_here
   VITE_BOX_CLIENT_SECRET=your_box_client_secret_here
   VITE_BOX_REDIRECT_URI=http://localhost:3000/auth/callback
   
   # Required: Anthropic API Configuration
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   VITE_ANTHROPIC_MODEL=claude-opus-4-1-20250805
   
   # Optional: Box MCP Server URL
   VITE_BOX_MCP_SERVER_URL=https://your-box-mcp-server.example.com
   
   # Optional: Debug mode
   VITE_DEBUG=false
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Box Developer Setup

1. **Create a Box App:**
   - Go to [Box Developer Console](https://developer.box.com/)
   - Create a new Custom App with OAuth 2.0 (User Authentication)
   - Note your Client ID and Client Secret

2. **Configure OAuth:**
   - Set Redirect URI to: `http://localhost:3000/auth/callback`
   - Enable required scopes: 
     - "Read and write all files and folders" (`root_readwrite`)
     - "Manage AI" (`ai.readwrite`) for Box AI features

3. **Update Environment:**
   - Add your Client ID and Secret to `.env`

## MCP Server Integration

This client works with Box MCP servers that implement the Model Context Protocol.

### With a Real MCP Server

1. Deploy a Box MCP server (see [MCP Servers](https://github.com/modelcontextprotocol/servers))
2. Set `VITE_BOX_MCP_SERVER_URL` in your `.env` file
3. The app will connect and show available tools

### Development Mode

If no MCP server URL is configured, the app runs in development mode with mock responses. This allows you to:
- Test the authentication flow
- Explore the chat interface
- Develop UI components

## Usage

1. **Authentication:**
   - Click "Login with Box" to authenticate
   - Complete OAuth flow in popup/redirect

2. **Chat Interface:**
   - Once authenticated, use the AI-powered chat interface
   - Send natural language queries about your Box content
   - Claude will automatically use appropriate Box tools and provide conversational responses

3. **Box AI Features:**
   - "Summarize this file: [file_id]" - Get AI-powered document summaries
   - "Extract metadata from this file: [file_id]" - Extract structured information
   - "Who am I in Box?" - Get your Box user information
   - "List my files" - Browse your Box content

4. **Direct Tool Commands (Advanced):**
   - Use `!tool <toolname> [parameters]` to execute MCP tools directly
   - Example: `!tool list_files path=/`

## Project Structure

```
src/
├── components/
│   ├── Auth/                 # Authentication components
│   │   ├── LoginButton.tsx
│   │   └── AuthCallback.tsx
│   ├── Chat/                 # Chat interface components
│   │   ├── ChatContainer.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   └── Common/               # Shared components
│       ├── ThemeProvider.tsx
│       ├── GlobalStyles.tsx
│       └── ErrorBoundary.tsx
├── services/
│   ├── authService.ts        # Box OAuth handling
│   ├── aiService.ts          # Claude (Anthropic) AI integration
│   └── mcpClient.ts          # MCP client implementation
├── hooks/
│   └── useAuth.ts            # Authentication hook
├── types/
│   ├── auth.ts               # Authentication types
│   ├── chat.ts               # Chat message types
│   └── mcp.ts                # MCP protocol types
├── styles/
│   └── theme.ts              # Theme configuration
├── utils/
│   └── crypto.ts             # Token encryption utilities
├── App.tsx                   # Main application component
└── index.tsx                 # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests (not configured yet)

## Security Features

- **Token Encryption**: Access tokens are encrypted before storage
- **HTTPS Only**: All communication uses HTTPS
- **PKCE Flow**: OAuth 2.1 with Proof Key for Code Exchange
- **Secure Headers**: Proper authorization headers for all MCP requests
- **Error Boundaries**: Prevents application crashes from propagating

## MCP Protocol Implementation

The application implements the Model Context Protocol specification:

- **Authentication**: Bearer token authentication on every request
- **Session Management**: Proper session creation and cleanup
- **Transport**: Streamable HTTP with session ID headers
- **Error Handling**: Comprehensive MCP error response handling
- **Tool Calling**: Support for Box-specific MCP tools
- **Resource Access**: Access to Box resources through MCP

## Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Verify Box Client ID is correct
   - Check redirect URI matches Box app configuration
   - Ensure HTTPS in production

2. **MCP Connection Issues**
   - Verify MCP server URL is accessible
   - Check network connectivity
   - Review browser console for detailed errors

3. **Build Issues**
   - Ensure Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues related to:
- **Box API**: See [Box Developer Documentation](https://developer.box.com/)
- **MCP Protocol**: See [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- **This Application**: Open an issue in this repository