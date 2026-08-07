import mongoose from 'mongoose';

const jobCardSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  mechanic: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending Inspection', 'In Progress', 'Awaiting Parts', 'Ready for Pickup', 'Completed'], 
    default: 'Pending Inspection' 
  },
  estimatedCost: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('JobCard', jobCardSchema);