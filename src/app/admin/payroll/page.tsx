// src/app/admin/payroll/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

interface Employee {
  _id: string;
  id: string;
  employeeId?: string;
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

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadData();
    setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear && employees.length > 0) {
      console.log('Generating payroll for:', { selectedMonth, selectedYear });
      console.log('Leave requests:', leaveRequests);
      generatePayroll();
    }
  }, [selectedMonth, selectedYear, employees, leaveRequests]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        router.push('/login');
        return;
      }

      console.log('Fetching employees and leave requests...');

      // Fetch employees
      const employeesResponse = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (employeesResponse.status === 401) {
        setError('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      const employeesData = await employeesResponse.json();

      // Fetch leave requests
      const leavesResponse = await fetch('/api/leave-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const leavesData = await leavesResponse.json();

      if (employeesData.success) {
        console.log('✅ Employees loaded:', employeesData.data.length);
        setEmployees(employeesData.data);
      } else {
        setError(employeesData.message || 'Failed to load employees');
      }

      if (leavesData.success) {
        console.log('✅ Leave requests loaded:', leavesData.data.length);
        console.log('Approved leaves:', leavesData.data.filter((l: any) => l.status === 'approved'));
        setLeaveRequests(leavesData.data);
      }

    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaveDaysInMonth = (startDate: string, endDate: string, targetMonth: number, targetYear: number): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get the first and last day of target month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0);
    
    // Calculate overlap
    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;
    
    // If there's no overlap, return 0
    if (overlapStart > overlapEnd) {
      return 0;
    }
    
    // Calculate days (inclusive)
    const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const generatePayroll = () => {
    console.log('=== GENERATING PAYROLL ===');
    console.log('Month:', selectedMonth, 'Year:', selectedYear);
    
    const payroll = employees.map(employee => {
      // Get all possible employee ID variations
      const employeeIds = [
        employee.id,
        employee.employeeId,
        employee._id
      ].filter(Boolean);

      console.log(`\n--- Processing ${employee.name} ---`);
      console.log('Employee IDs to match:', employeeIds);

      // Get approved leaves for this employee
      const employeeLeaves = leaveRequests.filter(leave => {
        const matches = employeeIds.includes(leave.employeeId) && leave.status === 'approved';
        if (matches) {
          console.log('✅ Matched leave:', {
            type: leave.isPaid ? 'Paid' : 'Unpaid',
            dates: `${leave.startDate} to ${leave.endDate}`
          });
        }
        return matches;
      });

      console.log(`Found ${employeeLeaves.length} approved leaves for ${employee.name}`);

      // Calculate leave days for the selected month
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
            console.log(`  → Paid leave: ${days} days`);
          } else {
            unpaidLeaves += days;
            console.log(`  → Unpaid leave: ${days} days`);
          }
        }
      });

      console.log(`Total - Paid: ${paidLeaves}, Unpaid: ${unpaidLeaves}`);

      // Calculate working days (assuming 30 days per month)
      const totalDaysInMonth = 30;
      const workingDays = totalDaysInMonth - paidLeaves - unpaidLeaves;
      
      // Calculate deductions (unpaid leaves only)
      const dailySalary = employee.salary / totalDaysInMonth;
      const deductions = unpaidLeaves * dailySalary;
      const finalSalary = employee.salary - deductions;

      console.log('Salary calculation:', {
        baseSalary: employee.salary,
        dailySalary: dailySalary.toFixed(2),
        deductions: deductions.toFixed(2),
        finalSalary: finalSalary.toFixed(2)
      });

      return {
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
    });

    console.log('=== PAYROLL GENERATED ===');
    console.log('Total records:', payroll.length);
    setPayrollRecords(payroll);
  };

  const exportPayslip = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const payroll = payrollRecords.find(record => record.employeeId === employeeId);
    
    if (!employee || !payroll) return;

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
Base Salary:                           ₹${payroll.baseSalary.toLocaleString()}

─────────────────────────────────────────────────────────
ATTENDANCE SUMMARY
─────────────────────────────────────────────────────────
Working Days:                          ${payroll.workingDays} days
Paid Leaves:                           ${payroll.paidLeaves} days
Unpaid Leaves:                         ${payroll.unpaidLeaves} days

─────────────────────────────────────────────────────────
DEDUCTIONS
─────────────────────────────────────────────────────────
Unpaid Leave Deduction (${payroll.unpaidLeaves} days):   ₹${payroll.deductions.toLocaleString()}

═══════════════════════════════════════════════════════════
NET SALARY:                            ₹${payroll.finalSalary.toLocaleString()}
═══════════════════════════════════════════════════════════

Calculation: Base Salary - Deductions
            ₹${payroll.baseSalary.toLocaleString()} - ₹${payroll.deductions.toLocaleString()} = ₹${payroll.finalSalary.toLocaleString()}

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

  const exportMonthlyPayroll = () => {
    if (payrollRecords.length === 0) {
      alert('No payroll data to export');
      return;
    }

    const csvContent = [
      ['Employee', 'Base Salary', 'Working Days', 'Paid Leaves', 'Unpaid Leaves', 'Deductions', 'Final Salary'],
      ...payrollRecords.map(record => [
        `"${record.employeeName}"`,
        record.baseSalary.toString(),
        record.workingDays.toString(),
        record.paidLeaves.toString(),
        record.unpaidLeaves.toString(),
        record.deductions.toString(),
        record.finalSalary.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly_payroll_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPayroll = payrollRecords.reduce((sum, record) => sum + record.finalSalary, 0);
  const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.deductions, 0);

  if (loading) {
    return (
      <ProtectedRoute adminOnly>
        <AdminLayout>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              <p className="mt-4 text-yellow-400 font-semibold">Loading payroll data...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <AdminLayout>
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
                  💰 Payroll Management
                </h2>
                <p className="text-gray-400 mt-2">
                  Total Employees: {employees.length} | Approved Leaves: {leaveRequests.filter(l => l.status === 'approved').length}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={loadData}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-blue-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    🔄 Refresh Data
                  </span>
                </button>
                <button
                  onClick={exportMonthlyPayroll}
                  disabled={payrollRecords.length === 0}
                  className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    📊 Export Monthly Summary
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-4 rounded-xl flex justify-between items-center">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Period Selection Card */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  Select Period
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div>
                    <label className="block text-sm font-bold text-yellow-400 mb-3">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white font-semibold shadow-lg transition-all duration-300"
                    >
                      <option value="" className="bg-gray-800">Select Month</option>
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
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 p-4 rounded-2xl border border-yellow-400/30 shadow-xl">
                      <div className="text-xs text-yellow-400 font-semibold mb-1">💎 Total Payroll</div>
                      <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                        ₹{totalPayroll.toLocaleString()}
                      </div>
                    </div>
                    {totalDeductions > 0 && (
                      <div className="bg-gradient-to-r from-red-400/20 to-red-500/20 p-3 rounded-2xl border border-red-400/30 shadow-xl">
                        <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Total Deductions</div>
                        <div className="text-xl font-bold text-red-400">
                          ₹{totalDeductions.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Table */}
            {payrollRecords.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10">
                  <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-3">
                      <span className="text-2xl">📈</span>
                      Payroll for {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-yellow-400/20">
                      <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Base Salary</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Working Days</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Paid Leaves</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Unpaid Leaves</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Deductions</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Final Salary</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-400/10">
                        {payrollRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-yellow-400/5 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                              {record.employeeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <span className="font-semibold">₹{record.baseSalary.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                📅 {record.workingDays}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">
                                ✅ {record.paidLeaves}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30">
                                ❌ {record.unpaidLeaves}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-semibold ${record.deductions > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                {record.deductions > 0 ? `-₹${record.deductions.toLocaleString()}` : '₹0'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
                                💰 ₹{record.finalSalary.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => exportPayslip(record.employeeId)}
                                className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10 flex items-center gap-1">
                                  📄 Download Payslip
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Calculation Example */}
            <div className="bg-gradient-to-br from-yellow-400/10 via-amber-500/10 to-yellow-600/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/30 overflow-hidden relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-40" />
              
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  Payroll Calculation Formula
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Deduction:</span>
                      <span className="text-red-400 font-bold">3 × ₹400 = ₹1,200</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30">
                      <span className="text-green-300 font-semibold">Final Salary:</span>
                      <span className="text-green-400 font-bold text-lg">₹12,000 - ₹1,200 = ₹10,800</span>
                    </div>
                    <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-400/20 mt-4">
                      <p className="text-blue-300 text-xs leading-relaxed">
                        <strong>Note:</strong> Paid leaves do not affect salary. Only unpaid leaves result in deductions. 
                        Working days are calculated as: 30 days - (Paid Leaves + Unpaid Leaves).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}