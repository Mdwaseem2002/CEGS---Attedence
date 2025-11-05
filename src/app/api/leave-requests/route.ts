// src/app/api/leave-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import Employee from '@/models/Employee';
import { verifyAuth } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

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

    console.log('=== FETCHING LEAVE REQUESTS ===');
    console.log('Auth user:', authResult.user);

    // If admin, get all leave requests directly
    if (authResult.user?.role === 'admin') {
      console.log('Admin user - fetching all leave requests');
      const leaveRequests = await LeaveRequest.find({}).sort({ appliedDate: -1, createdAt: -1 });
      console.log(`Found ${leaveRequests.length} leave requests`);
      return NextResponse.json({ success: true, data: leaveRequests });
    }

    // For employees, find their employee record first
    console.log('Employee user - finding employee record');
    const employee = await Employee.findOne({ 
      $or: [
        { employeeId: authResult.user?.id },
        ...(mongoose.Types.ObjectId.isValid(authResult.user?.id || '') 
          ? [{ _id: authResult.user?.id }] 
          : [])
      ]
    });

    if (!employee) {
      console.error('Employee not found for ID:', authResult.user?.id);
      return NextResponse.json(
        { success: false, message: 'Employee record not found' },
        { status: 404 }
      );
    }

    console.log('Employee found:', {
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name
    });

    // Get leave requests for this employee
    const query = { 
      $or: [
        { employeeId: employee.employeeId },
        { employeeId: employee._id.toString() }
      ]
    };

    const leaveRequests = await LeaveRequest.find(query).sort({ appliedDate: -1, createdAt: -1 });
    console.log(`Found ${leaveRequests.length} leave requests for employee`);
    
    return NextResponse.json({ success: true, data: leaveRequests });
  } catch (error: any) {
    console.error('❌ Get leave requests error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
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

    // Only employees can create leave requests
    if (authResult.user?.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admins cannot create leave requests' },
        { status: 403 }
      );
    }

    await connectDB();
    const leaveData = await request.json();

    console.log('=== LEAVE REQUEST SUBMISSION ===');
    console.log('Auth user ID:', authResult.user?.id);
    console.log('Leave data received:', leaveData);

    // Find the employee record
    const employee = await Employee.findOne({ 
      $or: [
        { employeeId: authResult.user?.id },
        ...(mongoose.Types.ObjectId.isValid(authResult.user?.id || '') 
          ? [{ _id: authResult.user?.id }] 
          : [])
      ]
    });
    
    if (!employee) {
      console.error('❌ Employee not found for ID:', authResult.user?.id);
      
      // Debug: List all employees
      const allEmployees = await Employee.find({}).select('employeeId _id name email');
      console.log('Available employees:', allEmployees.map(e => ({
        _id: e._id.toString(),
        employeeId: e.employeeId,
        name: e.name
      })));
      
      return NextResponse.json(
        { success: false, message: 'Employee not found. Please ensure you are logged in correctly.' },
        { status: 404 }
      );
    }

    console.log('✅ Employee found:', {
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email
    });

    // Validate dates
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    
    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      $or: [
        { employeeId: employee.employeeId },
        { employeeId: employee._id.toString() }
      ],
      status: { $ne: 'rejected' },
      $and: [
        { startDate: { $lte: leaveData.endDate } },
        { endDate: { $gte: leaveData.startDate } }
      ]
    });

    if (overlappingLeave) {
      return NextResponse.json(
        { success: false, message: 'You already have a leave request for overlapping dates' },
        { status: 400 }
      );
    }

    // Create leave request with proper employee ID
    const leaveRequestData = {
      employeeId: employee.employeeId || employee._id.toString(),
      employeeName: employee.name,
      leaveType: leaveData.leaveType,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      isPaid: false
    };

    console.log('Creating leave request with data:', leaveRequestData);

    const leaveRequest = new LeaveRequest(leaveRequestData);
    await leaveRequest.save();

    console.log('✅ Leave request created successfully:', leaveRequest);

    return NextResponse.json({ 
      success: true, 
      data: leaveRequest,
      message: 'Leave request submitted successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Create leave request error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}