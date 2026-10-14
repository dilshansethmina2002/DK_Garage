import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Service', 'Part'], 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200 
  },
  rate: { 
    type: Number, 
    required: true, 
    min: 0 
  }
}, { _id: false });

const jobCardSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  mechanic: { type: String, required: true, trim: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Pending Inspection', 'In Progress', 'Awaiting Parts', 'Ready for Pickup', 'Completed'],
    default: 'Pending Inspection'
  },
  jobDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  laborHours: { type: Number, default: 0, min: 0 },
  lineItems: [lineItemSchema],
  applyGST: { type: Boolean, default: false },
  subtotal: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export default mongoose.model('JobCard', jobCardSchema);