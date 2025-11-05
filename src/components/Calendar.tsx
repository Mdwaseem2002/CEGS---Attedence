// src/components/Calendar.tsx
'use client';
import { useState } from 'react';

export default function Calendar() {
  const [currentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const days = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-3"></div>);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === currentDate.getDate();
    days.push(
      <div 
        key={day} 
        className={`group p-3 text-center cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 hover:-translate-y-1 relative overflow-hidden ${
          isToday 
            ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-2xl shadow-yellow-400/50' 
            : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg'
        }`}
      >
        {!isToday && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        )}
        <span className="relative z-10 font-semibold">
          {day}
        </span>
        {isToday && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-60 rounded-xl" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
      {/* Premium Border Glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
      
      <div className="relative z-10">
        {/* Calendar Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-center flex items-center justify-center gap-3">
            <span className="text-3xl">📅</span>
            {monthNames[month]} {year}
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 font-bold text-center text-yellow-400 text-sm uppercase tracking-wider">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days}
          </div>
        </div>
        
        {/* Calendar Footer with Decorative Elements */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 border-t border-yellow-400/10">
          <div className="flex justify-center items-center gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-lg"></div>
              <span>Today</span>
            </div>
            <div className="w-px h-4 bg-yellow-400/30"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <span>Other Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}