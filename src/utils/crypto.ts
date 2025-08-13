const ENCRYPTION_KEY = 'box-mcp-client-key';

export const encryptToken = (token: string): string => {
  try {
    const encoded = btoa(token);
    return encoded;
  } catch (error) {
    console.error('Token encryption failed:', error);
    return token;
  }
};

export const decryptToken = (encryptedToken: string): string => {
  try {
    const decoded = atob(encryptedToken);
    return decoded;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return encryptedToken;
  }
};

export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};