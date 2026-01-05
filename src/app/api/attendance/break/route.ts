// src/app/api/attendance/[id]/break/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { verifyAuth } from '@/lib/auth-middleware';

// Start a break
export async function POST(
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
    const { startTime } = body;

    if (!startTime) {
      return NextResponse.json(
        { success: false, message: 'Start time is required' },
        { status: 400 }
      );
    }

    const attendance = await Attendance.findById(params.id);
    
    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Check if there's an active break
    const activeBreak = attendance.breaks?.find((b: any) => !b.endTime);
    if (activeBreak) {
      return NextResponse.json(
        { success: false, message: 'There is already an active break' },
        { status: 400 }
      );
    }

    // Add new break
    const newBreak = {
      id: `BRK${Date.now()}`,
      startTime,
      endTime: undefined,
      duration: undefined
    };

    if (!attendance.breaks) {
      attendance.breaks = [];
    }
    attendance.breaks.push(newBreak);

    await attendance.save();

    return NextResponse.json({ 
      success: true, 
      data: attendance,
      message: 'Break started successfully' 
    });
  } catch (error: any) {
    console.error('Start break error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// End a break
export async function PATCH(
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
    const { endTime } = body;

    if (!endTime) {
      return NextResponse.json(
        { success: false, message: 'End time is required' },
        { status: 400 }
      );
    }

    const attendance = await Attendance.findById(params.id);
    
    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Find active break
    const activeBreakIndex = attendance.breaks?.findIndex((b: any) => !b.endTime);
    if (activeBreakIndex === -1 || activeBreakIndex === undefined) {
      return NextResponse.json(
        { success: false, message: 'No active break found' },
        { status: 400 }
      );
    }

    // Calculate break duration
    const breakStart = new Date(`2000-01-01 ${attendance.breaks[activeBreakIndex].startTime}`);
    const breakEnd = new Date(`2000-01-01 ${endTime}`);
    const duration = Math.round((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));

    // Update break
    attendance.breaks[activeBreakIndex].endTime = endTime;
    attendance.breaks[activeBreakIndex].duration = duration;

    // Calculate total break time
    const totalBreakTime = attendance.breaks.reduce((sum: number, b: any) => 
      sum + (b.duration || 0), 0
    );
    attendance.totalBreakTime = totalBreakTime;

    // Recalculate net working hours
    if (attendance.totalHours) {
      attendance.netWorkingHours = Math.max(0, attendance.totalHours - (totalBreakTime / 60));
    }

    await attendance.save();

    return NextResponse.json({ 
      success: true, 
      data: attendance,
      message: 'Break ended successfully' 
    });
  } catch (error: any) {
    console.error('End break error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}