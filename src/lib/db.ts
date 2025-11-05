// src/lib/db.ts
import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from '@/types';
import { auth } from './auth';

class DatabaseService {
  private getHeaders() {
    const token = auth.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await fetch('/api/employees', {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Get employees error:', error);
      return [];
    }
  }

  async addEmployee(employee: Employee): Promise<boolean> {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(employee)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Add employee error:', error);
      return false;
    }
  }

  async updateEmployee(id: string, updatedEmployee: Employee): Promise<boolean> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updatedEmployee)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Update employee error:', error);
      return false;
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Delete employee error:', error);
      return false;
    }
  }

  // Attendance methods
  async getAttendanceRecords(employeeId?: string): Promise<AttendanceRecord[]> {
    try {
      const url = employeeId 
        ? `/api/attendance?employeeId=${employeeId}`
        : '/api/attendance';
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Get attendance error:', error);
      return [];
    }
  }

  async addAttendanceRecord(record: AttendanceRecord): Promise<boolean> {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(record)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Add attendance error:', error);
      return false;
    }
  }

  async updateAttendanceRecord(id: string, updatedRecord: AttendanceRecord): Promise<boolean> {
    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updatedRecord)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Update attendance error:', error);
      return false;
    }
  }

  // Leave methods
  async getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
    try {
      const url = employeeId 
        ? `/api/leave-requests?employeeId=${employeeId}`
        : '/api/leave-requests';
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Get leave requests error:', error);
      return [];
    }
  }

  async addLeaveRequest(leave: LeaveRequest): Promise<boolean> {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(leave)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Add leave request error:', error);
      return false;
    }
  }

  async updateLeaveRequest(id: string, updatedLeave: LeaveRequest): Promise<boolean> {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updatedLeave)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Update leave request error:', error);
      return false;
    }
  }

  // Payroll methods
  async getPayrollRecords(employeeId?: string): Promise<PayrollRecord[]> {
    try {
      const url = employeeId 
        ? `/api/payroll?employeeId=${employeeId}`
        : '/api/payroll';
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Get payroll records error:', error);
      return [];
    }
  }

  async addPayrollRecord(record: PayrollRecord): Promise<boolean> {
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(record)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Add payroll record error:', error);
      return false;
    }
  }
}

export const db = new DatabaseService();