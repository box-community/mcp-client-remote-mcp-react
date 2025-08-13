import { BoxAuthConfig, TokenResponse, User } from '../types/auth';
import { encryptToken, decryptToken, generateCodeVerifier, generateCodeChallenge } from '../utils/crypto';

class AuthService {
  private config: BoxAuthConfig;
  private readonly STORAGE_KEYS = {
    TOKEN: 'box_access_token',
    REFRESH_TOKEN: 'box_refresh_token',
    TOKEN_EXPIRY: 'box_token_expiry',
    CODE_VERIFIER: 'box_code_verifier'
  };

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_BOX_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_BOX_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_BOX_REDIRECT_URI || `${window.location.origin}/auth/callback`,
      scope: 'root_readwrite'
    };
  }

  async initiateOAuth(): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    localStorage.setItem(this.STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: this.generateState()
    });

    console.log('Initiating OAuth with config:', {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scope: this.config.scope,
      codeChallenge: codeChallenge.substring(0, 10) + '...',
    });

    const authUrl = `https://account.box.com/api/oauth2/authorize?${params.toString()}`;
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    const codeVerifier = localStorage.getItem(this.STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier
    });

    const response = await fetch('https://api.box.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OAuth token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        requestParams: Object.fromEntries(tokenParams.entries())
      });
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const tokenData: TokenResponse = await response.json();
    this.storeToken(tokenData);
    localStorage.removeItem(this.STORAGE_KEYS.CODE_VERIFIER);

    return tokenData;
  }

  async refreshToken(): Promise<TokenResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    try {
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const tokenData: TokenResponse = await response.json();
      this.storeToken(tokenData);
      return tokenData;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  getAccessToken(): string | null {
    const encryptedToken = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    if (!encryptedToken) return null;
    
    const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    if (expiry && Date.now() > parseInt(expiry)) {
      this.clearTokens();
      return null;
    }

    return decryptToken(encryptedToken);
  }

  private getRefreshToken(): string | null {
    const encryptedToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    return encryptedToken ? decryptToken(encryptedToken) : null;
  }

  private storeToken(tokenData: TokenResponse): void {
    const expiryTime = Date.now() + (tokenData.expires_in * 1000);
    
    localStorage.setItem(this.STORAGE_KEYS.TOKEN, encryptToken(tokenData.access_token));
    localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    if (tokenData.refresh_token) {
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, encryptToken(tokenData.refresh_token));
    }
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No response body');
        console.error('Box API getCurrentUser failed:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorBody,
          hasToken: !!token
        });
        
        if (response.status === 401) {
          const newToken = await this.refreshToken();
          if (newToken) {
            return this.getCurrentUser();
          }
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(this.STORAGE_KEYS.CODE_VERIFIER);
  }

  logout(): void {
    this.clearTokens();
    window.location.href = '/';
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export const authService = new AuthService();