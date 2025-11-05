// src/models/Leave.ts
import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
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
    enum: ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave']
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
    required: true,
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

// Create indexes for better query performance
leaveSchema.index({ employeeId: 1, appliedDate: -1 });
leaveSchema.index({ status: 1 });

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);

export default Leave;