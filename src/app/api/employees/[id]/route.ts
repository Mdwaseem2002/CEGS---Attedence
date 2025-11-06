// ==========================================
// FILE: src/app/api/employees/[id]/route.ts
// ==========================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/lib/auth-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const employeeData = await request.json();

    // ⭐ FIX: Remove password field if it's empty or undefined
    // Only hash and update password if a new password is actually provided
    if (employeeData.password && employeeData.password.trim() !== '') {
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
    } else {
      // Remove password from update data to avoid validation error
      delete employeeData.password;
    }

    const employee = await Employee.findOneAndUpdate(
      { id: params.id },
      employeeData,
      { 
        new: true, 
        runValidators: true,
        // ⭐ IMPORTANT: This prevents validation on fields not being updated
        context: 'query'
      }
    ).select('-password');

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const employee = await Employee.findOneAndDelete({ id: params.id });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}