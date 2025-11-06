// src/app/employee/payroll/page.tsx
'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeLayout from '@/components/EmployeeLayout';
import { auth } from '@/lib/auth';

interface Employee {
  _id: string;
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
}

interface LeaveRequest {
  _id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: string;
  isPaid: boolean;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  workingDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  deductions: number;
  finalSalary: number;
  month: string;
  year: number;
}

export default function EmployeePayrollPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPayroll, setCurrentPayroll] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initializePage();
    setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear && employee) {
      generatePayroll();
    }
  }, [selectedMonth, selectedYear, employee, leaveRequests]);

  const initializePage = async () => {
    try {
      setLoading(true);
      const user = auth.getCurrentUser();
      
      if (!user) {
        setError('User not found. Please login again.');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      // Fetch employee data
      const employeesResponse = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (employeesResponse.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }

      const employeesData = await employeesResponse.json();

      if (employeesData.success) {
        // Find current employee
        const currentEmployee = employeesData.data.find((emp: Employee) => 
          emp.id === user.id || emp.employeeId === user.id || emp._id === user.id
        );
        
        if (currentEmployee) {
          setEmployee(currentEmployee);
        } else {
          setError('Employee data not found.');
        }
      }

      // Fetch leave requests
      const leavesResponse = await fetch('/api/leave-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const leavesData = await leavesResponse.json();

      if (leavesData.success) {
        // Filter only current employee's leaves
        const myLeaves = leavesData.data.filter((leave: LeaveRequest) => 
          leave.employeeId === user.id
        );
        setLeaveRequests(myLeaves);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaveDaysInMonth = (startDate: string, endDate: string, targetMonth: number, targetYear: number): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0);
    
    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;
    
    if (overlapStart > overlapEnd) {
      return 0;
    }
    
    const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const generatePayroll = () => {
    if (!employee) return;

    // Get approved leaves for the selected month
    const employeeLeaves = leaveRequests.filter(leave => 
      leave.status === 'approved'
    );

    let paidLeaves = 0;
    let unpaidLeaves = 0;

    employeeLeaves.forEach(leave => {
      const days = calculateLeaveDaysInMonth(
        leave.startDate,
        leave.endDate,
        parseInt(selectedMonth),
        selectedYear
      );
      
      if (days > 0) {
        if (leave.isPaid) {
          paidLeaves += days;
        } else {
          unpaidLeaves += days;
        }
      }
    });

    const totalDaysInMonth = 30;
    const workingDays = totalDaysInMonth - paidLeaves - unpaidLeaves;
    
    const dailySalary = employee.salary / totalDaysInMonth;
    const deductions = unpaidLeaves * dailySalary;
    const finalSalary = employee.salary - deductions;

    const payroll: PayrollRecord = {
      id: `${employee.id}-${selectedYear}-${selectedMonth}`,
      employeeId: employee.id,
      employeeName: employee.name,
      baseSalary: employee.salary,
      workingDays,
      paidLeaves,
      unpaidLeaves,
      deductions: Math.round(deductions),
      finalSalary: Math.round(finalSalary),
      month: selectedMonth,
      year: selectedYear
    };

    setCurrentPayroll(payroll);
  };

  const exportPayslip = () => {
    if (!employee || !currentPayroll) return;

    const monthName = new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const payslipContent = `
═══════════════════════════════════════════════════════════
                    PAYSLIP
═══════════════════════════════════════════════════════════
Period: ${monthName}
Generated: ${new Date().toLocaleDateString()}

─────────────────────────────────────────────────────────
EMPLOYEE DETAILS
─────────────────────────────────────────────────────────
Name:       ${employee.name}
Department: ${employee.department}
Position:   ${employee.position}
Employee ID: ${employee.id}

─────────────────────────────────────────────────────────
EARNINGS
─────────────────────────────────────────────────────────
Base Salary:                           ₹${currentPayroll.baseSalary.toLocaleString()}

─────────────────────────────────────────────────────────
ATTENDANCE SUMMARY
─────────────────────────────────────────────────────────
Working Days:                          ${currentPayroll.workingDays} days
Paid Leaves:                           ${currentPayroll.paidLeaves} days
Unpaid Leaves:                         ${currentPayroll.unpaidLeaves} days

─────────────────────────────────────────────────────────
DEDUCTIONS
─────────────────────────────────────────────────────────
Unpaid Leave Deduction (${currentPayroll.unpaidLeaves} days):   ₹${currentPayroll.deductions.toLocaleString()}

═══════════════════════════════════════════════════════════
NET SALARY:                            ₹${currentPayroll.finalSalary.toLocaleString()}
═══════════════════════════════════════════════════════════

Calculation: Base Salary - Deductions
            ₹${currentPayroll.baseSalary.toLocaleString()} - ₹${currentPayroll.deductions.toLocaleString()} = ₹${currentPayroll.finalSalary.toLocaleString()}

─────────────────────────────────────────────────────────
This is a computer generated payslip and does not require signature.
    `;

    const blob = new Blob([payslipContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${employee.name.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <EmployeeLayout>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-yellow-400 text-lg font-semibold">Loading Payroll Information...</p>
            </div>
          </div>
        </EmployeeLayout>
      </ProtectedRoute>
    );
  }

  if (error || !employee) {
    return (
      <ProtectedRoute>
        <EmployeeLayout>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center bg-red-900/20 backdrop-blur-lg p-8 rounded-2xl border border-red-500/30">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-300 mb-4">Error Loading Payroll</h2>
              <p className="text-red-200 mb-6">{error || 'Failed to load employee data'}</p>
            </div>
          </div>
        </EmployeeLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <EmployeeLayout>
        <div className="min-h-screen bg-black relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-yellow-300/8 to-yellow-600/8 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-400/5 to-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500" />
          </div>

          {/* Golden Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 215, 0) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                  💰 My Payroll Information
                </h2>
                <p className="text-gray-400 mt-2">
                  View your salary details and download payslips
                </p>
              </div>
              {currentPayroll && (
                <button
                  onClick={exportPayslip}
                  className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    📄 Download Payslip
                  </span>
                </button>
              )}
            </div>

            {/* Employee Information Card */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  Employee Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-yellow-400/20">
                    <div className="text-sm text-gray-400 mb-1">Name</div>
                    <div className="text-lg font-bold text-white">{employee.name}</div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-yellow-400/20">
                    <div className="text-sm text-gray-400 mb-1">Employee ID</div>
                    <div className="text-lg font-bold text-white">{employee.id}</div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-yellow-400/20">
                    <div className="text-sm text-gray-400 mb-1">Department</div>
                    <div className="text-lg font-bold text-white">{employee.department}</div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-yellow-400/20">
                    <div className="text-sm text-gray-400 mb-1">Position</div>
                    <div className="text-lg font-bold text-white">{employee.position}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Selection */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  Select Period
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-yellow-400 mb-3">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white font-semibold shadow-lg transition-all duration-300"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')} className="bg-gray-800">
                          {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-yellow-400 mb-3">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white font-semibold shadow-lg transition-all duration-300"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <option key={year} value={year} className="bg-gray-800">
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Details */}
            {currentPayroll && (
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10">
                  <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-3">
                      <span className="text-2xl">💵</span>
                      Payroll for {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gradient-to-br from-green-600/10 to-green-700/10 rounded-2xl border border-green-400/30">
                        <div className="text-sm text-green-400 font-semibold mb-2">Base Salary</div>
                        <div className="text-4xl font-extrabold text-green-400">
                          ₹{currentPayroll.baseSalary.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="p-6 bg-gradient-to-br from-yellow-600/10 to-amber-700/10 rounded-2xl border border-yellow-400/30">
                        <div className="text-sm text-yellow-400 font-semibold mb-2">Net Salary</div>
                        <div className="text-4xl font-extrabold text-yellow-400">
                          ₹{currentPayroll.finalSalary.toLocaleString()}
                        </div>
                        <div className="text-xs text-yellow-400/60 mt-1">
                          After deductions
                        </div>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div>
                      <h4 className="text-lg font-bold text-yellow-400 mb-4">Attendance Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-400/30 text-center">
                          <div className="text-3xl font-bold text-blue-400 mb-1">{currentPayroll.workingDays}</div>
                          <div className="text-sm text-blue-300">Working Days</div>
                        </div>
                        <div className="p-4 bg-green-600/10 rounded-xl border border-green-400/30 text-center">
                          <div className="text-3xl font-bold text-green-400 mb-1">{currentPayroll.paidLeaves}</div>
                          <div className="text-sm text-green-300">Paid Leaves</div>
                        </div>
                        <div className="p-4 bg-red-600/10 rounded-xl border border-red-400/30 text-center">
                          <div className="text-3xl font-bold text-red-400 mb-1">{currentPayroll.unpaidLeaves}</div>
                          <div className="text-sm text-red-300">Unpaid Leaves</div>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    {currentPayroll.deductions > 0 && (
                      <div className="p-6 bg-red-900/20 rounded-2xl border border-red-400/30">
                        <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                          <span>⚠️</span>
                          Deductions
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Unpaid Leave Deduction ({currentPayroll.unpaidLeaves} days):</span>
                          <span className="text-2xl font-bold text-red-400">₹{currentPayroll.deductions.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Calculation Formula */}
                    <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-600/30">
                      <h4 className="text-lg font-bold text-gray-300 mb-4">Salary Calculation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Base Salary:</span>
                          <span className="text-white font-semibold">₹{currentPayroll.baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Daily Rate:</span>
                          <span className="text-white font-semibold">₹{Math.round(currentPayroll.baseSalary / 30).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Deductions:</span>
                          <span className="text-red-400 font-semibold">- ₹{currentPayroll.deductions.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-yellow-400/30 my-3"></div>
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-yellow-400 font-bold">Net Salary:</span>
                          <span className="text-yellow-400 font-bold">₹{currentPayroll.finalSalary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Information Note */}
            <div className="bg-gradient-to-br from-blue-900/20 via-blue-800/20 to-blue-900/20 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-400/30 p-6">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-2xl">ℹ️</span>
                <div>
                  <h4 className="text-blue-400 font-bold mb-2">Payroll Information</h4>
                  <ul className="space-y-2 text-sm text-blue-200">
                    <li>• Paid leaves do not affect your salary</li>
                    <li>• Only unpaid leaves result in deductions from your base salary</li>
                    <li>• Daily salary is calculated as: Base Salary ÷ 30 days</li>
                    <li>• Deduction = Unpaid Leave Days × Daily Salary</li>
                    <li>• Download your payslip for detailed breakdown</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    </ProtectedRoute>
  );
}