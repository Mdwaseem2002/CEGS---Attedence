// src/app/admin/attendance/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import { AttendanceRecord } from '@/types';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const verifyAndLoadData = async () => {
      const isValidAdmin = await auth.requireAdminSession();
      
      if (!isValidAdmin) {
        router.push('/login?type=admin');
        return;
      }

      await loadAttendance();
    };

    verifyAndLoadData();
  }, [router]);

  useEffect(() => {
    filterAttendance();
  }, [attendance, searchEmployee, searchDate]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const token = auth.getToken();
      
      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAttendance(data.data);
      } else {
        setError('Failed to load attendance records');
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = attendance;

    if (searchEmployee) {
      filtered = filtered.filter(record => 
        record.employeeName.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter(record => record.date === searchDate);
    }

    setFilteredAttendance(filtered);
  };

  const exportFullReport = () => {
    const csvContent = [
      ['Employee', 'Date', 'Login Time', 'Logout Time', 'Total Hours', 'Late', 'Location'],
      ...filteredAttendance.map(record => [
        record.employeeName,
        record.date,
        record.loginTime,
        record.logoutTime || 'Not logged out',
        record.totalHours?.toString() || '0',
        record.isLate ? 'Yes' : 'No',
        record.location
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLateReport = () => {
    const lateRecords = filteredAttendance.filter(record => record.isLate);
    const csvContent = [
      ['Employee', 'Date', 'Login Time', 'Location'],
      ...lateRecords.map(record => [
        record.employeeName,
        record.date,
        record.loginTime,
        record.location
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `late_login_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 text-lg font-semibold">Loading Attendance Records...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
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

        {/* Main Content */}
        <div className="relative z-10 p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start items-center mb-4">
                <div className="relative mr-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-yellow-400/30">
                    <span className="text-black text-xl font-bold">🕒</span>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/50 to-amber-500/50 rounded-full blur-lg opacity-60 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 tracking-tight">
                    Attendance Management
                  </h2>
                  <p className="text-gray-300 text-sm">Monitor and analyze workforce attendance patterns</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportFullReport}
                disabled={filteredAttendance.length === 0}
                className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  <span className="mr-2">📊</span>
                  Export Full Report
                </span>
              </button>
              <button
                onClick={exportLateReport}
                disabled={filteredAttendance.filter(r => r.isLate).length === 0}
                className="group bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold px-6 py-3 rounded-xl shadow-xl border-2 border-red-400/30 hover:border-red-400/60 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Export Late Report
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-400/50 text-red-200 px-6 py-4 rounded-xl">
              <p className="flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-yellow-400 mb-6 flex items-center">
                <span className="mr-2">🔍</span>
                Search & Filter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-yellow-400 mb-3">Search Employee</label>
                  <input
                    type="text"
                    value={searchEmployee}
                    onChange={(e) => setSearchEmployee(e.target.value)}
                    placeholder="Enter employee name..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-yellow-400 mb-3">Filter by Date</label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                  />
                </div>
              </div>
              
              {/* Results Count */}
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-lg border border-yellow-400/20">
                <p className="text-yellow-400 text-sm font-semibold">
                  <span className="mr-2">📈</span>
                  Showing {filteredAttendance.length} of {attendance.length} records
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
            <div className="relative z-10">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 border-b border-yellow-400/30">
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        👤 Employee
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📅 Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        🕐 Login Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        🕕 Logout Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        ⏱️ Total Hours
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📊 Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📍 Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="text-6xl mb-4">📋</div>
                          <p className="text-gray-400 text-lg">No attendance records found</p>
                          <p className="text-yellow-400/60 text-sm">Try adjusting your search filters</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((record, index) => (
                        <tr 
                          key={record.id} 
                          className={`hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-amber-500/5 transition-all duration-300 ${
                            index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-900/20'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-3">
                                <span className="text-black text-xs font-bold">
                                  {record.employeeName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {record.employeeName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
                              {record.date}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
                              {record.loginTime}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
                              {record.logoutTime || 'Not logged out'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-yellow-400">
                              {record.totalHours ? `${record.totalHours}h` : '0h'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              record.isLate 
                                ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-400/30' 
                                : 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-400/30'
                            }`}>
                              {record.isLate ? '⚠️ Late' : '✅ On Time'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-300 bg-gray-800/50 px-2 py-1 rounded flex items-center">
                              <span className="mr-1">📍</span>
                              {record.location}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {filteredAttendance.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-green-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/5 to-green-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="text-green-400 font-semibold text-sm mb-1">On Time</h3>
                  <p className="text-2xl font-bold text-white">
                    {filteredAttendance.filter(r => !r.isLate).length}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-red-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/5 to-red-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <h3 className="text-red-400 font-semibold text-sm mb-1">Late Arrivals</h3>
                  <p className="text-2xl font-bold text-white">
                    {filteredAttendance.filter(r => r.isLate).length}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="text-yellow-400 font-semibold text-sm mb-1">Total Records</h3>
                  <p className="text-2xl font-bold text-white">
                    {filteredAttendance.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              © 2025 CEGS - Corporate Enterprise Growth Solutions
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">
              Attendance Management System - Real-time Workforce Analytics
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}