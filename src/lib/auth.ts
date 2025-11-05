// src/lib/auth.ts

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'employee';
  name?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private token: string | null = null;

  /**
   * Logs in via API and stores session if successful.
   */
  async login(username: string, password: string): Promise<AuthUser | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (data.success && data.user && data.token) {
        this.currentUser = data.user;
        this.token = data.token;

        if (typeof window !== 'undefined') {
          // Store in BOTH sessionStorage and localStorage for compatibility
          sessionStorage.setItem('hrms_user', JSON.stringify(data.user));
          sessionStorage.setItem('hrms_token', data.token);
          
          // CRITICAL FIX: Also store in localStorage for payroll page
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          console.log('Token stored in both storages'); // Debug log
        }

        return this.currentUser;
      }

      console.warn('Login failed: invalid credentials');
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  /**
   * Loads cached user info from sessionStorage or localStorage.
   */
  getCurrentUser(): AuthUser | null {
    if (this.currentUser) return this.currentUser;

    if (typeof window !== 'undefined') {
      // Try sessionStorage first
      let storedUser = sessionStorage.getItem('hrms_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.token = sessionStorage.getItem('hrms_token');
        return this.currentUser;
      }
      
      // Fallback to localStorage
      storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.token = localStorage.getItem('token');
        return this.currentUser;
      }
    }

    return null;
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      // Try sessionStorage first
      this.token = sessionStorage.getItem('hrms_token');
      if (this.token) return this.token;
      
      // Fallback to localStorage
      this.token = localStorage.getItem('token');
      return this.token;
    }
    return null;
  }

  logout(): void {
    this.currentUser = null;
    this.token = null;

    if (typeof window !== 'undefined') {
      // Clear both storages
      sessionStorage.removeItem('hrms_user');
      sessionStorage.removeItem('hrms_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Verifies JWT token with backend and refreshes session if valid.
   */
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.currentUser = data.user;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hrms_user', JSON.stringify(data.user));
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Ensures a valid admin session for protected pages.
   */
  async requireAdminSession(): Promise<boolean> {
    const user = this.getCurrentUser();

    // If storage is empty, try verifying token
    if (!user) {
      const valid = await this.verifyToken();
      if (!valid) return false;
    }

    const refreshedUser = this.getCurrentUser();
    return refreshedUser?.role === 'admin';
  }
}

export const auth = new AuthService();