// src/app/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import Calendar from '@/components/Calendar';
import { db } from '@/lib/db';
import { AttendanceRecord } from '@/types';

export default function AdminDashboard() {
  const [todayLogins, setTodayLogins] = useState(0);
  const [uniqueLocations, setUniqueLocations] = useState(0);
  const [lateEmployees, setLateEmployees] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Replace the useEffect in src/app/admin/page.tsx

useEffect(() => {
  const verifyAndLoadData = async () => {
    // Verify admin session first
    const isValidAdmin = await auth.requireAdminSession();
    
    if (!isValidAdmin) {
      router.push('/login?type=admin');
      return;
    }

    // Initial load
    await loadDashboardData();
    
    // Auto-refresh every 30 seconds to show new check-ins
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    setLoading(false);

    return () => clearInterval(interval);
  };

  verifyAndLoadData();
}, [router]);

// Add this new function
const loadDashboardData = async () => {
  try {
    console.log('🔄 Loading admin dashboard data...');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today\'s date:', today);
    
    // Fetch attendance records from API
    const attendance = await db.getAttendanceRecords();
    
    console.log('Total attendance records fetched:', attendance.length);
    console.log('Sample record:', attendance[0]);
    
    // Filter today's records
    const todayRecords = attendance.filter(record => {
      const recordDate = record.date.split('T')[0]; // Handle ISO date format
      return recordDate === today;
    });
    
    console.log('Today\'s attendance records:', todayRecords.length);
    console.log('Today\'s records:', todayRecords);
    
    setTodayLogins(todayRecords.length);
    
    // Get unique locations
    const locations = new Set(
      todayRecords.map(record => record.location || 'Office')
    );
    setUniqueLocations(locations.size);
    
    // Filter late employees (after 9:15 AM)
    const lateRecords = todayRecords.filter(record => record.isLate);
    setLateEmployees(lateRecords);
    
    console.log('📊 Dashboard Stats:', {
      todayLogins: todayRecords.length,
      uniqueLocations: locations.size,
      lateEmployees: lateRecords.length
    });
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
  }
};

  // Show loading state while verifying session
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 text-lg font-semibold">Loading Dashboard...</p>
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
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-yellow-400/30">
                  <span className="text-black text-2xl font-bold">👑</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/50 to-amber-500/50 rounded-full blur-lg opacity-60 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-2 tracking-tight">
              Administrator Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Command center for enterprise workforce management
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-yellow-400/10 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center">
                      <span className="mr-2">🕒</span>
                      Today&apos;s Logins
                    </h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">{todayLogins}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-yellow-400/10 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center">
                      <span className="mr-2">📍</span>
                      Unique Locations
                    </h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">{uniqueLocations}</p>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
                    <span className="mr-2">📅</span>
                    Attendance Calendar
                  </h3>
                  <Calendar />
                </div>
              </div>

              {/* Late Login Alerts */}
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-red-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/5 via-red-500/5 to-red-400/5 blur-xl opacity-60" />
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Late Login Alerts (After 10:15 AM)
                  </h3>
                  {lateEmployees.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">✅</div>
                      <p className="text-gray-400 text-lg">No late logins today</p>
                      <p className="text-yellow-400/60 text-sm">All employees are on time!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lateEmployees.map((employee) => (
                        <div key={employee.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-xl border border-red-400/30">
                          <span className="font-semibold text-white flex items-center">
                            <span className="mr-2">👤</span>
                            {employee.employeeName}
                          </span>
                          <span className="text-red-400 font-mono bg-red-900/50 px-3 py-1 rounded-lg">
                            {employee.loginTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Navigation */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-yellow-400 mb-6 text-center">Quick Access Portal</h3>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => router.push('/admin/employees')}
                      className="group w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold py-4 px-6 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center">
                        <span className="mr-3 text-xl">👤</span>
                        Employees
                      </span>
                    </button>

                    <button
                      onClick={() => router.push('/admin/attendance')}
                      className="group w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 px-6 rounded-xl shadow-xl border-2 border-green-400/30 hover:border-green-400/60 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center">
                        <span className="mr-3 text-xl">🕒</span>
                        Attendance
                      </span>
                    </button>

                    <button
                      onClick={() => router.push('/admin/leave-requests')}
                      className="group w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 px-6 rounded-xl shadow-xl border-2 border-orange-400/30 hover:border-orange-400/60 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center">
                        <span className="mr-3 text-xl">📝</span>
                        Leave Requests
                      </span>
                    </button>

                    <button
                      onClick={() => router.push('/admin/payroll')}
                      className="group w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 px-6 rounded-xl shadow-xl border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center">
                        <span className="mr-3 text-xl">💰</span>
                        Payroll
                      </span>
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-yellow-400/5 to-amber-500/5 rounded-xl border border-yellow-400/20">
                    <h4 className="text-yellow-400 font-semibold text-sm mb-2 text-center">System Status</h4>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Server:</span>
                      <span className="text-green-400 font-semibold">● Online</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">Database:</span>
                      <span className="text-green-400 font-semibold">● Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 CEGS - Corporate Enterprise Growth Solutions
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">
              Administrator Dashboard - Secure Access Portal
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}