// src/app/employee/attendance/page.tsx
'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeLayout from '@/components/EmployeeLayout';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { AttendanceRecord } from '@/types';

export default function EmployeeAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    totalHours: 0,
    avgHours: 0
  });

  useEffect(() => {
    const initializePage = async () => {
      const user = auth.getCurrentUser();
      if (user) {
        await loadAttendanceData(user.id);
      }
      setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
      setLoading(false);
    };

    initializePage();
  }, []);

  useEffect(() => {
    filterAndCalculateStats();
  }, [attendanceRecords, selectedMonth, selectedYear]);

  const loadAttendanceData = async (userId: string) => {
    try {
      console.log('Loading attendance for user ID:', userId);
      
      // Get employee to find all possible ID variations
      const employees = await db.getEmployees();
      const emp = employees.find(e => 
        e.id === userId || 
        e.employeeId === userId || 
        e._id === userId
      );

      if (!emp) {
        console.error('Employee not found for user ID:', userId);
        setAttendanceRecords([]);
        return;
      }

      console.log('Employee found:', {
        name: emp.name,
        id: emp.id,
        employeeId: emp.employeeId,
        _id: emp._id
      });

      // Try all possible ID variations
      const possibleIds = [emp.id, emp.employeeId, emp._id].filter(Boolean);
      console.log('Searching attendance with IDs:', possibleIds);

      let allAttendance: AttendanceRecord[] = [];
      
      // Fetch attendance for all possible IDs
      for (const id of possibleIds) {
        try {
          const records = await db.getAttendanceRecords(id as string);
          console.log(`Found ${records.length} records for ID: ${id}`);
          allAttendance = [...allAttendance, ...records];
        } catch (err) {
          console.log(`No records found for ID: ${id}`);
        }
      }

      console.log('Total attendance records found:', allAttendance.length);

      // Remove duplicates by using a Map with record ID as key
      const uniqueAttendance = Array.from(
        new Map(allAttendance.map(record => [(record.id || record._id), record])).values()
      );

      console.log('Unique attendance records:', uniqueAttendance.length);

      // Sort by date (newest first)
      const sortedRecords = uniqueAttendance.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAttendanceRecords(sortedRecords);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setAttendanceRecords([]);
    }
  };

  const filterAndCalculateStats = () => {
    let filtered = attendanceRecords;

    if (selectedMonth && selectedYear) {
      const monthKey = `${selectedYear}-${selectedMonth}`;
      console.log('Filtering for month:', monthKey);
      
      filtered = attendanceRecords.filter(record => {
        // Handle different date formats
        let recordDate = record.date;
        
        // If date is ISO format, extract date part
        if (recordDate.includes('T')) {
          recordDate = recordDate.split('T')[0];
        }
        
        // Remove any time part if present
        recordDate = recordDate.split(' ')[0];
        
        const matches = recordDate.startsWith(monthKey);
        return matches;
      });

      console.log(`Filtered ${filtered.length} records for ${monthKey}`);
    }

    setFilteredRecords(filtered);

    // Calculate statistics
    const totalDays = getDaysInMonth(selectedYear, parseInt(selectedMonth));
    const presentDays = filtered.length;
    const lateDays = filtered.filter(record => record.isLate).length;
    const totalHours = filtered.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const avgHours = presentDays > 0 ? totalHours / presentDays : 0;

    console.log('Stats calculated:', {
      totalDays,
      presentDays,
      lateDays,
      totalHours: Math.round(totalHours * 100) / 100,
      avgHours: Math.round(avgHours * 100) / 100
    });

    setStats({
      totalDays,
      presentDays,
      lateDays,
      totalHours: Math.round(totalHours * 100) / 100,
      avgHours: Math.round(avgHours * 100) / 100
    });
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Date', 'Day', 'Login Time', 'Logout Time', 'Total Hours', 'Status', 'Location'],
      ...filteredRecords.map(record => [
        record.date,
        new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        record.loginTime,
        record.logoutTime || 'Not logged out',
        record.totalHours?.toString() || '0',
        record.isLate ? 'Late' : 'On Time',
        record.location
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_attendance_${selectedMonth}_${selectedYear}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <EmployeeLayout>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-yellow-400 text-lg font-semibold">Loading Attendance...</p>
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
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                My Attendance Records
              </h2>
              <button
                onClick={exportAttendance}
                disabled={filteredRecords.length === 0}
                className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  📊 Export Data
                </span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              {/* Premium Border Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10">
                <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-3">
                    <span className="text-2xl">🔍</span>
                    Filter by Period
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-yellow-400 mb-3">Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
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
                        className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                      >
                        {Array.from({ length: 3 }, (_, i) => {
                          const year = new Date().getFullYear() - 1 + i;
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
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-400/20 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 to-blue-600/10 blur-lg opacity-60" />
                <div className="relative z-10">
                  <div className="text-3xl font-extrabold text-blue-400 mb-2">{stats.totalDays}</div>
                  <div className="text-sm text-blue-300/80 font-semibold">Total Days</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-green-400/20 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/10 to-green-600/10 blur-lg opacity-60" />
                <div className="relative z-10">
                  <div className="text-3xl font-extrabold text-green-400 mb-2">{stats.presentDays}</div>
                  <div className="text-sm text-green-300/80 font-semibold">Present Days</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-400/20 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/10 to-red-600/10 blur-lg opacity-60" />
                <div className="relative z-10">
                  <div className="text-3xl font-extrabold text-red-400 mb-2">{stats.lateDays}</div>
                  <div className="text-sm text-red-300/80 font-semibold">Late Days</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-400/20 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/10 to-purple-600/10 blur-lg opacity-60" />
                <div className="relative z-10">
                  <div className="text-3xl font-extrabold text-purple-400 mb-2">{stats.totalHours}h</div>
                  <div className="text-sm text-purple-300/80 font-semibold">Total Hours</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-400/20 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/10 to-orange-600/10 blur-lg opacity-60" />
                <div className="relative z-10">
                  <div className="text-3xl font-extrabold text-orange-400 mb-2">{stats.avgHours}h</div>
                  <div className="text-sm text-orange-300/80 font-semibold">Avg Hours/Day</div>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              {/* Premium Border Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10">
                <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    Attendance Records for {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-yellow-400/20">
                    <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Day</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Login Time</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Logout Time</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Total Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-400/10">
                      {filteredRecords.map((record) => (
                        <tr key={record.id || record._id} className="hover:bg-yellow-400/5 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {record.loginTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {record.logoutTime || 'Not logged out'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {record.totalHours ? `${record.totalHours}h` : '0h'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                              record.isLate 
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' 
                                : 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                            }`}>
                              {record.isLate ? '🔴 Late' : '🟢 On Time'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gray-600/20 text-gray-300 border border-gray-600/30">
                              📍 {record.location}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredRecords.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📅</div>
                      <div className="text-xl font-bold text-gray-400 mb-2">No attendance records found</div>
                      <div className="text-gray-500">No records available for the selected period.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    </ProtectedRoute>
  );
}