// src/lib/token-refresh.ts
'use client';

interface TokenRefreshResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export async function refreshToken(): Promise<TokenRefreshResponse> {
  try {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      return { success: false, message: 'No token to refresh' };
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      return { success: true, token: data.token };
    }

    return { success: false, message: data.message || 'Token refresh failed' };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, message: 'Network error during token refresh' };
  }
}

// Check if token is about to expire (within 5 minutes)
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expiryTime - currentTime < fiveMinutes;
  } catch {
    return true; // If we can't decode, assume it needs refresh
  }
}