// src/models/LeaveRequest.ts
import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave']
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  appliedDate: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ appliedDate: -1 });

// Delete cached model before defining
delete mongoose.models.LeaveRequest;

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;