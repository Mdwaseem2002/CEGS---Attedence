// src/models/Employee.ts
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true,  // Make it required
    unique: true     // Ensure uniqueness
  },
  employeeId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  department: { 
    type: String, 
    required: true 
  },
  position: { 
    type: String, 
    required: true 
  },
  salary: { 
    type: Number, 
    required: true 
  },
  joiningDate: { 
    type: String, 
    required: true 
  },
  joinDate: String, // Keep for backward compatibility
  phone: String
}, {
  timestamps: true
});

// Ensure indexes are created
employeeSchema.index({ id: 1 }, { unique: true });
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ username: 1 }, { unique: true });
employeeSchema.index({ email: 1 }, { unique: true });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

export default Employee;