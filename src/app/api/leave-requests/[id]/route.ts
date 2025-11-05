// src/app/api/leave-requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import { verifyAuth } from '@/lib/auth-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();
    const updateData = await request.json();

    console.log('=== UPDATING LEAVE REQUEST ===');
    console.log('Leave Request ID:', params.id);
    console.log('Update data:', updateData);

    // Only allow updating status and isPaid fields
    const allowedUpdates: any = {};
    if (updateData.status) allowedUpdates.status = updateData.status;
    if (updateData.isPaid !== undefined) allowedUpdates.isPaid = updateData.isPaid;

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found' },
        { status: 404 }
      );
    }

    console.log('✅ Leave request updated:', leaveRequest);

    return NextResponse.json({ 
      success: true, 
      data: leaveRequest,
      message: 'Leave request updated successfully'
    });
  } catch (error: any) {
    console.error('❌ Update leave request error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
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
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    console.log('=== DELETING LEAVE REQUEST ===');
    console.log('Leave Request ID:', params.id);
    console.log('User:', authResult.user);

    // Admin can delete any, employee can only delete their own pending requests
    const query: any = { _id: params.id };
    
    if (authResult.user?.role !== 'admin') {
      // For employees, find their employee record first
      const Employee = require('@/models/Employee').default;
      const employee = await Employee.findOne({ 
        $or: [
          { employeeId: authResult.user?.id },
          { _id: authResult.user?.id }
        ]
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }

      query.$or = [
        { employeeId: employee.employeeId },
        { employeeId: employee._id.toString() }
      ];
      query.status = 'pending';
    }

    const leaveRequest = await LeaveRequest.findOneAndDelete(query);

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found or cannot be deleted' },
        { status: 404 }
      );
    }

    console.log('✅ Leave request deleted:', leaveRequest);

    return NextResponse.json({ 
      success: true, 
      message: 'Leave request deleted successfully' 
    });
  } catch (error: any) {
    console.error('❌ Delete leave request error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}