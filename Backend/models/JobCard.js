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
  costPrice: { 
    type: Number, 
    default: 0, 
    min: 0 
  }, // Internal Actual Cost (hidden from customer bills)
  rate: { 
    type: Number, 
    required: true, 
    min: 0 
  } // Customer Billed Rate (shown on invoice)
}, { _id: false });

const jobCardSchema = new mongoose.Schema({
  jobId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  // Customer reported complaints and requested fixes
  customerRequests: {
    type: String,
    default: '',
    trim: true,
    maxlength: 2500
  },
  // Multi-mechanics support: stores an array of assigned mechanics
  mechanics: {
    type: [String],
    default: [],
    set: (v) => {
      if (Array.isArray(v)) {
        return v.map(m => String(m).trim()).filter(Boolean);
      }
      if (typeof v === 'string') {
        return v.split(',').map(m => m.trim()).filter(Boolean);
      }
      return [];
    }
  },
  // Legacy string field retained for backwards-compatibility
  mechanic: { 
    type: String, 
    trim: true, 
    default: ''
  },
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
  jobDate: { 
    type: Date, 
    default: Date.now 
  },
  deliveryDate: { 
    type: Date 
  },
  notes: { 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 2000 
  },
  laborHours: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  lineItems: [lineItemSchema],
  applyGST: { 
    type: Boolean, 
    default: false 
  },
  // Financial Tracking & Profitability
  totalActualCost: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  subtotal: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  tax: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  totalCost: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  grossProfit: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Pre-save hook: keeps mechanics, customer requests, and financial figures synchronized
jobCardSchema.pre('save', function () {
  // 1. Sync mechanics array & string
  if (Array.isArray(this.mechanics) && this.mechanics.length > 0) {
    this.mechanic = this.mechanics.join(', ');
  } else if (this.mechanic && (!this.mechanics || this.mechanics.length === 0)) {
    this.mechanics = this.mechanic.split(',').map(m => m.trim()).filter(Boolean);
  }

  // 2. Sync customerRequests with notes if either was omitted
  if (this.customerRequests && !this.notes) {
    this.notes = this.customerRequests;
  } else if (this.notes && !this.customerRequests) {
    this.customerRequests = this.notes;
  }

  // 3. Recalculate totals and profit to guarantee database integrity
  if (Array.isArray(this.lineItems)) {
    let actualSum = 0;
    let rateSum = 0;

    this.lineItems.forEach(item => {
      actualSum += Math.max(0, Number(item.costPrice) || 0);
      rateSum += Math.max(0, Number(item.rate) || 0);
    });

    this.totalActualCost = Number(actualSum.toFixed(2));
    this.subtotal = Number(rateSum.toFixed(2));
    this.tax = this.applyGST ? Number((this.subtotal * 0.18).toFixed(2)) : 0;
    this.totalCost = Number((this.subtotal + this.tax).toFixed(2));
    this.grossProfit = Number((this.subtotal - this.totalActualCost).toFixed(2));
  }
});

export default mongoose.model('JobCard', jobCardSchema);