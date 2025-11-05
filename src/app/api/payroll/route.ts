// ==========================================
// FILE: src/app/api/payroll/route.ts
// ==========================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
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
    if (employeeId && authResult.user?.role === 'employee') {
      query = { employeeId };
    }

    const payrolls = await Payroll.find(query).sort({ month: -1 });
    return NextResponse.json({ success: true, data: payrolls });
  } catch (error) {
    console.error('Get payroll records error:', error);
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
    const payrollData = await request.json();

    const payroll = new Payroll(payrollData);
    await payroll.save();

    return NextResponse.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Create payroll record error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
