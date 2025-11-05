// src/components/AdminLayout.tsx
'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleBack = () => {
    router.back();
  };

  const goToHome = () => {
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-yellow-400/5 to-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-l from-yellow-300/5 to-yellow-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Golden Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-3" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 215, 0) 1px, transparent 0)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Navigation Header */}
      <nav className="relative z-20 bg-gradient-to-r from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl border-b border-yellow-400/20 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-xl ring-2 ring-yellow-400/30">
                    <span className="text-black text-xl font-bold">C</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/30 to-amber-500/30 rounded-full blur-md opacity-60" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    CEGS
                  </h1>
                  <p className="text-xs text-gray-400 -mt-1">Administrator Panel</p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-3 ml-8">
                <button 
                  onClick={handleBack}
                  className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg border border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300 shadow-lg hover:shadow-yellow-400/10"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">←</span>
                  <span className="text-sm font-medium">Back</span>
                </button>

                <button 
                  onClick={goToHome}
                  className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 hover:from-yellow-400/20 hover:to-amber-500/20 text-yellow-400 rounded-lg border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg hover:shadow-yellow-400/10"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">🏠</span>
                  <span className="text-sm font-medium">Home</span>
                </button>
              </div>
            </div>

            {/* Right Section - User Info & Logout */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right mr-4">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-yellow-400">
  {user?.role ? user.role.toUpperCase() : 'ROLE'}
</p>

                </div>
              )}
              <button 
                onClick={handleLogout}
                className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg border border-red-400/30 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:shadow-red-400/10"
              >
                <span className="text-lg group-hover:scale-110 transition-transform duration-300">🚪</span>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-gray-900/40 via-black/60 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-yellow-400/10 shadow-2xl min-h-[calc(100vh-200px)] p-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-gray-500 text-sm">
          © 2025 CEGS - Corporate Enterprise Growth Solutions
        </p>
        <p className="text-yellow-400/40 text-xs mt-1">
          Advanced Human Resource Management System
        </p>
      </footer>
    </div>
  );
}