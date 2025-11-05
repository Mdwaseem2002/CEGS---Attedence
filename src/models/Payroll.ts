// src/models/Payroll.ts
import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  workingDays: {
    type: Number,
    required: true,
    min: 0,
    max: 31
  },
  paidLeaves: {
    type: Number,
    default: 0,
    min: 0
  },
  unpaidLeaves: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  finalSalary: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries by employee and period
payrollSchema.index({ employeeId: 1, year: -1, month: -1 });
payrollSchema.index({ year: -1, month: -1 });

// Delete cached model before defining
delete mongoose.models.Payroll;

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;