import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  User, Wrench, Plus, Trash2, Camera, CheckCircle,
  AlertCircle, ArrowLeft, EyeOff, TrendingUp, Sparkles, Check,
  X, ChevronDown, Search
} from 'lucide-react';
import API from '../api';

const commonIssues = [
  'Regular Service & Oil Change',
  'Brake Pad Replacement / Noise',
  'AC Not Cooling',
  'Engine Check Light On',
  'Suspension Knocking',
  'Wheel Alignment & Balance'
];

const JobCardWorkspace = () => {
  const { jobId } = useParams();
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
  const [customerRequests, setCustomerRequests] = useState('');

  // Registered Mechanics State
  const [registeredMechanics, setRegisteredMechanics] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mechSearch, setMechSearch] = useState('');
  const dropdownRef = useRef(null);

  // Job Details
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending Inspection');
  const [notes, setNotes] = useState('');
  const [applyGST, setApplyGST] = useState(false);

  // Dynamic Line Items State with costPrice (actual cost) and rate (charging cost)
  const [items, setItems] = useState([
    { id: 1, type: 'Service', name: 'Labour Service', costPrice: 0, rate: 0 }
  ]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch registered mechanics from DB
  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const res = await API.get('/api/users/mechanics');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setRegisteredMechanics(res.data);
        } else {
          const fallbackRes = await API.get('/api/users');
          const filtered = (fallbackRes.data || []).filter(u => String(u.role).toLowerCase() === 'mechanic');
          setRegisteredMechanics(filtered);
        }
      } catch {
        try {
          const fallbackRes = await API.get('/api/users');
          const filtered = (fallbackRes.data || []).filter(u => String(u.role).toLowerCase() === 'mechanic');
          setRegisteredMechanics(filtered);
        } catch (fallbackErr) {
          console.warn('Could not load mechanics list:', fallbackErr);
        }
      }
    };

    fetchMechanics();
  }, []);

  // Fetch Existing Job Card if in Edit/View mode
  useEffect(() => {
    if (!isViewOrEditMode) return;

    const fetchExistingJob = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/jobs/${jobId}`);
        const job = response.data;

        setCustomerName(job.customer?.name || '');
        setCustomerPhone(job.customer?.phone || '');
        setMake(job.vehicle?.make || '');
        setModel(job.vehicle?.model || '');
        setLicensePlate(job.vehicle?.licensePlate || '');
        setCustomerRequests(job.customerRequests || job.notes || '');

        // Mechanics list handling
        if (Array.isArray(job.mechanics) && job.mechanics.length > 0) {
          setSelectedMechanics(job.mechanics);
        } else if (job.mechanic) {
          setSelectedMechanics(job.mechanic.split(',').map(m => m.trim()).filter(Boolean));
        }

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
            costPrice: item.costPrice || 0,
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

  // Derived Financial Calculations (Actual vs. Charging)
  const calculations = useMemo(() => {
    let totalActualCost = 0;
    let servicesBilled = 0;
    let partsBilled = 0;

    items.forEach(i => {
      const actual = Math.max(0, Number(i.costPrice) || 0);
      const charging = Math.max(0, Number(i.rate) || 0);

      totalActualCost += actual;
      if (i.type === 'Service') {
        servicesBilled += charging;
      } else {
        partsBilled += charging;
      }
    });

    const subtotal = servicesBilled + partsBilled;
    const tax = applyGST ? subtotal * 0.18 : 0;
    const totalBilled = subtotal + tax;
    const grossProfit = subtotal - totalActualCost;
    const marginPercent = subtotal > 0 ? ((grossProfit / subtotal) * 100).toFixed(1) : '0.0';

    return {
      totalActualCost: totalActualCost || 0,
      servicesBilled: servicesBilled || 0,
      servicesTotal: servicesBilled || 0,
      partsBilled: partsBilled || 0,
      partsTotal: partsBilled || 0,
      subtotal: subtotal || 0,
      tax: tax || 0,
      totalBilled: totalBilled || 0,
      total: totalBilled || 0,
      grossProfit: grossProfit || 0,
      marginPercent,
      serviceCount: items.filter(i => i.type === 'Service').length,
      partCount: items.filter(i => i.type === 'Part').length
    };
  }, [items, applyGST]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), type: 'Part', name: '', costPrice: 0, rate: 0 }
    ]);
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

  const toggleMechanicSelection = (mechanicName) => {
    if (selectedMechanics.includes(mechanicName)) {
      setSelectedMechanics(selectedMechanics.filter(m => m !== mechanicName));
    } else {
      setSelectedMechanics([...selectedMechanics, mechanicName]);
    }
  };

  const addQuickIssue = (issue) => {
    setCustomerRequests(prev => prev ? `${prev.trim()}\n• ${issue}` : `• ${issue}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMechanics.length === 0) {
      alert('Please assign at least one registered mechanic.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      customerName,
      customerPhone,
      make,
      model,
      licensePlate,
      customerRequests,
      mechanics: selectedMechanics,
      mechanic: selectedMechanics.join(', '),
      priority,
      status,
      jobDate,
      deliveryDate,
      notes: notes || customerRequests,
      lineItems: items.map(({ type, name, costPrice, rate }) => ({
        type,
        name,
        costPrice: Number(costPrice) || 0,
        rate: Number(rate) || 0
      })),
      applyGST
    };

    try {
      if (isViewOrEditMode) {
        await API.put(`/api/jobs/${jobId}`, payload);
      } else {
        await API.post('/api/jobs', payload);
      }
      navigate('/job-cards');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Job Card to MongoDB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRegisteredMechanics = registeredMechanics.filter(m =>
    (m.name || '').toLowerCase().includes(mechSearch.toLowerCase()) ||
    (m.username || '').toLowerCase().includes(mechSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <Wrench className="w-8 h-8 text-gray-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans text-gray-900 flex flex-col">

      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-950">
            {isViewOrEditMode ? `Job Card Workspace — ${jobId}` : 'Job Card Workspace'}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            Configure vehicle diagnostics, service charges, cost prices, and mechanic allocation.
          </p>
        </div>

        <Link
          to="/job-cards"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-xl text-xs font-bold text-gray-800 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Cards
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left Column: Customer, Vehicle, & Financial Summary */}
        <div className="xl:col-span-1 space-y-6">

          {/* Customer & Vehicle Information */}
          <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
            <h3 className="font-black text-gray-950 flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2.5 text-sm uppercase tracking-wide">
              <User className="w-4 h-4 text-gray-700" /> Customer & Vehicle
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="0771234567"
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Make *</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={e => setMake(e.target.value)}
                    placeholder="Toyota"
                    className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:border-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="Yaris"
                    className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:border-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Plate Number *</label>
                <input
                  type="text"
                  required
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value)}
                  placeholder="WP KV-2008"
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:border-slate-800 font-black uppercase"
                />
              </div>
            </div>
          </div>

          {/* Financial Summary & Gross Profit Breakdown */}
          <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm space-y-4">
            <h3 className="font-black text-gray-950 border-b-2 border-gray-100 pb-2.5 text-sm uppercase tracking-wide flex items-center justify-between">
              <span>Financial Summary</span>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase">LKR</span>
            </h3>

            {/* Customer Billed Section */}
            <div className="space-y-2 text-xs font-medium text-gray-600">
              <div className="flex justify-between">
                <span>Services ({calculations.serviceCount}):</span>
                <span className="font-bold text-gray-900">LKR {calculations.servicesBilled.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Spare Parts ({calculations.partCount}):</span>
                <span className="font-bold text-gray-900">
                  LKR {(calculations.partsBilled ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100 font-bold text-gray-900">
                <span>Subtotal (Customer):</span>
                <span>LKR {calculations.subtotal.toFixed(2)}</span>
              </div>
              {applyGST && (
                <div className="flex justify-between text-gray-700">
                  <span>GST (18%):</span>
                  <span>LKR {calculations.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-950 pt-1.5 border-t-2 border-gray-200">
                <span>Final Billed:</span>
                <span className="text-emerald-700">LKR {calculations.totalBilled.toFixed(2)}</span>
              </div>
            </div>

            {/* Internal Garage Profitability Box (Hidden from Customer) */}
            <div className="p-3.5 bg-amber-50/70 border-2 border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                  Internal Profitability
                </span>
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  Internal Only
                </span>
              </div>

              <div className="text-xs space-y-1.5 pt-1 text-amber-950">
                <div className="flex justify-between font-medium">
                  <span>Total Actual Cost:</span>
                  <span className="font-bold">LKR {calculations.totalActualCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black pt-1 border-t border-amber-200/80 text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Gross Profit:
                  </span>
                  <span className={calculations.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                    LKR {calculations.grossProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-amber-900">
                  <span>Gross Margin:</span>
                  <span>{calculations.marginPercent}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Media Attachment Placeholder */}
          <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
            <h3 className="font-black text-gray-950 flex items-center gap-2 mb-3 border-b-2 border-gray-100 pb-2 text-sm uppercase tracking-wide">
              <Camera className="w-4 h-4 text-gray-700" /> Inspection Media
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
              <Plus className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <p className="text-xs font-bold text-gray-700">Attach photos or job notes</p>
            </div>
          </div>

        </div>

        {/* Right Main Column: Mechanics, Line Items, and Billing */}
        <div className="xl:col-span-3 space-y-6">

          {/* Section 1: Assigned Mechanics & Customer Complaints */}
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm space-y-5">
            <h2 className="text-base font-black text-gray-950 border-b-2 border-gray-100 pb-3 uppercase tracking-wide">
              Mechanics & Reported Issues
            </h2>

            {/* Mechanics Tag Picker */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Assigned Registered Mechanics * (Multiple Allowed)
              </label>

              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full min-h-[46px] p-2 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:border-slate-800 transition-colors"
              >
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {selectedMechanics.map(name => (
                    <span
                      key={name}
                      onClick={e => {
                        e.stopPropagation();
                        toggleMechanicSelection(name);
                      }}
                      className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs group"
                    >
                      <Wrench className="w-3.5 h-3.5 text-gray-300" />
                      {name}
                      <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400" />
                    </span>
                  ))}
                  {selectedMechanics.length === 0 && (
                    <span className="text-gray-400 text-xs py-1 px-1">
                      Click to select registered mechanic(s)...
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-gray-300 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search mechanics..."
                      value={mechSearch}
                      onChange={e => setMechSearch(e.target.value)}
                      className="w-full bg-transparent text-xs outline-none text-gray-800 font-medium"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {filteredRegisteredMechanics.map(m => {
                      const isSelected = selectedMechanics.includes(m.name);
                      return (
                        <div
                          key={m._id}
                          onClick={() => toggleMechanicSelection(m.name)}
                          className={`p-2.5 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          <div>
                            <p className="font-extrabold">{m.name}</p>
                            <p className="text-[11px] font-normal text-gray-500">@{m.username}</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#BC0202] stroke-[3]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Requests & Quick Tags */}
            <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#BC0202]" />
                  Customer Reported Issues & Requests
                </label>
                <span className="text-[11px] text-gray-500 font-semibold">Tap to auto-insert</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {commonIssues.map((issue, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => addQuickIssue(issue)}
                    className="text-[11px] font-bold px-2 py-1 bg-white hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 transition-colors cursor-pointer"
                  >
                    + {issue}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Describe customer complaints and requested repairs (e.g. Brake noise, oil leak, vibration at 80 km/h)..."
                value={customerRequests}
                onChange={e => setCustomerRequests(e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800 text-xs sm:text-sm font-medium resize-none"
              />
            </div>
          </div>

          {/* Section 2: Services & Parts with Actual vs. Charging Cost */}
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b-2 border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-gray-950 uppercase tracking-wide text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-gray-800" /> Services & Spare Parts
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Actual Cost is internal only. Only the Charging Cost is printed on the customer bill.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-[#BC0202] hover:bg-[#830000] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Add Item
              </button>
            </div>

            {/* Line Items Container */}
            <div className="space-y-3.5">
              {items.map((item, index) => {
                const itemActual = Number(item.costPrice) || 0;
                const itemCharging = Number(item.rate) || 0;
                const itemProfit = itemCharging - itemActual;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50/80 rounded-2xl border-2 border-gray-200 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">

                      {/* Item Type */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-black text-gray-600 uppercase block mb-1">Type *</label>
                        <select
                          value={item.type}
                          onChange={e => handleItemChange(item.id, 'type', e.target.value)}
                          className="w-full p-2.5 border-2 border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-800 outline-none focus:border-slate-800"
                        >
                          <option value="Service">Service</option>
                          <option value="Part">Spare Part</option>
                        </select>
                      </div>

                      {/* Item Name */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-black text-gray-600 uppercase block mb-1">
                          Description / Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={item.type === 'Service' ? 'e.g. Brake Caliper Servicing' : 'e.g. Front Brake Pads (Set)'}
                          value={item.name}
                          onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                          className="w-full p-2.5 border-2 border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-900 outline-none focus:border-slate-800"
                        />
                      </div>

                      {/* Actual Cost (Internal / Hidden from Bill) */}
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-black text-amber-900 uppercase flex items-center gap-1 mb-1">
                          <EyeOff className="w-3 h-3 text-amber-700" />
                          Actual Cost (LKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.costPrice}
                          onChange={e => handleItemChange(item.id, 'costPrice', e.target.value)}
                          className="w-full p-2.5 border-2 border-amber-300 bg-amber-50/40 rounded-xl text-xs font-black text-amber-950 outline-none focus:border-amber-600"
                        />
                      </div>

                      {/* Charging Cost (Billed on Invoice) */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-black text-emerald-800 uppercase block mb-1">
                          Billed Rate (LKR) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={item.rate}
                          onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                          className="w-full p-2.5 border-2 border-emerald-300 bg-emerald-50/40 rounded-xl text-xs font-black text-emerald-950 outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Live Margin Calculation Indicator per item */}
                    <div className="flex items-center justify-between text-[11px] pt-1 px-1 border-t border-gray-200 font-semibold text-gray-500">
                      <span>Item #{index + 1} Billing Preview</span>
                      <span className={itemProfit >= 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                        Garage Profit: LKR {itemProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Job Card Logistics & GST */}
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm space-y-4">
            <h3 className="font-black text-gray-950 uppercase tracking-wide text-sm border-b-2 border-gray-100 pb-2">
              Logistics & Delivery Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Job Date *</label>
                <input
                  type="date"
                  required
                  value={jobDate}
                  onChange={e => setJobDate(e.target.value)}
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Estimated Delivery</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full mt-1 p-2.5 border-2 border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800 bg-white"
                >
                  <option value="Pending Inspection">Pending Inspection</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                Internal Mechanic Notes & Repair Observations
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Diagnostic findings, technician notes, additional work recommendations..."
                className="w-full p-2.5 border-2 border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-slate-800 resize-none"
              />
            </div>

            {/* GST Checkbox */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-gray-800 select-none">
                <input
                  type="checkbox"
                  checked={applyGST}
                  onChange={e => setApplyGST(e.target.checked)}
                  className="rounded border-gray-300 text-slate-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                Apply GST / VAT (18%) to Customer Bill
              </label>

              <div className="text-sm font-black text-slate-950">
                Customer Total: <span className="text-emerald-700">LKR {calculations.totalBilled.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submission Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-[#BC0202] hover:bg-[#830000] text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center gap-2 w-full justify-center cursor-pointer border border-[#830000] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              <CheckCircle className="w-5 h-5 stroke-[2.5]" />
              {isSubmitting
                ? 'Processing & Saving to MongoDB...'
                : isViewOrEditMode
                  ? `Update Job Card (${jobId})`
                  : 'Create & Finalize Job Card'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default JobCardWorkspace;