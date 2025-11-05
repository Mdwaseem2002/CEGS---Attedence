// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import bcrypt from 'bcryptjs';
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
    const employees = await Employee.find({}).select('-password').sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    
    console.log('Received data:', body);

    // Generate unique ID
    const generatedId = body.id || body.employeeId || `EMP${Date.now()}`;

    // Check for existing employee
    const existingEmployee = await Employee.findOne({
      $or: [
        { id: generatedId },
        { employeeId: generatedId },
        { username: body.username }
      ]
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: 'Employee ID or username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Prepare employee data with both id and employeeId
    const employeeData = {
      id: generatedId,
      employeeId: generatedId,
      name: body.name,
      email: body.email,
      username: body.username,
      password: hashedPassword,
      department: body.department,
      position: body.position,
      salary: body.salary,
      joiningDate: body.joiningDate
    };

    console.log('Creating employee with:', employeeData);

    const employee = new Employee(employeeData);
    await employee.save();

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    return NextResponse.json({ success: true, data: employeeResponse });
  } catch (error: any) {
    console.error('Create employee error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Employee ID or username already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}