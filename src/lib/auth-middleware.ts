// src/lib/auth-middleware.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface DecodedToken {
  id: string;
  employeeId?: string;
  username?: string;
  name?: string;
  email?: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthResult {
  success: boolean;
  user?: DecodedToken;
  message?: string;
  expired?: boolean; // Track if token is expired
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message: 'No token provided',
        expired: false
      };
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      
      return {
        success: true,
        user: decoded,
        expired: false
      };
    } catch (jwtError: any) {
      // Check if token is expired
      if (jwtError.name === 'TokenExpiredError') {
        console.warn('Token expired at:', jwtError.expiredAt);
        return {
          success: false,
          message: 'Token expired',
          expired: true
        };
      }
      
      // Other JWT errors (invalid signature, malformed, etc.)
      console.error('JWT verification error:', jwtError.message);
      return {
        success: false,
        message: 'Invalid token',
        expired: false
      };
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      message: 'Authentication failed',
      expired: false
    };
  }
}

// Helper to generate tokens with configurable expiry
export function generateToken(payload: Omit<DecodedToken, 'iat' | 'exp'>, expiresIn: string = '24h'): string {
  return jwt.sign(payload as Record<string, any>, JWT_SECRET, { expiresIn } as any);
}

// Helper to decode token without verification (to check expiry)
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}