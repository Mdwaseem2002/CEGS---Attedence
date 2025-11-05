// src/models/Attendance.ts
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: String,
    required: true,
    index: true
  },
  loginTime: {
    type: String,
    required: true
  },
  logoutTime: {
    type: String,
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  isLate: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: 'Office'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ employeeId: 1, date: -1 });

// Delete cached model before defining
delete mongoose.models.Attendance;

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;