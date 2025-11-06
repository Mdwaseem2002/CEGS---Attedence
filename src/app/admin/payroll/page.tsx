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
  totalWorkingDays: number;
  actualWorkingDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  sundays: number;
  perDaySalary: number;
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

      const employeesResponse = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (employeesResponse.status === 401) {
        setError('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      const employeesData = await employeesResponse.json();

      const leavesResponse = await fetch('/api/leave-requests', {
        headers: { 'Authorization': `Bearer ${token}` },
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
        setLeaveRequests(leavesData.data);
      }

    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Count Sundays in a given month
  const countSundaysInMonth = (year: number, month: number): number => {
    const date = new Date(year, month - 1, 1);
    let sundays = 0;
    
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 0) { // Sunday
        sundays++;
      }
      date.setDate(date.getDate() + 1);
    }
    
    return sundays;
  };

  // Calculate leave days in a month (excluding Sundays)
  const calculateLeaveDaysInMonth = (
    startDate: string, 
    endDate: string, 
    targetMonth: number, 
    targetYear: number
  ): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0);
    
    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;
    
    if (overlapStart > overlapEnd) return 0;
    
    // Count days excluding Sundays
    let leaveDays = 0;
    const currentDate = new Date(overlapStart);
    
    while (currentDate <= overlapEnd) {
      if (currentDate.getDay() !== 0) { // Not Sunday
        leaveDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return leaveDays;
  };

  const generatePayroll = () => {
    console.log('=== GENERATING PAYROLL (6-DAY WORK WEEK) ===');
    console.log('Month:', selectedMonth, 'Year:', selectedYear);
    
    const monthInt = parseInt(selectedMonth);
    const sundays = countSundaysInMonth(selectedYear, monthInt);
    const daysInMonth = new Date(selectedYear, monthInt, 0).getDate();
    const totalWorkingDays = daysInMonth - sundays;
    
    console.log('📅 Month Details:', {
      totalDays: daysInMonth,
      sundays: sundays,
      workingDays: totalWorkingDays
    });
    
    const payroll = employees.map(employee => {
      const employeeIds = [
        employee.id,
        employee.employeeId,
        employee._id
      ].filter(Boolean);

      console.log(`\n--- Processing ${employee.name} ---`);

      const employeeLeaves = leaveRequests.filter(leave => {
        return employeeIds.includes(leave.employeeId) && leave.status === 'approved';
      });

      console.log(`Found ${employeeLeaves.length} approved leaves`);

      // Calculate leave days (excluding Sundays)
      let paidLeaves = 0;
      let unpaidLeaves = 0;

      employeeLeaves.forEach(leave => {
        const days = calculateLeaveDaysInMonth(
          leave.startDate,
          leave.endDate,
          monthInt,
          selectedYear
        );
        
        if (days > 0) {
          if (leave.isPaid) {
            paidLeaves += days;
            console.log(`  ✅ Paid leave: ${days} days (excluding Sundays)`);
          } else {
            unpaidLeaves += days;
            console.log(`  ❌ Unpaid leave: ${days} days (excluding Sundays)`);
          }
        }
      });

      console.log(`Total Leaves - Paid: ${paidLeaves}, Unpaid: ${unpaidLeaves}`);

      // Calculate per-day salary based on working days (excluding Sundays)
      const perDaySalary = employee.salary / totalWorkingDays;
      
      // Actual working days = Total working days - all leaves (paid + unpaid)
      const actualWorkingDays = totalWorkingDays - paidLeaves - unpaidLeaves;
      
      // Deduction = Unpaid leaves × per day salary
      const deductions = unpaidLeaves * perDaySalary;
      
      // Final salary = Base salary - deductions
      const finalSalary = employee.salary - deductions;

      console.log('💰 Salary Calculation:', {
        baseSalary: employee.salary,
        totalWorkingDays: totalWorkingDays,
        perDaySalary: perDaySalary.toFixed(2),
        actualWorkingDays: actualWorkingDays,
        deductions: deductions.toFixed(2),
        finalSalary: finalSalary.toFixed(2)
      });

      return {
        id: `${employee.id}-${selectedYear}-${selectedMonth}`,
        employeeId: employee.id,
        employeeName: employee.name,
        baseSalary: employee.salary,
        totalWorkingDays: totalWorkingDays,
        actualWorkingDays: actualWorkingDays,
        paidLeaves: paidLeaves,
        unpaidLeaves: unpaidLeaves,
        sundays: sundays,
        perDaySalary: parseFloat(perDaySalary.toFixed(2)),
        deductions: Math.round(deductions),
        finalSalary: Math.round(finalSalary),
        month: selectedMonth,
        year: selectedYear
      };
    });

    console.log('=== PAYROLL GENERATED ===');
    setPayrollRecords(payroll);
  };

  const exportPayslip = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const payroll = payrollRecords.find(record => record.employeeId === employeeId);
    
    if (!employee || !payroll) return;

    const monthName = new Date(selectedYear, parseInt(selectedMonth) - 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
Base Monthly Salary:                   ₹${payroll.baseSalary.toLocaleString()}

─────────────────────────────────────────────────────────
ATTENDANCE SUMMARY (6-DAY WORK WEEK)
─────────────────────────────────────────────────────────
Total Days in Month:                   ${new Date(selectedYear, parseInt(selectedMonth), 0).getDate()} days
Sundays (Holidays):                    ${payroll.sundays} days
Total Working Days:                    ${payroll.totalWorkingDays} days
Paid Leaves Taken:                     ${payroll.paidLeaves} days
Unpaid Leaves Taken:                   ${payroll.unpaidLeaves} days
Actual Working Days:                   ${payroll.actualWorkingDays} days

Per Day Salary:                        ₹${payroll.perDaySalary.toLocaleString()}
(Monthly Salary ÷ Working Days = ₹${payroll.baseSalary.toLocaleString()} ÷ ${payroll.totalWorkingDays})

─────────────────────────────────────────────────────────
DEDUCTIONS
─────────────────────────────────────────────────────────
Unpaid Leave Deduction:
  ${payroll.unpaidLeaves} days × ₹${payroll.perDaySalary.toLocaleString()} = ₹${payroll.deductions.toLocaleString()}

═══════════════════════════════════════════════════════════
NET SALARY:                            ₹${payroll.finalSalary.toLocaleString()}
═══════════════════════════════════════════════════════════

Calculation: Base Salary - Deductions
            ₹${payroll.baseSalary.toLocaleString()} - ₹${payroll.deductions.toLocaleString()} = ₹${payroll.finalSalary.toLocaleString()}

─────────────────────────────────────────────────────────
IMPORTANT NOTES:
• Sundays are considered weekly holidays (not counted in working days)
• Paid leaves do not affect salary calculation
• Only unpaid leaves result in salary deductions
• Per day salary is calculated as: Monthly Salary ÷ Working Days
  (Working Days = Total Days - Sundays)

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
      ['Employee', 'Base Salary', 'Working Days', 'Actual Days', 'Paid Leaves', 'Unpaid Leaves', 'Sundays', 'Per Day Salary', 'Deductions', 'Final Salary'],
      ...payrollRecords.map(record => [
        `"${record.employeeName}"`,
        record.baseSalary.toString(),
        record.totalWorkingDays.toString(),
        record.actualWorkingDays.toString(),
        record.paidLeaves.toString(),
        record.unpaidLeaves.toString(),
        record.sundays.toString(),
        record.perDaySalary.toFixed(2),
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
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-yellow-300/8 to-yellow-600/8 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 215, 0) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                  💰 Payroll Management (6-Day Work Week)
                </h2>
                <p className="text-gray-400 mt-2">
                  Employees: {employees.length} | Approved Leaves: {leaveRequests.filter(l => l.status === 'approved').length} | Sundays excluded from working days
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={loadData}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center gap-2">🔄 Refresh Data</span>
                </button>
                <button
                  onClick={exportMonthlyPayroll}
                  disabled={payrollRecords.length === 0}
                  className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">📊 Export Summary</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-4 rounded-xl">
                {error}
              </div>
            )}

            {/* Period Selection */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 p-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                <span className="text-2xl">📅</span>Select Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-yellow-400 mb-3">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl text-white font-semibold"
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl text-white font-semibold"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 p-4 rounded-2xl border border-yellow-400/30">
                    <div className="text-xs text-yellow-400 font-semibold mb-1">💎 Total Payroll</div>
                    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                      ₹{totalPayroll.toLocaleString()}
                    </div>
                  </div>
                  {totalDeductions > 0 && (
                    <div className="bg-gradient-to-r from-red-400/20 to-red-500/20 p-3 rounded-2xl border border-red-400/30">
                      <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Deductions</div>
                      <div className="text-xl font-bold text-red-400">
                        ₹{totalDeductions.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payroll Table */}
            {payrollRecords.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Payroll
                    {payrollRecords[0] && (
                      <span className="text-sm font-normal text-gray-400 ml-4">
                        ({payrollRecords[0].totalWorkingDays} working days, {payrollRecords[0].sundays} Sundays)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-yellow-400/20">
                    <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Base Salary</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Per Day</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Actual Days</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Paid Leaves</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Unpaid Leaves</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Deductions</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Final Salary</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-400/10">
                      {payrollRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-yellow-400/5 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-white">{record.employeeName}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">₹{record.baseSalary.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-blue-400 font-mono">₹{record.perDaySalary.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                              {record.actualWorkingDays}/{record.totalWorkingDays}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">
                              ✅ {record.paidLeaves}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30">
                              ❌ {record.unpaidLeaves}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-semibold ${record.deductions > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                              {record.deductions > 0 ? `-₹${record.deductions.toLocaleString()}` : '₹0'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg font-bold bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
                              💰 ₹{record.finalSalary.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => exportPayslip(record.employeeId)}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105"
                            >
                              📄 Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          <span className="text-gray-300 font-semibold">Working Days (excluding Sundays):</span>
          <span className="text-yellow-400 font-bold">26 Days</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
          <span className="text-gray-300 font-semibold">Per Day Salary:</span>
          <span className="text-yellow-400 font-bold">₹12,000 ÷ 26 = ₹461.54</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-yellow-400/20">
          <span className="text-gray-300 font-semibold">Absent Days:</span>
          <span className="text-red-400 font-bold">2 Days × ₹461.54 = ₹923.08</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30">
          <span className="text-green-300 font-semibold">Final Salary:</span>
          <span className="text-green-400 font-bold text-lg">₹12,000 - ₹923.08 = ₹11,076.92</span>
        </div>
        <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-400/20 mt-4">
          <p className="text-blue-300 text-xs leading-relaxed">
            <strong>Note:</strong> Sunday is a holiday, so only six working days are counted per week. 
            Working days are calculated as total month days minus Sundays. Paid leaves do not affect salary; 
            only unpaid leaves cause deductions.
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