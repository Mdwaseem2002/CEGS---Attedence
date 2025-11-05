// src/components/ProtectedRoute.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(`[ProtectedRoute] ${message}`);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        addDebug('Starting auth check...');
        addDebug(`Admin only: ${adminOnly}`);

        // Get token from localStorage OR sessionStorage
        let token = localStorage.getItem('token');
        addDebug(`Token from localStorage: ${token ? 'EXISTS' : 'NULL'}`);
        
        if (!token) {
          token = sessionStorage.getItem('hrms_token');
          addDebug(`Token from sessionStorage: ${token ? 'EXISTS' : 'NULL'}`);
        }
        
        if (!token) {
          addDebug('❌ No token found - redirecting to login');
          setTimeout(() => router.push('/login'), 1000);
          return;
        }

        addDebug('✅ Token found, verifying...');

        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        addDebug(`Verify response status: ${response.status}`);

        if (!response.ok) {
          addDebug(`❌ Verification failed with status ${response.status}`);
          localStorage.removeItem('token');
          sessionStorage.removeItem('hrms_token');
          setTimeout(() => router.push('/login'), 1000);
          return;
        }

        const data = await response.json();
        addDebug(`Verify response: ${JSON.stringify(data)}`);

        if (!data.success || !data.user) {
          addDebug('❌ Invalid verification response');
          localStorage.removeItem('token');
          sessionStorage.removeItem('hrms_token');
          setTimeout(() => router.push('/login'), 1000);
          return;
        }

        addDebug(`User role: ${data.user.role}`);
        
        // Check admin requirement
        if (adminOnly && data.user.role !== 'admin') {
          addDebug(`❌ Admin required but user is ${data.user.role}`);
          setTimeout(() => router.push('/login'), 1000);
          return;
        }

        addDebug('✅ Authorization successful!');
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        addDebug(`❌ Error: ${error}`);
        console.error('Auth check error:', error);
        setTimeout(() => router.push('/login'), 1000);
      }
    };

    checkAuth();
  }, [router, adminOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
          <p className="text-yellow-400 font-semibold mb-4">Verifying access...</p>
          
          {/* Debug Info */}
          <div className="mt-6 bg-gray-900 border border-yellow-400/30 rounded-lg p-4 text-left">
            <h4 className="text-yellow-400 font-bold mb-2">🔍 Debug Log:</h4>
            <div className="space-y-1 text-xs text-gray-300 max-h-64 overflow-y-auto font-mono">
              {debugInfo.map((info, idx) => (
                <div key={idx}>{info}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-semibold">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}