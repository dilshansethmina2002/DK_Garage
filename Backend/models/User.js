import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Will store the bcrypt hash
  role: { 
    type: String, 
    enum: ['Admin', 'ServiceAdvisor', 'Mechanic'], 
    default: 'Mechanic' 
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);