import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Car, Wrench, Plus, Trash2, Camera, FileText, CheckCircle, AlertCircle
} from 'lucide-react';

const JobCardWorkspace = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [customer, setCustomer] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending Inspection');
  const [notes, setNotes] = useState('');
  const [applyGST, setApplyGST] = useState(false);

  // Dynamic Line Items State
  const [items, setItems] = useState([
    { id: 1, type: 'Service', name: '', rate: 0 }
  ]);

  // Derived Financial Calculations
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.rate) || 0), 0);
    const tax = applyGST ? subtotal * 0.18 : 0; // 18% GST Example
    const total = subtotal + tax;
    
    return {
      subtotal,
      tax,
      total,
      serviceCount: items.filter(i => i.type === 'Service').length,
      partCount: items.filter(i => i.type === 'Part').length
    };
  }, [items, applyGST]);

  const handleAddItem = () => {
    const newItem = { id: Date.now(), type: 'Service', name: '', rate: 0 };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Prepare secure payload
    const payload = {
      customerName: customer,
      vehicleDetails: vehicle,
      mechanic,
      priority,
      status,
      jobDate,
      deliveryDate,
      notes,
      lineItems: items,
      financials: calculations // Backend must verify these numbers!
    };

    try {
      // Future API connection
      // await axios.post('http://localhost:5000/api/jobs/workspace', payload);
      alert('Job Card created securely!');
      navigate('/job-cards');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-900 flex flex-col">
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Job Card Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Create customers, register vehicles, attach media, and build job cards[cite: 2].</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Sidebar Panel */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-indigo-500" /> Customer & Vehicle[cite: 3]
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Customer Name</label>
                <input type="text" required value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Select or type customer..." className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Vehicle</label>
                <input type="text" required value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Make, Model, Plate..." className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Camera className="w-4 h-4 text-indigo-500" /> Media Gallery
            </h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
              <Plus className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-medium">Attach photos or documents</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Services</span><span>{calculations.serviceCount}</span></div>
              <div className="flex justify-between text-slate-600"><span>Parts</span><span>{calculations.partCount}</span></div>
              <div className="flex justify-between font-bold text-slate-900 mt-2 pt-2 border-t border-slate-100">
                <span>Total</span><span>LKR {calculations.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Build Job Card & Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Build Job Card[cite: 3]</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Assigned Mechanic</label>
                <input type="text" required value={mechanic} onChange={e => setMechanic(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Job Date</label>
                <input type="date" value={jobDate} onChange={e => setJobDate(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Expected Delivery</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            {/* Services & Parts Array */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-500" /> Services & Parts[cite: 3]
                </h3>
                <button type="button" onClick={handleAddItem} className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-start md:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 flex-col md:flex-row">
                    <select 
                      value={item.type} 
                      onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                      className="p-2 border border-slate-200 rounded-md text-sm outline-none w-full md:w-32 bg-white"
                    >
                      <option>Service</option>
                      <option>Part</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Description..." 
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="p-2 border border-slate-200 rounded-md text-sm outline-none flex-1 w-full"
                    />
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-32">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">LKR</span>
                        <input 
                          type="number" 
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                          className="p-2 pl-10 border border-slate-200 rounded-md text-sm outline-none w-full"
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" disabled={items.length === 1}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Notes */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Diagnostic / Repair Notes</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Front bumper damaged due to impact. Bumper removed, repaired..." 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Cost Breakdown[cite: 3]
            </h2>
            
            <div className="space-y-3 w-full md:w-1/2 ml-auto text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Services ({calculations.serviceCount}):</span>
                <span>LKR {items.filter(i => i.type === 'Service').reduce((sum, i) => sum + (Number(i.rate) || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Spare Parts ({calculations.partCount}):</span>
                <span>LKR {items.filter(i => i.type === 'Part').reduce((sum, i) => sum + (Number(i.rate) || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-800 pt-2 border-t border-slate-100">
                <span>Subtotal:</span>
                <span>LKR {calculations.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                  <input type="checkbox" checked={applyGST} onChange={e => setApplyGST(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                  Apply GST (18%)
                </label>
                {applyGST && <span>LKR {calculations.tax.toFixed(2)}</span>}
              </div>

              <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 border-t-2 border-slate-200">
                <span>Final Total:</span>
                <span>LKR {calculations.total.toFixed(2)}[cite: 3]</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 w-full md:w-auto justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <CheckCircle className="w-5 h-5" />
                {isSubmitting ? 'Saving to Database...' : 'Create Job Card[cite: 3]'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default JobCardWorkspace;