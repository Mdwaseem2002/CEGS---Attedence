// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, generateToken } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    // If token is valid, generate a new one
    if (authResult.success && authResult.user) {
      const newToken = generateToken({
        id: authResult.user.id,
        employeeId: authResult.user.employeeId,
        username: authResult.user.username,
        name: authResult.user.name,
        email: authResult.user.email,
        role: authResult.user.role
      }, '24h');

      return NextResponse.json({
        success: true,
        token: newToken,
        message: 'Token refreshed successfully'
      });
    }
    
    // If token is expired, try to refresh it (grace period)
    if (authResult.expired) {
      try {
        // Decode the expired token to get user info
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(request.headers.get('authorization')?.substring(7)) as any;
        
        if (decoded && decoded.id) {
          // Verify user still exists and is active
          await connectDB();
          const user = await Employee.findOne({ 
            $or: [{ id: decoded.id }, { employeeId: decoded.id }] 
          });

          if (user) {
            const newToken = generateToken({
              id: user.id || user.employeeId,
              employeeId: user.employeeId || user.id,
              username: user.username || user.email,
              name: user.name,
              email: user.email,
              role: user.role
            }, '24h');

            return NextResponse.json({
              success: true,
              token: newToken,
              message: 'Token refreshed successfully'
            });
          }
        }
      } catch (error) {
        console.error('Error refreshing expired token:', error);
      }
    }

    return NextResponse.json(
      { success: false, message: authResult.message || 'Token refresh failed' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}