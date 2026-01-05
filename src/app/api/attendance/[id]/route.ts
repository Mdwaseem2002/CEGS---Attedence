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

export async function PATCH(
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
    
    const body = await request.json();
    const { id } = params;

    console.log('Patching attendance:', id, body);

    // Find and update using custom 'id' field, not '_id'
    const attendance = await Attendance.findOneAndUpdate(
      { id: id }, // Query by custom id field
      {
        loginTime: body.loginTime,
        logoutTime: body.logoutTime,
        totalHours: body.totalHours,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    console.log('Attendance patched successfully:', attendance);

    return NextResponse.json({ 
      success: true, 
      data: attendance,
      message: 'Attendance updated successfully' 
    });
  } catch (error: any) {
    console.error('Patch attendance error:', error);
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

    console.log('Deleting attendance:', id);

    // Find and delete using custom 'id' field, not '_id'
    const attendance = await Attendance.findOneAndDelete({ id: id });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    console.log('Attendance deleted successfully:', attendance);

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance record deleted successfully' 
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