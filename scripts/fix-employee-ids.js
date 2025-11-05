// scripts/fix-employee-ids.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function fixEmployeeIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const employees = await db.collection('employees').find({ 
      $or: [
        { id: null },
        { id: { $exists: false } },
        { employeeId: null },
        { employeeId: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${employees.length} employees with null/missing IDs`);

    for (const employee of employees) {
      const newId = employee.employeeId || employee.id || `EMP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      await db.collection('employees').updateOne(
        { _id: employee._id },
        { 
          $set: { 
            id: newId,
            employeeId: newId
          } 
        }
      );
      
      console.log(`Updated employee ${employee.name} with ID: ${newId}`);
    }

    console.log('✅ All employees updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmployeeIds();