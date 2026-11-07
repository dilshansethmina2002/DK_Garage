import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    Shield, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw,
    Plus, Trash2, Wrench, PaintBucket, Hammer, Settings, Calculator, FileText, User, Car
} from 'lucide-react';
import API from '../api';

const INITIAL_FORM_STATE = {
    quotationNo: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    contactNumber: '',
    insuranceCompany: '',
    vehicleNo: '',
    make: '',
    model: '',
    chassisNo: '',
    removeAndRefix: [],
    realigning: [],
    repainting: [],
    spareParts: []
};

const QuotationWorkspace = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [suggestions, setSuggestions] = useState({
        removeAndRefix: [],
        realigning: [],
        repainting: [],
        spareParts: []
    });
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // Fetch existing suggestions from previous quotes
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await API.get('/api/quotations/suggestions');
                if (res.data) {
                    setSuggestions({
                        removeAndRefix: res.data.removeAndRefix || [],
                        realigning: res.data.realigning || [],
                        repainting: res.data.repainting || [],
                        spareParts: res.data.spareParts || []
                    });
                }
            } catch (err) {
                console.error('Failed to load autofill suggestions', err);
            }
        };
        fetchSuggestions();
    }, []);

    // Load existing quotation for edit mode
    useEffect(() => {
        if (!isEditMode) return;
        const fetchRecord = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/quotations/${id}`);
                const fetchedData = res.data;
                if (fetchedData.date) {
                    fetchedData.date = new Date(fetchedData.date).toISOString().split('T')[0];
                }
                setFormData(fetchedData);
            } catch (err) {
                setErrorMessage('Failed to load quotation details.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = (category) => {
        setFormData(prev => ({
            ...prev,
            [category]: [...prev[category], { description: '', amount: '' }]
        }));
    };

    const handleRemoveItem = (category, index) => {
        setFormData(prev => {
            const updatedArray = [...prev[category]];
            updatedArray.splice(index, 1);
            return { ...prev, [category]: updatedArray };
        });
    };

    const handleItemChange = (category, index, field, value) => {
        setFormData(prev => {
            const updatedArray = [...prev[category]];
            updatedArray[index] = { ...updatedArray[index], [field]: value };
            return { ...prev, [category]: updatedArray };
        });
    };

    const calculateSubtotal = (categoryArray) => {
        return (categoryArray || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    };

    const subTotalRemoveRefix = calculateSubtotal(formData.removeAndRefix);
    const subTotalRealigning = calculateSubtotal(formData.realigning);
    const subTotalRepainting = calculateSubtotal(formData.repainting);
    const subTotalSpareParts = calculateSubtotal(formData.spareParts);
    const grandTotal = subTotalRemoveRefix + subTotalRealigning + subTotalRepainting + subTotalSpareParts;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMessage(null);

        const payload = { ...formData };

        // Clean & format the vehicle number
        const cleanVehicleNo = String(payload.vehicleNo || '').trim().toUpperCase().replace(/\s+/g, '-');

        // Extract or generate base quotation prefix
        let baseQuotationNo = String(payload.quotationNo || '').trim().toUpperCase();
        if (!baseQuotationNo) {
            baseQuotationNo = `QTN-${Date.now().toString().slice(-6)}`;
        }

        // Combine: BaseQuotationNo + VehicleNumber
        // If not already ending with the vehicle number, join them with a hyphen
        if (cleanVehicleNo && !baseQuotationNo.endsWith(cleanVehicleNo)) {
            payload.quotationNo = `${baseQuotationNo}-${cleanVehicleNo}`;
        } else {
            payload.quotationNo = baseQuotationNo;
        }

        try {
            if (isEditMode) {
                await API.put(`/api/quotations/${id}`, payload);
            } else {
                await API.post('/api/quotations', payload);
            }
            navigate('/quotations');
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to save quotation.');
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
                <div className="flex items-center gap-3 text-slate-800 font-extrabold text-base animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#BC0202] animate-spin" />
                    Loading Quotation Workspace...
                </div>
            </div>
        );
    }

    const renderDynamicSection = (title, categoryKey, IconComponent, colorClass) => {
        const items = formData[categoryKey];
        const subtotal = calculateSubtotal(items);
        const datalistId = `${categoryKey}-datalist`;

        return (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
                        <IconComponent className="w-5 h-5" /> {title}
                    </h3>
                    <div className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        Subtotal: Rs. {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {items.length === 0 && (
                    <p className="text-xs font-bold text-slate-400 text-center py-4 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No items added yet. Click below to add a row.
                    </p>
                )}

                {/* Datalist populated from previous MongoDB records */}
                <datalist id={datalistId}>
                    {(suggestions[categoryKey] || []).map((suggestion, sIdx) => (
                        <option key={sIdx} value={suggestion} />
                    ))}
                </datalist>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start group">
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    list={datalistId}
                                    placeholder="Type or select description (e.g., Bonnet, Door shell)..."
                                    value={item.description}
                                    onChange={(e) => handleItemChange(categoryKey, index, 'description', e.target.value)}
                                    className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800 transition-colors"
                                />
                            </div>
                            <div className="w-40 shrink-0 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rs.</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={item.amount}
                                    onChange={(e) => handleItemChange(categoryKey, index, 'amount', e.target.value)}
                                    className="w-full p-2.5 pl-8 border-2 border-slate-200 rounded-xl text-xs font-black bg-slate-50 focus:bg-white outline-none focus:border-slate-800 transition-colors"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(categoryKey, index)}
                                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors shrink-0 cursor-pointer"
                                title="Remove Row"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => handleAddItem(categoryKey)}
                    className="mt-2 w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add Row to {title}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-100/90 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header Controls */}
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-4 z-50">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                            <Shield className="w-3.5 h-3.5" /> DK Automobile Quotations
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                            {isEditMode ? `Edit Quotation — ${formData.quotationNo || id}` : 'Create New Quotation'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <Link className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer" to="/quotations">
                            <ArrowLeft className="w-4 h-4" /> Back to List
                        </Link>

                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className={`bg-[#BC0202] hover:bg-[#830000] text-white px-7 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#830000] ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            {saving ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Save Quotation'}
                        </button>
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {errorMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Basic Info */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Doc Info */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#BC0202]" /> Document Info
                            </h3>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Quotation No</label>
                                <input type="text" name="quotationNo" value={formData.quotationNo} onChange={handleChange} placeholder="Auto-generated if empty" className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-black uppercase bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" /> Customer Details
                            </h3>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Customer Name *</label>
                                <input type="text" name="customerName" required value={formData.customerName} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Contact Number</label>
                                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Insurance Company</label>
                                <input type="text" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Car className="w-4 h-4 text-green-600" /> Vehicle Details
                            </h3>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Vehicle No *</label>
                                <input type="text" name="vehicleNo" required value={formData.vehicleNo} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-black uppercase bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Make</label>
                                    <input type="text" name="make" value={formData.make} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Model</label>
                                    <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Chassis No</label>
                                <input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleChange} className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-xs font-black uppercase bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                        </div>

                        {/* Grand Total Summary Box */}
                        <div className="bg-slate-900 p-6 rounded-2xl shadow-md space-y-2 text-white">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Calculator className="w-4 h-4" /> Grand Total
                            </h3>
                            <div className="text-3xl font-black break-all">
                                Rs. {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: The 4 Dynamic Quoting Categories */}
                    <div className="lg:col-span-2 space-y-6">
                        {renderDynamicSection('1. Remove and Refix', 'removeAndRefix', Wrench, 'text-blue-700')}
                        {renderDynamicSection('2. Realigning', 'realigning', Hammer, 'text-orange-600')}
                        {renderDynamicSection('3. Repainting', 'repainting', PaintBucket, 'text-purple-600')}
                        {renderDynamicSection('4. Spare Parts', 'spareParts', Settings, 'text-emerald-700')}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QuotationWorkspace;