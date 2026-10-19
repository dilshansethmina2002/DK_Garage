import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    index: true 
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Mechanic'], 
    default: 'Mechanic',
    required: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);