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

const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

export default EmployeeModel;