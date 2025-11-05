// scripts/seed.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

// Define schemas inline for seeding
const EmployeeSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  phone: String,
  department: String,
  position: String,
  salary: Number,
  joinDate: String,
  username: String,
  password: String,
  status: String
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    console.log('🗑️  Cleared existing employees');

    // Create sample employees
    const sampleEmployees = [
      {
        id: 'EMP001',
        name: 'John Doe',
        email: 'john.doe@hrms.com',
        phone: '+1234567890',
        department: 'Engineering',
        position: 'Software Engineer',
        salary: 75000,
        joinDate: '2024-01-15',
        username: 'john.doe',
        password: await bcrypt.hash('password123', 10),
        status: 'active'
      },
      {
        id: 'EMP002',
        name: 'Jane Smith',
        email: 'jane.smith@hrms.com',
        phone: '+1234567891',
        department: 'HR',
        position: 'HR Manager',
        salary: 65000,
        joinDate: '2024-02-01',
        username: 'jane.smith',
        password: await bcrypt.hash('password123', 10),
        status: 'active'
      },
      {
        id: 'EMP003',
        name: 'Mike Johnson',
        email: 'mike.johnson@hrms.com',
        phone: '+1234567892',
        department: 'Sales',
        position: 'Sales Executive',
        salary: 55000,
        joinDate: '2024-03-10',
        username: 'mike.johnson',
        password: await bcrypt.hash('password123', 10),
        status: 'active'
      }
    ];

    await Employee.insertMany(sampleEmployees);
    console.log('✅ Sample employees created');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@hrms.com / admin123');
    console.log('Employee: john.doe / password123');
    console.log('Employee: jane.smith / password123');
    console.log('Employee: mike.johnson / password123');

    await mongoose.connection.close();
    console.log('\n✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();