// src/app/api/debug/employee/route.ts
// This is a temporary debug endpoint to help identify the employee ID mismatch
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { verifyAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all employees for comparison
    const allEmployees = await Employee.find({}).select('employeeId _id name email role');
    
    // Try to find current user's employee record
    const currentEmployee = await Employee.findOne({ 
      $or: [
        { employeeId: authResult.user?.id },
        { _id: authResult.user?.id }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        authUserId: authResult.user?.id,
        authUserRole: authResult.user?.role,
        currentEmployee: currentEmployee,
        allEmployees: allEmployees.map(emp => ({
          _id: emp._id.toString(),
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          role: emp.role
        }))
      }
    });
  } catch (error: any) {
    console.error('Debug employee error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}