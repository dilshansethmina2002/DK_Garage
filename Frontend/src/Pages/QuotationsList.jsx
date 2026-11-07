import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Search, Edit, Trash2, Printer,
    RefreshCw, AlertCircle, Car, User, Calendar
} from 'lucide-react';
import API from '../api';

const QuotationsList = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Fetch all quotations on load
    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/quotations');
            setQuotations(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch quotations. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    // Handle Delete
    const handleDelete = async (id, quotationNo) => {
        if (!window.confirm(`Are you sure you want to permanently delete quotation ${quotationNo}?`)) return;

        try {
            await API.delete(`/api/quotations/${id}`);
            setQuotations(prev => prev.filter(q => q._id !== id));
        } catch (err) {
            alert('Failed to delete quotation.');
        }
    };

    // Filter based on search term
    const filteredQuotations = quotations.filter(q => {
        const search = searchTerm.toLowerCase();
        return (
            (q.quotationNo && q.quotationNo.toLowerCase().includes(search)) ||
            (q.customerName && q.customerName.toLowerCase().includes(search)) ||
            (q.vehicleNo && q.vehicleNo.toLowerCase().includes(search))
        );
    });

    return (
        <div className="min-h-screen bg-slate-100/90 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
                            <FileText className="w-8 h-8 text-[#BC0202]" /> Quotations Management
                        </h1>
                        <p className="text-sm font-bold text-slate-500 mt-1">View, manage, and print vehicle repair quotations.</p>
                    </div>

                    <Link
                        to="/quotations/workspace"
                        className="bg-[#BC0202] hover:bg-[#830000] text-white px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md border border-[#830000]"
                    >
                        <Plus className="w-5 h-5 stroke-[2.5]" /> Create New Quotation
                    </Link>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-xs flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Quotation No, Customer Name, or Vehicle No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow bg-transparent text-sm font-bold outline-none text-slate-800 placeholder-slate-400"
                    />
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {error}
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b-2 border-slate-200">
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Quotation No</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Customer</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Vehicle</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Grand Total (Rs)</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center">
                                            <div className="flex justify-center items-center gap-2 text-slate-500 font-bold">
                                                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Quotations...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredQuotations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-500 font-bold italic">
                                            No quotations found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQuotations.map((q) => (
                                        <tr key={q._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                    {q.quotationNo}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(q.date).toLocaleDateString('en-GB')}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                                                    <User className="w-4 h-4 text-blue-600" /> {q.customerName}
                                                </div>
                                                {q.insuranceCompany && (
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5 ml-5">
                                                        {q.insuranceCompany}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase">
                                                    <Car className="w-4 h-4 text-emerald-600" /> {q.vehicleNo}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-sm font-black text-slate-900">
                                                    {(q.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/quotations/workspace/${q._id}`)}
                                                        className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                                        title="Edit Quotation"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* Ready for when you build the Print View component */}
                                                    <button
                                                        onClick={() => navigate(`/quotations/print/${q._id}`)}
                                                        className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
                                                        title="Print Quotation"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(q._id, q.quotationNo)}
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                                        title="Delete Quotation"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default QuotationsList;