// ==========================================
// FILE: src/app/api/auth/login/route.ts
// ==========================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { username, password } = await request.json();

    // Check admin credentials
    if (username === 'usman@cegs.com' && password === '0786') {
      const token = jwt.sign(
        { id: 'admin', username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        user: { id: 'admin', username, role: 'admin' },
        token
      });
    }

    // Check employee credentials
    const employee = await Employee.findOne({ username });
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { 
        id: employee.id, 
        username: employee.username, 
        role: 'employee',
        name: employee.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
  success: true,
  token: token, // Make sure this is included!
  user: {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
  },
});
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
