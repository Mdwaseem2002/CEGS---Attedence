// src/types/index.ts
// Complete type definitions with all required fields

export interface Employee {
  id: string;
  _id?: string; // MongoDB ID (optional for compatibility)
  employeeId?: string; // Additional employee identifier
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string; // Required field
  department: string;
  position: string;
  salary: number;
  joinDate: string; // Note: Changed from joiningDate to match usage
  role?: 'admin' | 'employee';
}

export interface AttendanceRecord {
  id: string;
  _id?: string; // MongoDB ID (optional for compatibility)
  employeeId: string;
  employeeName: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  totalHours?: number; // Added missing field
  status: 'present' | 'absent' | 'late' | 'half-day';
  location: string;
  isLate: boolean;
}

export interface LeaveRequest {
  id: string;
  _id?: string; // MongoDB ID (optional for compatibility)
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'sick' | 'casual' | 'vacation' | 'other';
  leaveType?: string; // Alternative field name for type
  appliedDate: string;
  isPaid?: boolean; // Added missing field
}

export interface PayrollRecord {
  id: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
}

// Additional utility types
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'sick' | 'casual' | 'vacation' | 'other';
export type UserRole = 'admin' | 'employee';