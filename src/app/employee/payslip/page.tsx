// src/app/admin/payroll/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

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
        setEmployees(employeesData.data);
      } else {
        setError(employeesData.message || 'Failed to load employees');
      }

      if (leavesData.success) {
        setLeaveRequests(leavesData.data);
      }

    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = () => {
    const monthKey = `${selectedYear}-${selectedMonth}`;
    
    const payroll = employees.map(employee => {
      // Get approved leaves for this employee and month
      const employeeLeaves = leaveRequests.filter(leave => 
        leave.employeeId === employee.id && 
        leave.status === 'approved' &&
        leave.startDate.startsWith(monthKey)
      );

      // Calculate leave days
      let paidLeaves = 0;
      let unpaidLeaves = 0;

      employeeLeaves.forEach(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        if (leave.isPaid) {
          paidLeaves += days;
        } else {
          unpaidLeaves += days;
        }
      });

      // Calculate working days (assuming 30 days per month)
      const totalDaysInMonth = 30;
      const workingDays = totalDaysInMonth - paidLeaves - unpaidLeaves;
      
      // Calculate deductions (unpaid leaves)
      const dailySalary = employee.salary / totalDaysInMonth;
      const deductions = unpaidLeaves * dailySalary;
      const finalSalary = employee.salary - deductions;

      return {
        id: `${employee.id}-${monthKey}`,
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

    setPayrollRecords(payroll);
  };

  const exportPayslip = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const payroll = payrollRecords.find(record => record.employeeId === employeeId);
    
    if (!employee || !payroll) return;

    const payslipContent = `
PAYSLIP - ${new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

Employee: ${employee.name}
Department: ${employee.department}
Position: ${employee.position}

EARNINGS:
Base Salary: ₹${payroll.baseSalary.toLocaleString()}

DEDUCTIONS:
Unpaid Leaves (${payroll.unpaidLeaves} days): ₹${payroll.deductions.toLocaleString()}

SUMMARY:
Working Days: ${payroll.workingDays}
Paid Leaves: ${payroll.paidLeaves}
Unpaid Leaves: ${payroll.unpaidLeaves}

NET SALARY: ₹${payroll.finalSalary.toLocaleString()}
    `;

    const blob = new Blob([payslipContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${employee.name}_${selectedMonth}_${selectedYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMonthlyPayroll = () => {
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
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                💰 Payroll Management
              </h2>
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-4 rounded-xl">
                {error}
              </div>
            )}

            {/* Period Selection Card */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              {/* Premium Border Glow */}
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
                  <div className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 p-6 rounded-2xl border border-yellow-400/30 shadow-xl">
                    <div className="text-sm text-yellow-400 font-semibold mb-1">💎 Total Payroll</div>
                    <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                      ₹{totalPayroll.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Table */}
            {payrollRecords.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                {/* Premium Border Glow */}
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
                              <span className="font-semibold text-red-400">₹{record.deductions.toLocaleString()}</span>
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
              {/* Premium Border Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-40" />
              
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  Payroll Calculation Example
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Base Salary:</span>
                      <span className="text-yellow-400 font-bold">₹15,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Leaves Taken:</span>
                      <span className="text-white font-bold">4 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Paid Leaves:</span>
                      <span className="text-green-400 font-bold">2 days</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Unpaid Leaves:</span>
                      <span className="text-red-400 font-bold">2 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Daily Salary:</span>
                      <span className="text-white font-bold">₹15,000 ÷ 30 = ₹500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
                      <span className="text-gray-300 font-semibold">Deduction:</span>
                      <span className="text-red-400 font-bold">2 × ₹500 = ₹1,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30">
                      <span className="text-green-300 font-semibold">Final Salary:</span>
                      <span className="text-green-400 font-bold text-lg">₹15,000 - ₹1,000 = ₹14,000</span>
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