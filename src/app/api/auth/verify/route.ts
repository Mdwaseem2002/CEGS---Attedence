// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    console.log('Verify endpoint - Token received:', !!token); // Debug log

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      console.log('Token verified successfully:', decoded); // Debug log

      return NextResponse.json({
        success: true,
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          email: decoded.email
        }
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verify endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}