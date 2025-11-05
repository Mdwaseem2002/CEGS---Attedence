//src/app/employee/leave/page.tsx
'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeLayout from '@/components/EmployeeLayout';

interface LeaveRequest {
  _id?: string;
  id?: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  isPaid: boolean;
  appliedDate: string;
}

export default function EmployeeLeavePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      setEmployee(user);
      
      await loadLeaveRequests(token);
    } catch (error) {
      console.error('Error initializing page:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveRequests = async (token: string) => {
    try {
      const response = await fetch('/api/leave-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.status === 401) {
        console.error('Session expired');
        return;
      }
      
      if (data.success) {
        console.log('Fetched leave requests:', data.data);
        setLeaveRequests(data.data);
      } else {
        console.error('Failed to load leave requests:', data.message);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) {
      alert('Employee information not loaded');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate > endDate) {
      alert('End date must be after start date');
      return;
    }

    // Check for overlapping leave requests
    const hasOverlap = leaveRequests.some(leave => {
      if (leave.status === 'rejected') return false;
      
      const existingStart = new Date(leave.startDate);
      const existingEnd = new Date(leave.endDate);
      
      return (startDate <= existingEnd && endDate >= existingStart);
    });

    if (hasOverlap) {
      alert('You already have a leave request for overlapping dates');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please login again.');
        return;
      }

      const leaveRequest = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      };

      console.log('Submitting leave request:', leaveRequest);

      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(leaveRequest),
      });

      const data = await response.json();
      
      if (response.status === 401) {
        alert('Session expired. Please login again.');
        return;
      }
      
      if (data.success) {
        console.log('Leave request created:', data.data);
        alert('Leave request submitted successfully!');
        resetForm();
        await loadLeaveRequests(token);
      } else {
        alert(data.message || 'Failed to submit leave request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Error submitting leave request. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setShowForm(false);
  };

  const calculateLeaveDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getLeaveBalance = () => {
    const currentYear = new Date().getFullYear();
    const approvedLeaves = leaveRequests.filter(leave => 
      leave.status === 'approved' && 
      new Date(leave.startDate).getFullYear() === currentYear
    );

    const totalLeaveDays = approvedLeaves.reduce((sum, leave) => {
      return sum + calculateLeaveDays(leave.startDate, leave.endDate);
    }, 0);

    const totalAllowedLeaves = 24;
    return totalAllowedLeaves - totalLeaveDays;
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'pending');
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved');
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected');

  if (loading) {
    return (
      <ProtectedRoute>
        <EmployeeLayout>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-yellow-400 text-lg font-semibold">Loading Leave Management...</p>
            </div>
          </div>
        </EmployeeLayout>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute>
        <EmployeeLayout>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center bg-red-900/20 backdrop-blur-lg p-8 rounded-2xl border border-red-500/30">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-300 mb-4">Failed to Load Employee Information</h2>
              <p className="text-red-200 mb-6">Please try refreshing the page.</p>
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
                Leave Management System
              </h2>
              <button
                onClick={() => setShowForm(true)}
                className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  ➕ Request New Leave
                </span>
              </button>
            </div>

            {/* Leave Balance Card */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative p-8">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  Leave Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-2xl border border-blue-400/20">
                    <div className="text-3xl font-extrabold text-blue-400 mb-2">{getLeaveBalance()}</div>
                    <div className="text-blue-300/80 font-semibold">Remaining Leaves</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-600/10 to-green-700/10 rounded-2xl border border-green-400/20">
                    <div className="text-3xl font-extrabold text-green-400 mb-2">{approvedRequests.length}</div>
                    <div className="text-green-300/80 font-semibold">Approved Requests</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-600/10 to-yellow-700/10 rounded-2xl border border-yellow-400/20">
                    <div className="text-3xl font-extrabold text-yellow-400 mb-2">{pendingRequests.length}</div>
                    <div className="text-yellow-300/80 font-semibold">Pending Requests</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-600/10 to-red-700/10 rounded-2xl border border-red-400/20">
                    <div className="text-3xl font-extrabold text-red-400 mb-2">{rejectedRequests.length}</div>
                    <div className="text-red-300/80 font-semibold">Rejected Requests</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Request Form */}
            {showForm && (
              <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
                
                <div className="relative z-10">
                  <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-3">
                      <span className="text-2xl">📝</span>
                      New Leave Request
                    </h3>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-yellow-400 mb-3">
                            Leave Type *
                          </label>
                          <select
                            value={formData.leaveType}
                            onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                            required
                          >
                            <option value="" className="bg-gray-800">Select Leave Type</option>
                            <option value="Sick Leave" className="bg-gray-800">Sick Leave</option>
                            <option value="Casual Leave" className="bg-gray-800">Casual Leave</option>
                            <option value="Earned Leave" className="bg-gray-800">Earned Leave</option>
                            <option value="Maternity Leave" className="bg-gray-800">Maternity Leave</option>
                            <option value="Paternity Leave" className="bg-gray-800">Paternity Leave</option>
                            <option value="Emergency Leave" className="bg-gray-800">Emergency Leave</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-yellow-400 mb-3">
                            Duration
                          </label>
                          <div className="p-3 bg-gray-800/30 rounded-xl border border-yellow-400/10 text-white font-semibold">
                            {formData.startDate && formData.endDate 
                              ? `${calculateLeaveDays(formData.startDate, formData.endDate)} day(s)`
                              : 'Select dates to see duration'
                            }
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-yellow-400 mb-3">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-yellow-400 mb-3">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-yellow-400 mb-3">
                          Reason *
                        </label>
                        <textarea
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                          rows={4}
                          placeholder="Please provide a detailed reason for your leave request..."
                          className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
                          required
                        />
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="relative z-10">✅ Submit Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="group bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-gray-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="relative z-10">❌ Cancel</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Requests Tabs */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 overflow-hidden relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 blur-xl opacity-60" />
              
              <div className="relative z-10">
                {/* Tabs Navigation */}
                <div className="px-6 py-5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-400/20">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`py-2 px-4 font-bold text-sm rounded-lg transition-all duration-300 ${
                        activeTab === 'pending'
                          ? 'bg-yellow-600 text-white shadow-lg'
                          : 'text-yellow-400 hover:text-yellow-300'
                      }`}
                    >
                      ⏳ Pending ({pendingRequests.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('approved')}
                      className={`py-2 px-4 font-bold text-sm rounded-lg transition-all duration-300 ${
                        activeTab === 'approved'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'text-green-400 hover:text-green-300'
                      }`}
                    >
                      ✅ Approved ({approvedRequests.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('rejected')}
                      className={`py-2 px-4 font-bold text-sm rounded-lg transition-all duration-300 ${
                        activeTab === 'rejected'
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'text-red-400 hover:text-red-300'
                      }`}
                    >
                      ❌ Rejected ({rejectedRequests.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'pending' && (
                    <div>
                      <h4 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                        <span className="text-2xl">⏳</span>
                        Pending Requests
                      </h4>
                      {pendingRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">⏳</div>
                          <div className="text-xl font-bold text-gray-400 mb-2">No pending requests</div>
                          <div className="text-gray-500">All caught up! No pending leave requests.</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingRequests.map((request) => (
                            <div key={request._id || request.id} className="p-6 bg-gray-800/30 rounded-2xl border border-yellow-400/20 hover:bg-yellow-400/5 transition-colors duration-200">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h5 className="font-bold text-white text-lg mb-2">{request.leaveType}</h5>
                                  <p className="text-gray-300 mb-2">
                                    📅 {request.startDate} to {request.endDate} 
                                    <span className="ml-2 px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm font-semibold">
                                      ({calculateLeaveDays(request.startDate, request.endDate)} days)
                                    </span>
                                  </p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg">
                                  ⏳ PENDING
                                </span>
                              </div>
                              <p className="text-gray-300 mb-3">
                                <strong className="text-yellow-400">Reason:</strong> {request.reason}
                              </p>
                              <p className="text-xs text-gray-500">
                                Applied on: {new Date(request.appliedDate || '').toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'approved' && (
                    <div>
                      <h4 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        Approved Requests
                      </h4>
                      {approvedRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">✅</div>
                          <div className="text-xl font-bold text-gray-400 mb-2">No approved requests</div>
                          <div className="text-gray-500">No approved leave requests yet.</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {approvedRequests.map((request) => (
                            <div key={request._id || request.id} className="p-6 bg-gray-800/30 rounded-2xl border border-green-400/20 hover:bg-green-400/5 transition-colors duration-200">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h5 className="font-bold text-white text-lg mb-2">{request.leaveType}</h5>
                                  <p className="text-gray-300 mb-2">
                                    📅 {request.startDate} to {request.endDate} 
                                    <span className="ml-2 px-2 py-1 bg-green-600/20 text-green-400 rounded-lg text-sm font-semibold">
                                      ({calculateLeaveDays(request.startDate, request.endDate)} days)
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg mb-2">
                                    ✅ APPROVED
                                  </span>
                                  <div className="text-xs font-semibold">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg ${
                                      request.isPaid 
                                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' 
                                        : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                                    }`}>
                                      {request.isPaid ? '💰 Paid Leave' : '📋 Unpaid Leave'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-300 mb-3">
                                <strong className="text-green-400">Reason:</strong> {request.reason}
                              </p>
                              <p className="text-xs text-gray-500">
                                Applied on: {new Date(request.appliedDate || '').toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'rejected' && (
                    <div>
                      <h4 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                        <span className="text-2xl">❌</span>
                        Rejected Requests
                      </h4>
                      {rejectedRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">❌</div>
                          <div className="text-xl font-bold text-gray-400 mb-2">No rejected requests</div>
                          <div className="text-gray-500">Great! No rejected leave requests.</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {rejectedRequests.map((request) => (
                            <div key={request._id || request.id} className="p-6 bg-gray-800/30 rounded-2xl border border-red-400/20 hover:bg-red-400/5 transition-colors duration-200">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h5 className="font-bold text-white text-lg mb-2">{request.leaveType}</h5>
                                  <p className="text-gray-300 mb-2">
                                    📅 {request.startDate} to {request.endDate} 
                                    <span className="ml-2 px-2 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-semibold">
                                      ({calculateLeaveDays(request.startDate, request.endDate)} days)
                                    </span>
                                  </p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                                  ❌ REJECTED
                                </span>
                              </div>
                              <p className="text-gray-300 mb-3">
                                <strong className="text-red-400">Reason:</strong> {request.reason}
                              </p>
                              <p className="text-xs text-gray-500">
                                Applied on: {new Date(request.appliedDate || '').toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Leave Policy Information */}
            <div className="bg-gradient-to-br from-gray-900/95 via-black/98 to-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/20 overflow-hidden relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 to-blue-600/10 blur-xl opacity-60" />
              
              <div className="relative z-10">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-400/10 to-blue-600/10 border-b border-blue-400/20">
                  <h3 className="text-xl font-bold text-blue-400 flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    Leave Policy Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-blue-400 mb-4 text-lg">Annual Leave Entitlement:</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-xl">
                          <span className="text-gray-300">Total Annual Leaves:</span>
                          <span className="font-bold text-blue-400">24 days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-xl">
                          <span className="text-gray-300">Sick Leaves:</span>
                          <span className="font-bold text-green-400">12 days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-xl">
                          <span className="text-gray-300">Casual Leaves:</span>
                          <span className="font-bold text-yellow-400">12 days</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-400 mb-4 text-lg">Important Guidelines:</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-800/30 rounded-xl border-l-4 border-blue-400">
                          <span className="text-gray-300">• Apply for leave at least 2 days in advance</span>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl border-l-4 border-green-400">
                          <span className="text-gray-300">• Emergency leaves can be applied same day</span>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl border-l-4 border-yellow-400">
                          <span className="text-gray-300">• Medical certificate required for sick leave &gt; 3 days</span>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl border-l-4 border-purple-400">
                          <span className="text-gray-300">• Unused leaves don&apos;t carry forward to next year</span>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl border-l-4 border-red-400">
                          <span className="text-gray-300">• Leave approval depends on work requirements</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    </ProtectedRoute>
  );
}