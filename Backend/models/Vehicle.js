import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);