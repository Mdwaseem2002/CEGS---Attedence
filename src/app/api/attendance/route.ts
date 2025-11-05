// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
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
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    let query = {};
    if (employeeId) {
      query = { employeeId };
    } else if (authResult.user?.role === 'employee') {
      // If employee, only show their own records
      query = { employeeId: authResult.user.id };
    }

    const attendanceRecords = await Attendance.find(query).sort({ date: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: attendanceRecords 
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    
    console.log('Received attendance data:', body);

    // Validate required fields
    if (!body.id || !body.employeeId || !body.employeeName) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: id, employeeId, or employeeName',
          received: body 
        },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employeeId: body.employeeId,
      date: body.date
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance already marked for today' },
        { status: 400 }
      );
    }

    // Create new attendance record
    const attendanceData = {
      id: body.id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      date: body.date,
      loginTime: body.loginTime,
      logoutTime: body.logoutTime || null,
      totalHours: body.totalHours || 0,
      isLate: body.isLate || false,
      location: body.location || 'Office'
    };

    console.log('Creating attendance with data:', attendanceData);

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    console.log('Attendance created successfully:', attendance);

    return NextResponse.json({ 
      success: true, 
      data: attendance,
      message: 'Attendance marked successfully' 
    });
  } catch (error: any) {
    console.error('Create attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Server error',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}