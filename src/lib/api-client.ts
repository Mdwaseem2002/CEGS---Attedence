// src/lib/api-client.ts
'use client';

import { refreshToken } from './token-refresh';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient(url: string, options: FetchOptions = {}) {
  const { skipAuth, ...fetchOptions } = options;

  // Add auth header if not skipped
  if (!skipAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  // Make the request
  let response = await fetch(url, fetchOptions);

  // If we get a 401 and it's not a login request, try to refresh the token
  if (response.status === 401 && !skipAuth && !url.includes('/api/auth/login')) {
    console.log('Got 401, attempting token refresh...');
    
    const refreshResult = await refreshToken();
    
    if (refreshResult.success && refreshResult.token) {
      console.log('Token refreshed, retrying request...');
      
      // Retry the request with the new token
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${refreshResult.token}`
      };
      
      response = await fetch(url, fetchOptions);
    } else {
      // Refresh failed, redirect to login
      console.error('Token refresh failed, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}