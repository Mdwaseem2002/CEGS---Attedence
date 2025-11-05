// src/app/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginType = searchParams.get('type') || 'admin';

  // Removed auto-populate - users must manually enter credentials

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login...');
      const user = await auth.login(username, password);
      
      console.log('Login result:', user);
      
      if (user) {
        // Add a small delay to ensure storage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify token is stored
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('hrms_token');
        console.log('Token stored after login:', !!storedToken);
        
        // Successful login - redirect based on role
        if (user.role === 'admin') {
          console.log('Redirecting to admin dashboard...');
          router.push('/admin');
        } else {
          console.log('Redirecting to employee dashboard...');
          router.push('/employee');
        }
      } else {
        setError('Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-yellow-300/8 to-yellow-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-400/5 to-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Golden Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 215, 0) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Login Card */}
      <div className="relative z-10 bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-yellow-400/20 max-w-md w-full mx-4">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-yellow-400/30">
                  <span className="text-3xl">
                    {loginType === 'admin' ? '🔐' : '👤'}
                  </span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/50 to-amber-500/50 rounded-full blur-lg opacity-60 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 tracking-tight mb-2">
              {loginType === 'admin' ? 'Admin Login' : 'Employee Login'}
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your credentials to access the system
            </p>
          </div>

          {/* Demo Credentials Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-400/30 rounded-xl">
            <div className="flex items-start">
              <span className="text-blue-400 mr-2 mt-0.5">ℹ️</span>
              <div className="text-sm">
                <p className="text-blue-400 font-semibold mb-2">Demo Credentials:</p>
                <div className="space-y-1 text-gray-300">
                  <p><span className="text-yellow-400 font-semibold">Admin:</span> admin@hrms.com / admin123</p>
                  <p><span className="text-yellow-400 font-semibold">Employee:</span> usman@cegs.com / usman@2017</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-yellow-400 mb-3">
                📧 Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                placeholder="Enter your username or email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-yellow-400 mb-3">
                🔒 Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl">
                <p className="flex items-center text-sm">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold py-3 px-6 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center">
                <span className="mr-2">{loading ? '⏳' : '🚀'}</span>
                {loading ? 'Logging in...' : 'Login'}
              </span>
            </button>
          </form>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold transition-colors duration-200 flex items-center justify-center mx-auto group"
              disabled={loading}
            >
              <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
              Back to Home
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-yellow-400/20 text-center">
            <p className="text-gray-500 text-xs">
              © 2025 CEGS - Corporate Enterprise Growth Solutions
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">
              Secure HR Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}