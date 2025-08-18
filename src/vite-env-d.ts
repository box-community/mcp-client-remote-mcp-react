/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ANTHROPIC_MODEL?: string;
    readonly VITE_ANTHROPIC_API_KEY?: string;
    readonly VITE_OPENAI_API_KEY?: string;
    readonly VITE_BOX_CLIENT_ID?: string;
    readonly VITE_BOX_CLIENT_SECRET?: string;
    readonly VITE_BOX_REDIRECT_URI?: string;
    readonly VITE_BOX_MCP_SERVER_URL?: string;
    readonly VITE_DEBUG?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}