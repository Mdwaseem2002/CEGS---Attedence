import React from 'react';

export default function HomePage() {
  return (
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

      {/* Top Navigation Header */}
      <div className="relative z-20 bg-gradient-to-r from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl border-b border-yellow-400/20 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Company Name */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-xl ring-2 ring-yellow-400/30">
                  <span className="text-black text-lg font-bold tracking-wider">C</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/50 to-amber-500/50 rounded-full blur-md opacity-60 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 tracking-tight">
                  CEGS
                </h1>
                <p className="text-yellow-400/80 text-sm font-medium">
                  Corporate Enterprise Growth Solutions
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-4">
              <a
                href="/login?type=admin"
                className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  👑 Admin Portal
                </span>
              </a>
              
              <a
                href="/login?type=employee"
                className="group bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold px-6 py-3 rounded-xl shadow-xl border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  💼 Employee Access
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl w-full items-center">
          
          {/* Left Column - Main Content */}
          <div className="space-y-8">
            <div className="text-left">
              <h2 className="text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-6 tracking-tight leading-tight">
                Elevate Your Workforce
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-lg">
                Transform your business with innovative technology and strategic human resource solutions designed for the modern enterprise.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-400/10 to-amber-500/10 p-6 rounded-xl border border-yellow-400/20 text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="text-yellow-400 font-semibold mb-2">Enterprise Ready</h3>
                <p className="text-gray-400 text-sm">Scalable solutions for businesses of all sizes</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-400/10 to-amber-500/10 p-6 rounded-xl border border-yellow-400/20 text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-yellow-400 font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-gray-400 text-sm">Data-driven insights for strategic decisions</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-400/10 to-amber-500/10 p-6 rounded-xl border border-yellow-400/20 text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-yellow-400 font-semibold mb-2">Secure & Compliant</h3>
                <p className="text-gray-400 text-sm">Bank-level security with full compliance</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black text-lg font-bold py-4 px-8 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">Get Started Today</span>
              </button>
              <button className="group text-yellow-400 border-2 border-yellow-400/50 hover:border-yellow-400 text-lg font-semibold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">Learn More</span>
              </button>
            </div>
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* Demo Credentials Card */}
            <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              <div className="relative z-10">
                <h3 className="text-yellow-400 font-bold text-xl mb-4 flex items-center gap-3">
                  <span className="text-2xl">🔑</span>
                  Demo Credentials
                </h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-yellow-400/10 to-amber-500/10 p-4 rounded-xl border border-yellow-400/20">
                    <p className="text-gray-300 text-sm mb-2">
                      <span className="text-yellow-400 font-semibold">Administrator Access:</span>
                    </p>
                    <p className="text-white font-mono text-sm">
                      Email: admin@cegs.com<br/>
                      Password: admin123
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-gray-700/20 to-gray-800/20 p-4 rounded-xl border border-gray-600/20">
                    <p className="text-gray-400 text-sm">
                      Employee credentials are distributed by system administrators through the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Stats */}
            <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              <div className="relative z-10">
                <h3 className="text-yellow-400 font-bold text-xl mb-4 flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  Platform Insights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-gray-400 text-sm">Active Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">50K+</div>
                    <div className="text-gray-400 text-sm">Employees Managed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-gray-400 text-sm">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-gray-400 text-sm">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-yellow-400/20 bg-gradient-to-r from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © 2025 CEGS - Career Expert Global solutions
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">
              Transforming businesses through intelligent workforce management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}