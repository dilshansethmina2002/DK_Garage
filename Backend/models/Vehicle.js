import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  licensePlate: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    maxlength: 20,
    index: true
  },
  make: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 50 
  },
  model: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 50 
  },
  year: { 
    type: Number, 
    min: 1950, 
    max: new Date().getFullYear() + 1 
  },
  fuelType: { 
    type: String, 
    enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric'], 
    default: 'Petrol' 
  },
  mileage: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);