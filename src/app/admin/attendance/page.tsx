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
  
  // Filter inputs (not applied until search is clicked)
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  
  // Applied filters (used for actual filtering)
  const [appliedEmployee, setAppliedEmployee] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [editForm, setEditForm] = useState({
    loginTime: '',
    logoutTime: '',
    markAsAbsent: false
  });

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPosition, setAddModalPosition] = useState({ top: 0, left: 0 });
  const [addForm, setAddForm] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    loginTime: '',
    logoutTime: '',
    location: 'Office'
  });

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
  }, [attendance, appliedEmployee, appliedDateFrom, appliedDateTo]);

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

    // Filter by employee name
    if (appliedEmployee) {
      filtered = filtered.filter(record => 
        record.employeeName.toLowerCase().includes(appliedEmployee.toLowerCase())
      );
    }

    // Filter by date range
    if (appliedDateFrom && appliedDateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const fromDate = new Date(appliedDateFrom);
        const toDate = new Date(appliedDateTo);
        return recordDate >= fromDate && recordDate <= toDate;
      });
    } else if (appliedDateFrom) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const fromDate = new Date(appliedDateFrom);
        return recordDate >= fromDate;
      });
    } else if (appliedDateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const toDate = new Date(appliedDateTo);
        return recordDate <= toDate;
      });
    }

    setFilteredAttendance(filtered);
  };

  const handleSearch = () => {
    setAppliedEmployee(searchEmployee);
    setAppliedDateFrom(searchDateFrom);
    setAppliedDateTo(searchDateTo);
  };

  const handleClearFilters = () => {
    setSearchEmployee('');
    setSearchDateFrom('');
    setSearchDateTo('');
    setAppliedEmployee('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
  };

  const openEditModal = (record: AttendanceRecord, event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const modalWidth = 384;
    
    const top = rect.top + window.scrollY + (rect.height / 2);
    const left = rect.left + window.scrollX - modalWidth / 2 + (rect.width / 2);
    
    setModalPosition({ top, left });
    
    setEditingRecord(record);
    setEditForm({
      loginTime: record.loginTime || '',
      logoutTime: record.logoutTime || '',
      markAsAbsent: false
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
    setEditForm({
      loginTime: '',
      logoutTime: '',
      markAsAbsent: false
    });
  };

  const openAddModal = () => {
    setAddForm({
      employeeId: '',
      employeeName: '',
      date: new Date().toISOString().split('T')[0],
      loginTime: '',
      logoutTime: '',
      location: 'Office'
    });
    setIsAddModalOpen(true);
  };

  const openAddModalAtPosition = (event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const modalWidth = 672;
    
    const top = rect.top + window.scrollY + (rect.height / 2);
    const left = rect.left + window.scrollX - modalWidth / 2 + (rect.width / 2);
    
    setAddModalPosition({ top, left });
    openAddModal();
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm({
      employeeId: '',
      employeeName: '',
      date: new Date().toISOString().split('T')[0],
      loginTime: '',
      logoutTime: '',
      location: 'Office'
    });
  };

  const calculateTotalHours = (login: string, logout: string): number => {
    if (!login || !logout) return 0;
    const [loginHour, loginMin] = login.split(':').map(Number);
    const [logoutHour, logoutMin] = logout.split(':').map(Number);
    const loginMinutes = loginHour * 60 + loginMin;
    const logoutMinutes = logoutHour * 60 + logoutMin;
    return parseFloat(((logoutMinutes - loginMinutes) / 60).toFixed(2));
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const token = auth.getToken();

      if (editForm.markAsAbsent) {
        const response = await fetch(`/api/attendance/${editingRecord.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAttendance(prev => prev.filter(record => record.id !== editingRecord.id));
          closeEditModal();
          setError('');
        } else {
          setError(data.message || 'Failed to delete attendance record');
        }
      } else {
        const totalHours = calculateTotalHours(editForm.loginTime, editForm.logoutTime);

        const response = await fetch(`/api/attendance/${editingRecord.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            loginTime: editForm.loginTime,
            logoutTime: editForm.logoutTime,
            totalHours
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAttendance(prev => prev.map(record => 
            record.id === editingRecord.id 
              ? { ...record, loginTime: editForm.loginTime, logoutTime: editForm.logoutTime, totalHours }
              : record
          ));
          closeEditModal();
          setError('');
        } else {
          setError(data.message || 'Failed to update attendance record');
        }
      }
    } catch (err) {
      setError('Failed to process attendance record');
      console.error(err);
    }
  };

  const handleAddAttendance = async () => {
    if (!addForm.employeeName || !addForm.date || !addForm.loginTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const token = auth.getToken();
      const totalHours = addForm.logoutTime 
        ? calculateTotalHours(addForm.loginTime, addForm.logoutTime) 
        : 0;

      const [hour, minute] = addForm.loginTime.split(':').map(Number);
      const isLate = hour > 10 || (hour === 10 && minute > 0);

      const response = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: addForm.employeeId || `MAN${Date.now()}`,
          employeeName: addForm.employeeName,
          date: addForm.date,
          loginTime: addForm.loginTime,
          logoutTime: addForm.logoutTime || null,
          totalHours,
          isLate,
          location: addForm.location
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadAttendance();
        closeAddModal();
        setError('');
      } else {
        setError(data.message || 'Failed to add attendance record');
      }
    } catch (err) {
      setError('Failed to add attendance record');
      console.error(err);
    }
  };

  const exportFullReport = () => {
    const csvContent = [
      ['Employee', 'Date', 'Login Time', 'Logout Time', 'Total Hours', 'Late', 'Location', 'Actually Present', 'Remarks'],
      ...filteredAttendance.map(record => [
        record.employeeName,
        record.date,
        record.loginTime,
        record.logoutTime || 'Not logged out',
        record.totalHours?.toString() || '0',
        record.isLate ? 'Yes' : 'No',
        record.location,
        (record as any).isActuallyPresent !== false ? 'Yes' : 'No',
        (record as any).remarks || ''
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
      ['Employee', 'Date', 'Login Time', 'Location', 'Actually Present'],
      ...lateRecords.map(record => [
        record.employeeName,
        record.date,
        record.loginTime,
        record.location,
        (record as any).isActuallyPresent !== false ? 'Yes' : 'No'
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
                onClick={openAddModalAtPosition}
                className="group bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-green-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  <span className="mr-2">➕</span>
                  Add Attendance
                </span>
              </button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <label className="block text-sm font-semibold text-yellow-400 mb-3">From Date</label>
                  <input
                    type="date"
                    value={searchDateFrom}
                    onChange={(e) => setSearchDateFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-yellow-400 mb-3">To Date</label>
                  <input
                    type="date"
                    value={searchDateTo}
                    onChange={(e) => setSearchDateTo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                  />
                </div>
              </div>
              
              {/* Search and Clear Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSearch}
                  className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-8 py-3 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center">
                    <span className="mr-2">🔍</span>
                    Search
                  </span>
                </button>
                <button
                  onClick={handleClearFilters}
                  className="group bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-8 py-3 rounded-xl shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center">
                    <span className="mr-2">🔄</span>
                    Clear Filters
                  </span>
                </button>
              </div>
              
              {/* Active Filters Display */}
              {(appliedEmployee || appliedDateFrom || appliedDateTo) && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-lg border border-blue-400/30">
                  <p className="text-blue-400 text-sm font-semibold mb-2">🎯 Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {appliedEmployee && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-400/30">
                        Employee: {appliedEmployee}
                      </span>
                    )}
                    {appliedDateFrom && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-400/30">
                        From: {appliedDateFrom}
                      </span>
                    )}
                    {appliedDateTo && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-400/30">
                        To: {appliedDateTo}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
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
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        👤 Employee
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📅 Date
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        🕐 Login
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        🕕 Logout
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        ⏱️ Hours
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📊 Status
                      </th>
                      <th className="hidden md:table-cell px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📍 Location
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        ✏️ Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="text-6xl mb-4">📋</div>
                          <p className="text-gray-400 text-lg">No attendance records found</p>
                          <p className="text-yellow-400/60 text-sm">Try adjusting your search filters</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((record, index) => {
                        const isActuallyPresent = (record as any).isActuallyPresent !== false;
                        return (
                          <tr 
                            key={record.id} 
                            className={`hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-amber-500/5 transition-all duration-300 ${
                              index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-900/20'
                            } ${!isActuallyPresent ? 'opacity-60' : ''}`}
                          >
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-2 md:mr-3">
                                  <span className="text-black text-xs font-bold">
                                    {record.employeeName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-white truncate max-w-[100px] md:max-w-none">
                                  {record.employeeName}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className="text-xs md:text-sm text-gray-300 font-mono bg-gray-800/50 px-1 md:px-2 py-1 rounded">
                                {record.date}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className="text-xs md:text-sm text-gray-300 font-mono bg-gray-800/50 px-1 md:px-2 py-1 rounded">
                                {record.loginTime}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className="text-xs md:text-sm text-gray-300 font-mono bg-gray-800/50 px-1 md:px-2 py-1 rounded">
                                {record.logoutTime || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className="text-xs md:text-sm font-semibold text-yellow-400">
                                {record.totalHours ? `${record.totalHours}h` : '0h'}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-bold ${
                                  record.isLate 
                                    ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-400/30' 
                                    : 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-400/30'
                                }`}>
                                  {record.isLate ? '⚠️ Late' : '✅ On Time'}
                                </span>
                                {!isActuallyPresent && (
                                  <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-400/30">
                                    🏠 Not Present
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-300 bg-gray-800/50 px-2 py-1 rounded flex items-center">
                                <span className="mr-1">📍</span>
                                {record.location}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => openEditModal(record, e)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-1 md:gap-2"
                              >
                                <span>✏️</span>
                                <span className="hidden md:inline">Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {filteredAttendance.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-orange-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/5 to-orange-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">🏠</div>
                  <h3 className="text-orange-400 font-semibold text-sm mb-1">Not Present</h3>
                  <p className="text-2xl font-bold text-white">
                    {filteredAttendance.filter(r => (r as any).isActuallyPresent === false).length}
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

        {/* Edit Modal */}
        {isEditModalOpen && editingRecord && (
          <div 
            className="fixed inset-0 z-50"
            onClick={closeEditModal}
          >
            <div 
              className="absolute bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-xl shadow-2xl border-2 border-yellow-400/50 w-[90vw] max-w-md"
              style={{
                top: `${modalPosition.top}px`,
                left: `${modalPosition.left}px`,
                transform: 'translate(-50%, -50%)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-bold text-yellow-400 flex items-center">
                    <span className="mr-2">✏️</span>
                    Edit Attendance
                  </h3>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="text-xl md:text-2xl">×</span>
                  </button>
                </div>

                <div className="bg-yellow-400/10 rounded-lg p-3 mb-4 border border-yellow-400/30">
                  <p className="text-white font-semibold text-sm md:text-base">{editingRecord.employeeName}</p>
                  <p className="text-yellow-400 text-xs">Date: {editingRecord.date}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-yellow-400 mb-1">
                      Login Time
                    </label>
                    <input
                      type="time"
                      value={editForm.loginTime}
                      onChange={(e) => setEditForm({...editForm, loginTime: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-yellow-400/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-yellow-400 mb-1">
                      Logout Time
                    </label>
                    <input
                      type="time"
                      value={editForm.logoutTime}
                      onChange={(e) => setEditForm({...editForm, logoutTime: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-yellow-400/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    />
                  </div>

                  {editForm.loginTime && editForm.logoutTime && !editForm.markAsAbsent && (
                    <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-2">
                      <p className="text-blue-400 text-xs font-semibold flex items-center">
                        <span className="mr-1">⏱️</span>
                        Total: {calculateTotalHours(editForm.loginTime, editForm.logoutTime)}h
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.markAsAbsent}
                        onChange={(e) => setEditForm({...editForm, markAsAbsent: e.target.checked})}
                        className="w-4 h-4 rounded border-red-400/30 text-red-500 focus:ring-red-400/50"
                      />
                      <span className="text-red-400 font-semibold text-sm">Mark as Absent</span>
                    </label>

                    {editForm.markAsAbsent && (
                      <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-2 mt-2">
                        <p className="text-red-400 text-xs font-semibold flex items-center">
                          <span className="mr-1">⚠️</span>
                          This will remove the attendance record permanently
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveEdit}
                    className={`flex-1 font-bold px-3 md:px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 ${
                      editForm.markAsAbsent
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                        : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black'
                    }`}
                  >
                    {editForm.markAsAbsent ? '🗑️ Remove' : '💾 Save'}
                  </button>
                  <button
                    onClick={closeEditModal}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-3 md:px-4 py-2 rounded-lg text-sm transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Attendance Modal */}
        {isAddModalOpen && (
          <div 
            className="fixed inset-0 z-50"
            onClick={closeAddModal}
          >
            <div 
              className="absolute bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl border-2 border-green-400/50 w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto"
              style={{
                top: `${addModalPosition.top}px`,
                left: `${addModalPosition.left}px`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                    ➕ Add Manual Attendance
                  </h3>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-green-400 mb-2">
                        Employee Name *
                      </label>
                      <input
                        type="text"
                        value={addForm.employeeName}
                        onChange={(e) => setAddForm({...addForm, employeeName: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800/50 border border-green-400/30 rounded-lg md:rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                        placeholder="Enter employee name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-green-400 mb-2">
                        Employee ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={addForm.employeeId}
                        onChange={(e) => setAddForm({...addForm, employeeId: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800/50 border border-green-400/30 rounded-lg md:rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-green-400 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={addForm.date}
                      onChange={(e) => setAddForm({...addForm, date: e.target.value})}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800/50 border border-green-400/30 rounded-lg md:rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-green-400 mb-2">
                        Login Time *
                      </label>
                      <input
                        type="time"
                        value={addForm.loginTime}
                        onChange={(e) => setAddForm({...addForm, loginTime: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800/50 border border-green-400/30 rounded-lg md:rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-green-400 mb-2">
                        Logout Time (Optional)
                      </label>
                      <input
                        type="time"
                        value={addForm.logoutTime}
                        onChange={(e) => setAddForm({...addForm, logoutTime: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800/50 border border-green-400/30 rounded-lg md:rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-green-400 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={addForm.location}
                      onChange={(e) => setAddForm({...addForm, location: e.target.value})}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800/50 border border-green-400/30 rounded-lg md:rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      placeholder="Office, Remote, etc."
                    />
                  </div>

                  {addForm.loginTime && addForm.logoutTime && (
                    <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg md:rounded-xl p-3 md:p-4">
                      <p className="text-blue-400 text-xs md:text-sm font-semibold flex items-center">
                        <span className="mr-2">⏱️</span>
                        Calculated Total Hours: {calculateTotalHours(addForm.loginTime, addForm.logoutTime)}h
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
                  <button
                    onClick={handleAddAttendance}
                    className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600 text-white font-bold px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                  >
                    ➕ Add Attendance
                  </button>
                  <button
                    onClick={closeAddModal}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}