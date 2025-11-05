// src/lib/auth-middleware.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface DecodedToken {
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthResult {
  success: boolean;
  user?: DecodedToken;
  message?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message: 'No token provided'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      
      console.log('Decoded token:', decoded);
      
      return {
        success: true,
        user: decoded
      };
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return {
        success: false,
        message: 'Invalid token'
      };
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      message: 'Authentication failed'
    };
  }
}