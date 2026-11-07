import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 }
});

const quotationSchema = new mongoose.Schema({
  quotationNo: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  
  // Customer & Vehicle Info
  customerName: { type: String, required: true },
  contactNumber: { type: String, default: '' },
  insuranceCompany: { type: String, default: '' },
  vehicleNo: { type: String, required: true },
  make: { type: String, default: '' },
  model: { type: String, default: '' },
  chassisNo: { type: String, default: '' },

  // The 4 Main Quotation Parts
  removeAndRefix: [itemSchema],
  realigning: [itemSchema],
  repainting: [itemSchema],
  spareParts: [itemSchema],

  // Section Totals
  totalRemoveAndRefix: { type: Number, default: 0 },
  totalRealigning: { type: Number, default: 0 },
  totalRepainting: { type: Number, default: 0 },
  totalSpareParts: { type: Number, default: 0 },

  // Grand Total
  grandTotal: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Auto-calculate totals before saving (Synchronous Hook - No `next` parameter)
quotationSchema.pre('save', function () {
  const calcTotal = (arr) => (arr || []).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

  this.totalRemoveAndRefix = calcTotal(this.removeAndRefix);
  this.totalRealigning = calcTotal(this.realigning);
  this.totalRepainting = calcTotal(this.repainting);
  this.totalSpareParts = calcTotal(this.spareParts);

  this.grandTotal = 
    this.totalRemoveAndRefix + 
    this.totalRealigning + 
    this.totalRepainting + 
    this.totalSpareParts;
});

export default mongoose.model('Quotation', quotationSchema);