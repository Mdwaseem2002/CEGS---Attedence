// src/models/Employee.ts
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  employeeId: { 
    type: String, 
    required: [true, 'Employee ID is required'], 
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    trim: true,
    lowercase: true
  },
  username: { 
    type: String, 
    required: [true, 'Username is required'], 
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required']
  },
  department: { 
    type: String, 
    required: [true, 'Department is required'],
    trim: true
  },
  position: { 
    type: String, 
    required: [true, 'Position is required'],
    trim: true
  },
  salary: { 
    type: Number, 
    required: [true, 'Salary is required'],
    min: [0, 'Salary must be a positive number']
  },
  joiningDate: { 
    type: String, 
    required: [true, 'Joining date is required']
  },
  phone: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true,
  collection: 'employees'
});

// Create indexes for better query performance and uniqueness
employeeSchema.index({ id: 1 }, { unique: true });
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ username: 1 }, { unique: true });
employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ department: 1 });
employeeSchema.index({ position: 1 });

// Prevent model recompilation in development
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

export default Employee;