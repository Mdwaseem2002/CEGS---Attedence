// src/app/api/attendance/manual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { verifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const {
      employeeId,
      employeeName,
      date,
      loginTime,
      logoutTime,
      totalHours,
      isLate,
      location
    } = body;

    // Validation
    if (!employeeName || !date || !loginTime) {
      return NextResponse.json(
        { success: false, message: 'Employee name, date, and login time are required' },
        { status: 400 }
      );
    }

    // Generate custom ID
    const customId = `ATT${Date.now()}`;

    // Create new attendance record
    const attendance = await Attendance.create({
      id: customId,
      employeeId: employeeId || customId,
      employeeName,
      date,
      loginTime,
      logoutTime: logoutTime || null,
      totalHours: totalHours || 0,
      isLate: isLate || false,
      location: location || 'Office',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Manual attendance created:', attendance);

    return NextResponse.json({
      success: true,
      data: attendance,
      message: 'Attendance record added successfully'
    });
  } catch (error: any) {
    console.error('Add manual attendance error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to add attendance record'
      },
      { status: 500 }
    );
  }
}