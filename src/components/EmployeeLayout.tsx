// src/components/EmployeeLayout.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const [employeeName, setEmployeeName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user?.name) {
      setEmployeeName(user.name);
    }
  }, []);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-yellow-300/8 to-yellow-600/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-400/5 to-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Golden Grid Pattern Overlay */}
      <div className="fixed inset-0 opacity-5 z-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 215, 0) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header Navigation */}
      <nav className="relative z-20 bg-gradient-to-r from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl border-b border-yellow-400/20 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-3 rounded-xl shadow-lg">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                  Employee Portal
                </h1>
                {employeeName && (
                  <p className="text-yellow-400/80 font-medium">
                    Welcome, <span className="text-yellow-400 font-semibold">{employeeName}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                🚪 Logout
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Menu */}
      <div className="relative z-20 bg-gradient-to-r from-gray-800/50 via-gray-900/50 to-gray-800/50 backdrop-blur-lg border-b border-yellow-400/10 shadow-xl">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-2">
            <button
              onClick={() => navigateTo('/employee')}
              className="group relative py-4 px-6 text-gray-300 hover:text-yellow-400 font-semibold transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">🏠</span>
                <span>Dashboard</span>
              </div>
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:w-full transition-all duration-300 rounded-t-full" />
            </button>
            
            <button
              onClick={() => navigateTo('/employee/attendance')}
              className="group relative py-4 px-6 text-gray-300 hover:text-yellow-400 font-semibold transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">🕒</span>
                <span>My Attendance</span>
              </div>
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:w-full transition-all duration-300 rounded-t-full" />
            </button>
            
            <button
              onClick={() => navigateTo('/employee/leave')}
              className="group relative py-4 px-6 text-gray-300 hover:text-yellow-400 font-semibold transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">📝</span>
                <span>Leave Request</span>
              </div>
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:w-full transition-all duration-300 rounded-t-full" />
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto p-6">
        <div className="bg-gradient-to-br from-gray-900/30 via-black/50 to-gray-900/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-yellow-400/10 min-h-[calc(100vh-200px)] relative overflow-hidden">
          {/* Premium Border Glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-yellow-400/10 blur-xl opacity-40" />
          
          <div className="relative z-10 p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}