// src/app/employee/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeLayout from '@/components/EmployeeLayout';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatTime, formatDate, isLateLogin } from '@/lib/utils';
import { AttendanceRecord, Employee, LeaveRequest } from '@/types';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeDashboard = async () => {
      const user = auth.getCurrentUser();
      
      if (!user) {
        console.error('No user found, redirecting to login');
        router.push('/login?type=employee');
        return;
      }

      console.log('Current user:', user);

      await Promise.all([
        loadEmployeeData(user.id),
        loadTodayAttendance(user.id),
        loadRecentLeaves(user.id),
        loadWeeklyAttendance(user.id)
      ]);

      setLoading(false);
    };

    initializeDashboard();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // Auto checkout at 19:00 (7 PM)
  useEffect(() => {
    const checkAutoCheckout = async () => {
      if (!todayAttendance || !isLoggedIn || !employee) return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Check if it's 19:00 (7 PM) or later and user hasn't checked out
      if (hours >= 19 && !todayAttendance.logoutTime) {
        console.log('🕐 Auto checkout triggered at', formatTime(now));
        await performAutoCheckout();
      }
    };

    // Check every minute
    const autoCheckoutInterval = setInterval(checkAutoCheckout, 60000);
    
    // Also check immediately
    checkAutoCheckout();

    return () => clearInterval(autoCheckoutInterval);
  }, [todayAttendance, isLoggedIn, employee]);

  const performAutoCheckout = async () => {
    if (!todayAttendance || !employee) return;

    try {
      const checkoutTime = '19:00';
      const totalHours = calculateWorkingHours(todayAttendance.loginTime, checkoutTime);

      console.log('=== AUTO CHECK OUT ===');
      console.log('Attendance ID:', todayAttendance.id || todayAttendance._id);
      console.log('Auto Logout Time:', checkoutTime);
      console.log('Total Hours:', totalHours);

      const updatedRecord: AttendanceRecord = {
        ...todayAttendance,
        logoutTime: checkoutTime,
        totalHours
      };

      const recordId = todayAttendance._id || todayAttendance.id;
      
      if (!recordId) {
        console.error('No record ID found:', todayAttendance);
        return;
      }

      const success = await db.updateAttendanceRecord(recordId, updatedRecord);

      if (success) {
        console.log('✅ Auto check-out successful');
        
        // Reload attendance data
        const user = auth.getCurrentUser();
        if (user) {
          await loadTodayAttendance(user.id);
          await loadWeeklyAttendance(user.id);
        }
      }
    } catch (error) {
      console.error('Auto check-out error:', error);
    }
  };

  const loadEmployeeData = async (userId: string) => {
    try {
      console.log('Loading employee data for user ID:', userId);
      const employees = await db.getEmployees();
      
      const emp = employees.find(e => 
        e.id === userId || 
        e.employeeId === userId || 
        e._id === userId
      );
      
      if (emp) {
        console.log('✅ Employee found:', {
          name: emp.name,
          id: emp.id,
          employeeId: emp.employeeId
        });
        setEmployee(emp);
      } else {
        console.error('❌ Employee not found for user ID:', userId);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const loadTodayAttendance = async (userId: string) => {
    try {
      console.log('Loading today attendance for user ID:', userId);
      
      const employees = await db.getEmployees();
      const emp = employees.find(e => 
        e.id === userId || 
        e.employeeId === userId || 
        e._id === userId
      );

      if (!emp) {
        console.error('Employee not found when loading attendance');
        return;
      }

      const possibleIds = [emp.id, emp.employeeId, emp._id].filter(Boolean);
      let allAttendance: AttendanceRecord[] = [];
      
      for (const id of possibleIds) {
        try {
          const records = await db.getAttendanceRecords(id as string);
          allAttendance = [...allAttendance, ...records];
        } catch (err) {
          console.log(`No records found for ID: ${id}`);
        }
      }

      const today = formatDate(new Date());
      
      const todayRecord = allAttendance.find(record => {
        let recordDate = record.date;
        
        if (recordDate.includes('T')) {
          recordDate = recordDate.split('T')[0];
        }
        
        recordDate = recordDate.split(' ')[0];
        
        return recordDate === today;
      });
      
      if (todayRecord) {
        console.log('✅ Today record found:', {
          id: todayRecord.id || todayRecord._id,
          date: todayRecord.date,
          loginTime: todayRecord.loginTime,
          logoutTime: todayRecord.logoutTime
        });
      }
      
      setTodayAttendance(todayRecord || null);
      setIsLoggedIn(!!todayRecord && !todayRecord.logoutTime);
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  };

  const loadRecentLeaves = async (userId: string) => {
    try {
      const employees = await db.getEmployees();
      const emp = employees.find(e => 
        e.id === userId || 
        e.employeeId === userId || 
        e._id === userId
      );

      if (!emp) return;

      const possibleIds = [emp.id, emp.employeeId, emp._id].filter(Boolean);
      let allLeaves: LeaveRequest[] = [];
      
      for (const id of possibleIds) {
        try {
          const leaves = await db.getLeaveRequests(id as string);
          allLeaves = [...allLeaves, ...leaves];
        } catch (err) {
          console.log(`No leaves found for ID: ${id}`);
        }
      }

      const uniqueLeaves = Array.from(
        new Map(allLeaves.map(leave => [(leave.id || leave._id), leave])).values()
      );

      const sortedLeaves = uniqueLeaves
        .sort((a, b) => new Date(b.appliedDate || '').getTime() - new Date(a.appliedDate || '').getTime())
        .slice(0, 3);
      
      setRecentLeaves(sortedLeaves);
    } catch (error) {
      console.error('Error loading recent leaves:', error);
    }
  };

  const loadWeeklyAttendance = async (userId: string) => {
    try {
      const employees = await db.getEmployees();
      const emp = employees.find(e => 
        e.id === userId || 
        e.employeeId === userId || 
        e._id === userId
      );

      if (!emp) return;

      const possibleIds = [emp.id, emp.employeeId, emp._id].filter(Boolean);
      let allAttendance: AttendanceRecord[] = [];
      
      for (const id of possibleIds) {
        try {
          const records = await db.getAttendanceRecords(id as string);
          allAttendance = [...allAttendance, ...records];
        } catch (err) {
          console.log(`No attendance found for ID: ${id}`);
        }
      }

      const uniqueAttendance = Array.from(
        new Map(allAttendance.map(record => [(record.id || record._id), record])).values()
      );

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyRecords = uniqueAttendance
        .filter(record => {
          const recordDate = new Date(record.date.split('T')[0]);
          return recordDate >= oneWeekAgo;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setWeeklyAttendance(weeklyRecords);
    } catch (error) {
      console.error('Error loading weekly attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) {
      alert('Employee information not loaded. Please refresh the page.');
      return;
    }

    try {
      const user = auth.getCurrentUser();
      if (user) {
        await loadTodayAttendance(user.id);
      }

      if (todayAttendance) {
        alert('❌ You have already checked in today!');
        return;
      }

      const now = new Date();
      const loginTime = formatTime(now);
      const isLate = isLateLogin(loginTime);

      const primaryId = employee.employeeId || employee.id;

      const attendanceRecord: AttendanceRecord = {
        id: `ATT${Date.now()}`,
        employeeId: primaryId,
        employeeName: employee.name,
        date: formatDate(now),
        loginTime,
        isLate,
        location: 'Office',
        status: 'present'
      };

      const success = await db.addAttendanceRecord(attendanceRecord);

      if (success) {
        alert(`✅ Checked in successfully at ${loginTime}!${isLate ? ' (Late)' : ''}`);
        
        if (user) {
          await loadTodayAttendance(user.id);
          await loadWeeklyAttendance(user.id);
        }
      } else {
        alert('❌ Failed to check in. Please try again.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('❌ Error checking in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance || !employee) {
      alert('No check-in record found.');
      return;
    }

    try {
      const now = new Date();
      const logoutTime = formatTime(now);
      const totalHours = calculateWorkingHours(todayAttendance.loginTime, logoutTime);

      const updatedRecord: AttendanceRecord = {
        ...todayAttendance,
        logoutTime,
        totalHours
      };

      const recordId = todayAttendance._id || todayAttendance.id;
      
      if (!recordId) {
        alert('Error: Record ID not found');
        return;
      }

      const success = await db.updateAttendanceRecord(recordId, updatedRecord);

      if (success) {
        alert(`✅ Checked out successfully at ${logoutTime}!`);
        
        const user = auth.getCurrentUser();
        if (user) {
          await loadTodayAttendance(user.id);
          await loadWeeklyAttendance(user.id);
        }
      } else {
        alert('Failed to check out. Please try again.');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Error checking out. Please try again.');
    }
  };

  const calculateWorkingHours = (loginTime: string, logoutTime: string): number => {
    const login = new Date(`2000-01-01 ${loginTime}`);
    const logout = new Date(`2000-01-01 ${logoutTime}`);
    const diff = logout.getTime() - login.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 text-lg font-semibold">Loading Dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center bg-red-900/20 backdrop-blur-lg p-6 md:p-8 rounded-2xl border border-red-500/30 max-w-md">
            <div className="text-4xl md:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl md:text-2xl font-bold text-red-300 mb-4">Failed to Load Employee Information</h2>
            <p className="text-sm md:text-base text-red-200 mb-6">Please try logging in again.</p>
            <button
              onClick={() => router.push('/login?type=employee')}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-sm md:text-base"
            >
              Go to Login
            </button>
          </div>
        </div>
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
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-yellow-300/8 to-yellow-600/8 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Golden Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255, 215, 0) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10 p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative p-4 md:p-8">
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-2 md:mb-3">
                    Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, {employee.name}!
                  </h2>
                  <p className="text-yellow-300/80 text-sm md:text-lg font-semibold">
                    {employee.position} • {employee.department}
                  </p>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <div className="text-2xl md:text-3xl font-mono text-yellow-400 font-bold">
                    {currentTime.toLocaleTimeString()}
                  </div>
                  <div className="text-yellow-300/70 font-medium text-xs md:text-base">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Check In/Out Card */}
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10 p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-4 md:mb-6 flex items-center gap-2">
                    <span className="text-xl md:text-2xl">🕒</span>
                    Today&apos;s Attendance
                  </h3>
                  
                  {todayAttendance ? (
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                        <span className="text-sm md:text-base text-gray-300">Check In:</span>
                        <span className={`font-bold text-sm md:text-base ${todayAttendance.isLate ? 'text-red-400' : 'text-green-400'}`}>
                          {todayAttendance.loginTime} {todayAttendance.isLate && '(Late)'}
                        </span>
                      </div>
                      
                      {todayAttendance.logoutTime && (
                        <>
                          <div className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                            <span className="text-sm md:text-base text-gray-300">Check Out:</span>
                            <span className="font-bold text-sm md:text-base text-blue-400">
                              {todayAttendance.logoutTime}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                            <span className="text-sm md:text-base text-gray-300">Total Hours:</span>
                            <span className="font-bold text-sm md:text-base text-purple-400">
                              {todayAttendance.totalHours}h
                            </span>
                          </div>
                        </>
                      )}
                      
                      {isLoggedIn ? (
                        <button
                          onClick={handleCheckOut}
                          className="group w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                        >
                          🚪 Check Out
                        </button>
                      ) : todayAttendance.logoutTime ? (
                        <div className="w-full bg-gradient-to-r from-gray-600/50 to-gray-700/50 text-gray-300 font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl text-center border border-gray-600/30 text-sm md:text-base">
                          ✅ Day Completed
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-400 mb-4 md:mb-6 text-base md:text-lg">You haven&apos;t checked in today</p>
                      <button
                        onClick={handleCheckIn}
                        className="group w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                      >
                        🚀 Check In
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10 p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-4 md:mb-6 flex items-center gap-2">
                    <span className="text-xl md:text-2xl">⚡</span>
                    Quick Actions
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    <button
                      onClick={() => router.push('/employee/attendance')}
                      className="group w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>🕒</span>
                        View Attendance
                      </span>
                    </button>
                    <button
                      onClick={() => router.push('/employee/leave')}
                      className="group w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>📝</span>
                        Request Leave
                      </span>
                    </button>
                    <button
                      onClick={() => router.push('/employee/payroll')}
                      className="group w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>💰</span>
                        My Payroll
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10 p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-4 md:mb-6 flex items-center gap-2">
                    <span className="text-xl md:text-2xl">📊</span>
                    This Week&apos;s Stats
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                      <span className="text-sm md:text-base text-gray-300">Days Present:</span>
                      <span className="font-bold text-green-400 text-base md:text-lg">
                        {weeklyAttendance.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                      <span className="text-sm md:text-base text-gray-300">Late Arrivals:</span>
                      <span className="font-bold text-red-400 text-base md:text-lg">
                        {weeklyAttendance.filter(record => record.isLate).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                      <span className="text-sm md:text-base text-gray-300">Total Hours:</span>
                      <span className="font-bold text-blue-400 text-base md:text-lg">
                        {weeklyAttendance.reduce((sum, record) => sum + (record.totalHours || 0), 0).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Recent Attendance */}
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10">
                  <div className="px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                    <h3 className="text-lg md:text-xl font-bold text-yellow-400 flex items-center gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📅</span>
                      Recent Attendance
                    </h3>
                  </div>
                  <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                    {weeklyAttendance.slice(0, 5).map((record) => (
                      <div key={record.id || record._id} className="flex justify-between items-center p-3 md:p-4 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                        <div>
                          <div className="font-bold text-white text-sm md:text-lg">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs md:text-sm text-gray-400">
                            {record.loginTime} - {record.logoutTime || 'Active'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs md:text-sm font-bold mb-1 ${record.isLate ? 'text-red-400' : 'text-green-400'}`}>
                            {record.isLate ? '🔴 Late' : '🟢 On Time'}
                          </div>
                          <div className="text-xs md:text-sm text-gray-400 font-semibold">
                            {record.totalHours ? `${record.totalHours}h` : '0h'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Leave Requests */}
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10">
                  <div className="px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                    <h3 className="text-lg md:text-xl font-bold text-yellow-400 flex items-center gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📋</span>
                      Recent Leave Requests
                    </h3>
                  </div>
                  <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                    {recentLeaves.length === 0 ? (
                      <p className="text-gray-400 text-center py-6 md:py-8 text-base md:text-lg">No leave requests yet</p>
                    ) : (
                      recentLeaves.map((leave) => (
                        <div key={leave.id || leave._id} className="p-3 md:p-4 bg-gray-800/30 rounded-lg md:rounded-xl border border-yellow-400/10">
                          <div className="flex justify-between items-start mb-2 md:mb-3">
                            <div className="font-bold text-white text-sm md:text-lg">
                              {leave.leaveType}
                            </div>
                            <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                              leave.status === 'approved' 
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                                : leave.status === 'rejected'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                                : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                            }`}>
                              {leave.status === 'approved' ? '✅' : leave.status === 'rejected' ? '❌' : '⏳'} {leave.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs md:text-sm text-gray-400 mb-2">
                            {leave.startDate} to {leave.endDate}
                          </div>
                          {leave.status === 'approved' && leave.isPaid !== undefined && (
                            <div className="text-xs font-semibold">
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg ${
                                leave.isPaid 
                                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' 
                                  : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                              }`}>
                                {leave.isPaid ? '💰 Paid Leave' : '📋 Unpaid Leave'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Checkout Info Banner */}
            {isLoggedIn && (
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 backdrop-blur-xl rounded-xl border border-blue-400/30 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <p className="text-blue-300 font-semibold text-sm md:text-base">
                      Auto Checkout Enabled
                    </p>
                    <p className="text-blue-200/70 text-xs md:text-sm">
                      You will be automatically checked out at 7:00 PM (19:00) if you forget to check out manually.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </EmployeeLayout>
    </ProtectedRoute>
  );
}