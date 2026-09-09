import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  position: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  doj: {
    type: Date,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes for fields that are frequently queried or sorted
EmployeeSchema.index({ createdAt: -1, _id: -1 });

const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

export default EmployeeModel;