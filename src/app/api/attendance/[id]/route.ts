// src/app/api/attendance/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { verifyAuth } from '@/lib/auth-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params;

    console.log('Updating attendance:', id, body);

    // Find and update the attendance record
    const attendance = await Attendance.findByIdAndUpdate(
      id,
      {
        logoutTime: body.logoutTime,
        totalHours: body.totalHours
      },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    console.log('Attendance updated successfully:', attendance);

    return NextResponse.json({ 
      success: true, 
      data: attendance,
      message: 'Checkout successful' 
    });
  } catch (error: any) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Server error' 
      },
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
    
    const { id } = params;

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance record deleted' 
    });
  } catch (error: any) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Server error' 
      },
      { status: 500 }
    );
  }
}