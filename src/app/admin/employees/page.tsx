// src/app/admin/employees/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import { Employee } from '@/types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // FIXED: Added phone field to formData
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',  // Added missing phone field
    department: '',
    position: '',
    salary: '',
    joinDate: ''
  });

  useEffect(() => {
    const verifyAndLoadData = async () => {
      const isValidAdmin = await auth.requireAdminSession();
      
      if (!isValidAdmin) {
        router.push('/login?type=admin');
        return;
      }

      await loadEmployees();
    };

    verifyAndLoadData();
  }, [router]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const token = auth.getToken();
      
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data);
      } else {
        setError('Failed to load employees');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = auth.getToken();
      const generatedId = editingEmployee?.employeeId || editingEmployee?.id || `EMP${Date.now()}`;
      
      console.log('Submitting with ID:', generatedId);
      
      const employeeData = {
        id: generatedId,
        employeeId: generatedId,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        phone: formData.phone,  // Added phone field
        department: formData.department,
        position: formData.position,
        salary: parseFloat(formData.salary),
        joinDate: formData.joinDate  // FIXED: Changed from joiningDate to joinDate
      };

      const url = editingEmployee 
        ? `/api/employees/${generatedId}`
        : '/api/employees';
      
      const method = editingEmployee ? 'PUT' : 'POST';

      console.log('Request URL:', url);
      console.log('Request method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        await loadEmployees();
      } else {
        setError(data.message || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      setError('Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: Added phone field to resetForm
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      phone: '',  // Added missing phone field
      department: '',
      position: '',
      salary: '',
      joinDate: ''
    });
    setShowForm(false);
    setEditingEmployee(null);
    setError('');
  };

  // FIXED: Changed joiningDate to joinDate
  const handleEdit = (employee: Employee) => {
    console.log('Editing employee:', employee);
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      username: employee.username,
      password: '',
      phone: employee.phone || '',  // Added phone field with fallback
      department: employee.department,
      position: employee.position,
      salary: employee.salary.toString(),
      joinDate: employee.joiningDate  // FIXED: Changed from joiningDate to joinDate
    });
    setShowForm(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    const empId = employee.employeeId || employee.id;
    console.log('Deleting employee with ID:', empId);

    if (!empId) {
      alert('Employee ID not found');
      return;
    }

    try {
      const token = auth.getToken();
      const response = await fetch(`/api/employees/${empId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadEmployees();
      } else {
        alert('Failed to delete employee: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const exportToPDF = () => {
    const csvContent = [
      ['Name', 'Email', 'Username', 'Phone', 'Department', 'Position', 'Salary', 'Join Date'],
      ...employees.map(emp => [
        emp.name, emp.email, emp.username, emp.phone || 'N/A', emp.department, 
        emp.position, emp.salary.toString(), emp.joiningDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 text-lg font-semibold">Loading Employees...</p>
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
                    <span className="text-black text-xl font-bold">👤</span>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/50 to-amber-500/50 rounded-full blur-lg opacity-60 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 tracking-tight">
                    Employee Management
                  </h2>
                  <p className="text-gray-300 text-sm">Manage your workforce and organizational structure</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportToPDF}
                disabled={employees.length === 0}
                className="group bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold px-6 py-3 rounded-xl shadow-xl border-2 border-green-400/30 hover:border-green-400/60 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  <span className="mr-2">📄</span>
                  Export CSV
                </span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  <span className="mr-2">➕</span>
                  Add Employee
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

          {/* Employee Form */}
          {showForm && (
            <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-yellow-400 flex items-center">
                    <span className="mr-3">{editingEmployee ? '✏️' : '👤+'}</span>
                    {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                  </h3>
                  <button
                    onClick={resetForm}
                    disabled={submitting}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <span className="text-2xl">✕</span>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">👤 Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="Enter full name"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">📧 Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="employee@company.com"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">🆔 Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="Enter username"
                      required
                      disabled={submitting || editingEmployee !== null}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">
                      🔒 Password {editingEmployee && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="Enter secure password"
                      required={!editingEmployee}
                      disabled={submitting}
                    />
                  </div>
                  
                  {/* FIXED: Added phone field to the form */}
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">📱 Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="+91 98765 43210"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">🏢 Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="e.g., Engineering, Sales"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">💼 Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="e.g., Senior Developer"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">💰 Annual Salary</label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="₹ 500000"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-3">📅 Join Date</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex gap-4 justify-end mt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="group bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50"
                    >
                      <span className="flex items-center">
                        <span className="mr-2">✕</span>
                        Cancel
                      </span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 relative overflow-hidden disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center">
                        <span className="mr-2">{submitting ? '⏳' : editingEmployee ? '✓' : '➕'}</span>
                        {submitting ? 'Saving...' : editingEmployee ? 'Update' : 'Add'} Employee
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Employee List */}
          <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 via-amber-500/5 to-yellow-400/5 blur-xl opacity-60" />
            <div className="relative z-10">
              <div className="p-6 border-b border-yellow-400/20">
                <h3 className="text-xl font-semibold text-yellow-400 flex items-center">
                  <span className="mr-2">👥</span>
                  Employee Directory ({employees.length} total)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 border-b border-yellow-400/30">
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        👤 Employee
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        📧 Contact
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        🏢 Department
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        💼 Position
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        💰 Salary
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                        ⚙️ Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-6xl mb-4">👥</div>
                          <p className="text-gray-400 text-lg">No employees found</p>
                          <p className="text-yellow-400/60 text-sm">Add your first employee to get started</p>
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee, index) => (
                        <tr 
                          key={employee.id} 
                          className={`hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-amber-500/5 transition-all duration-300 ${
                            index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-900/20'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                                <span className="text-black text-sm font-bold">
                                  {employee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-white">{employee.name}</div>
                                <div className="text-xs text-gray-400">ID: {employee.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{employee.email}</div>
                            <div className="text-xs text-yellow-400">📱 {employee.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-400/30">
                              {employee.department}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-300 bg-gray-800/50 px-2 py-1 rounded">
                              {employee.position}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-yellow-400">
                              ₹{employee.salary.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">per annum</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(employee)}
                                className="group bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 transform hover:scale-105"
                              >
                                <span className="flex items-center text-xs">
                                  <span className="mr-1">✏️</span>
                                  Edit
                                </span>
                              </button>
                              <button
                                onClick={() => handleDelete(employee)}
                                className="group bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg border border-red-400/30 hover:border-red-400/60 transition-all duration-300 transform hover:scale-105"
                              >
                                <span className="flex items-center text-xs">
                                  <span className="mr-1">🗑️</span>
                                  Delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Employee Statistics */}
          {employees.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="text-yellow-400 font-semibold text-sm mb-1">Total Employees</h3>
                  <p className="text-2xl font-bold text-white">{employees.length}</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-green-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/5 to-green-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="text-green-400 font-semibold text-sm mb-1">Avg Salary</h3>
                  <p className="text-xl font-bold text-white">
                    ₹{Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-blue-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/5 to-blue-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">🏢</div>
                  <h3 className="text-blue-400 font-semibold text-sm mb-1">Departments</h3>
                  <p className="text-2xl font-bold text-white">
                    {new Set(employees.map(e => e.department)).size}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-purple-400/20 relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/5 to-purple-500/5 blur-xl opacity-60" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2">💼</div>
                  <h3 className="text-purple-400 font-semibold text-sm mb-1">Positions</h3>
                  <p className="text-2xl font-bold text-white">
                    {new Set(employees.map(e => e.position)).size}
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
              Employee Management System - Human Resources Portal
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}