import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  User, Wrench, Plus, Trash2, Camera, FileText, CheckCircle, AlertCircle, ArrowLeft
} from 'lucide-react';

const JobCardWorkspace = () => {
  const { jobId } = useParams(); // Present if clicked "View" from JobCardsList
  const isViewOrEditMode = Boolean(jobId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isViewOrEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Customer & Vehicle State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  // Job Card Details State
  const [mechanic, setMechanic] = useState('');
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending Inspection');
  const [notes, setNotes] = useState('');
  const [applyGST, setApplyGST] = useState(false);

  // Dynamic Line Items State
  const [items, setItems] = useState([
    { id: 1, type: 'Service', name: 'Labour Service', rate: 0 }
  ]);

  // Fetch Existing Job Card if viewing a specific card
  useEffect(() => {
    if (!isViewOrEditMode) return;

    const fetchExistingJob = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/jobs/${jobId}`);
        const job = response.data;

        setCustomerName(job.customer?.name || '');
        setCustomerPhone(job.customer?.phone || '');
        setMake(job.vehicle?.make || '');
        setModel(job.vehicle?.model || '');
        setLicensePlate(job.vehicle?.licensePlate || '');
        setMechanic(job.mechanic || '');
        setPriority(job.priority || 'Medium');
        setStatus(job.status || 'Pending Inspection');
        setJobDate(job.jobDate ? new Date(job.jobDate).toISOString().split('T')[0] : '');
        setDeliveryDate(job.deliveryDate ? new Date(job.deliveryDate).toISOString().split('T')[0] : '');
        setNotes(job.notes || '');
        setApplyGST(Boolean(job.applyGST));

        if (job.lineItems && job.lineItems.length > 0) {
          setItems(job.lineItems.map((item, idx) => ({
            id: idx + 1,
            type: item.type || 'Service',
            name: item.name || '',
            rate: item.rate || 0
          })));
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError('Could not load the requested Job Card from MongoDB.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExistingJob();
  }, [jobId, isViewOrEditMode, navigate]);

  // Derived Financial Calculations
  const calculations = useMemo(() => {
    const servicesTotal = items
      .filter(i => i.type === 'Service')
      .reduce((sum, i) => sum + (Math.max(0, Number(i.rate)) || 0), 0);
    const partsTotal = items
      .filter(i => i.type === 'Part')
      .reduce((sum, i) => sum + (Math.max(0, Number(i.rate)) || 0), 0);

    const subtotal = servicesTotal + partsTotal;
    const tax = applyGST ? subtotal * 0.18 : 0;
    const total = subtotal + tax;

    return {
      servicesTotal,
      partsTotal,
      subtotal,
      tax,
      total,
      serviceCount: items.filter(i => i.type === 'Service').length,
      partCount: items.filter(i => i.type === 'Part').length
    };
  }, [items, applyGST]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), type: 'Service', name: '', rate: 0 }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
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

    const payload = {
      customerName,
      customerPhone,
      make,
      model,
      licensePlate,
      mechanic,
      priority,
      status,
      jobDate,
      deliveryDate,
      notes,
      lineItems: items.map(({ type, name, rate }) => ({
        type,
        name,
        rate: Number(rate) || 0
      })),
      applyGST
    };

    try {
      if (isViewOrEditMode) {
        await axios.put(`http://localhost:5000/api/jobs/${jobId}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/jobs', payload);
      }
      navigate('/job-cards');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Job Card to MongoDB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <Wrench className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-900 flex flex-col">

      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isViewOrEditMode ? `Job Card Workspace — ${jobId}` : 'Job Card Workspace'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create customers, register vehicles, attach media, and build job cards.
          </p>
        </div>

        <Link
          to="/job-cards"
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Cards
        </Link>
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
              <User className="w-4 h-4 text-indigo-500" /> Customer & Vehicle
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Customer Name *</label>
                <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Jatin Patel" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number *</label>
                <input type="text" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 0771234567" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Make *</label>
                  <input type="text" required value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Model *</label>
                  <input type="text" required value={model} onChange={e => setModel(e.target.value)} placeholder="Yaris" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">License Plate *</label>
                <input type="text" required value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="e.g. WP KV-1234" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
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
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>LKR {calculations.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 mt-2 pt-2 border-t border-slate-100">
                <span>Total</span><span>LKR {calculations.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="xl:col-span-3 space-y-6">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Build Job Card</h2>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase">Assigned Mechanic *</label>
              <input type="text" required value={mechanic} onChange={e => setMechanic(e.target.value)} placeholder="Assign mechanic name..." className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Services & Parts Array */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-500" /> Services & Parts
                </h3>
                <button type="button" onClick={handleAddItem} className="text-sm bg-red-600 text-white hover:bg-red-700 px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 items-end">
                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Type *</label>
                      <select
                        value={item.type}
                        onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                        className="p-2 border border-slate-200 rounded-md text-sm outline-none w-full bg-white"
                      >
                        <option value="Service">Services</option>
                        <option value="Part">Spare Part</option>
                      </select>
                    </div>
                    <div className="md:col-span-5">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Service / Part Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Labour Service or Oil Filter"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="p-2 border border-slate-200 rounded-md text-sm outline-none w-full bg-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Rate (LKR) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                        className="p-2 border border-slate-200 rounded-md text-sm outline-none w-full bg-white"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" disabled={items.length === 1}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Details */}
            <h3 className="font-bold text-slate-800 mb-3 pt-2 border-t border-slate-100">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Job Date *</label>
                <input type="date" required value={jobDate} onChange={e => setJobDate(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Expected Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="Pending Inspection">Pending Inspection</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Diagnostic Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Work Description / Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Front bumper damaged due to impact. Bumper removed, repaired/replaced, aligned, painted, and refitted."
                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Cost Breakdown
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Services ({calculations.serviceCount}):</span>
                <span>LKR {calculations.servicesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Spare Parts ({calculations.partCount}):</span>
                <span>LKR {calculations.partsTotal.toFixed(2)}</span>
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

              <div className="flex justify-between text-lg font-extrabold text-emerald-700 pt-3 border-t-2 border-slate-200">
                <span className="text-slate-900">Final Total:</span>
                <span>LKR {calculations.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 w-full justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <CheckCircle className="w-5 h-5" />
                {isSubmitting
                  ? 'Saving to MongoDB...'
                  : isViewOrEditMode
                    ? `Update Job Card (${jobId})`
                    : 'Create Job Card'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default JobCardWorkspace;