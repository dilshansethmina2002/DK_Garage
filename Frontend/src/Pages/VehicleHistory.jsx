import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Car, Wrench, ArrowLeft, Search, Calendar, Phone, User,
    CircleDollarSign, Clock, ShieldCheck, FileText, ChevronRight,
    Package, AlertCircle, Printer, History
} from 'lucide-react';
import API from '../api';

const VehicleHistory = () => {
    const { plateNumber } = useParams();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState(plateNumber || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(Boolean(plateNumber));
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'parts'

    useEffect(() => {
        if (plateNumber) {
            fetchHistory(plateNumber);
        }
    }, [plateNumber]);

    const fetchHistory = async (plate) => {
        if (!plate || !plate.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const formattedPlate = encodeURIComponent(plate.trim().toUpperCase());
            const res = await API.get(`/api/jobs/vehicle-history/${formattedPlate}`);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'No service records found for this license plate.');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/vehicles/history/${encodeURIComponent(searchInput.trim().toUpperCase())}`);
            fetchHistory(searchInput);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100/80 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header & Global Search Bar */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/vehicles"
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border-2 border-slate-300 text-slate-700 hover:text-slate-950 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-red-50 text-[#BC0202] border border-red-200 mb-1.5">
                                <History className="w-3.5 h-3.5" /> Maintenance Archive
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                                Vehicle Service History & Log
                            </h1>
                        </div>
                    </div>

                    {/* Quick License Plate Search Form */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <input
                                type="text"
                                placeholder="Search Plate (e.g. WP CAA-1234)..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-black uppercase tracking-wider outline-none focus:border-slate-800 bg-slate-50 focus:bg-white"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        </div>
                        <button
                            type="submit"
                            className="bg-[#BC0202] hover:bg-[#830000] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-[#830000] shrink-0"
                        >
                            Inspect History
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {error}
                    </div>
                )}

                {loading && (
                    <div className="py-24 text-center">
                        <div className="flex items-center justify-center gap-3 text-slate-700 font-black text-lg animate-pulse">
                            <Wrench className="w-6 h-6 text-[#BC0202] animate-spin" />
                            Compiling Complete Service History...
                        </div>
                    </div>
                )}

                {data && !loading && (
                    <div className="space-y-6">

                        {/* Vehicle Profile & Aggregate Metrics Card */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                            {/* Profile Card */}
                            <div className="xl:col-span-4 bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                                    <h2 className="text-sm font-black uppercase text-slate-700 flex items-center gap-2">
                                        <Car className="w-4 h-4 text-[#BC0202]" /> Vehicle Specifications
                                    </h2>
                                    <span className="font-black text-xs px-3 py-1 bg-slate-900 text-white rounded-lg">
                                        {data.vehicle.licensePlate}
                                    </span>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-xs font-black uppercase text-slate-400">Make & Model</span>
                                        <p className="font-extrabold text-slate-950 text-base">
                                            {data.vehicle.make} {data.vehicle.model}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-black uppercase text-slate-400">Registered Owner</span>
                                        <p className="font-extrabold text-slate-950 flex items-center gap-1.5 mt-0.5">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            {data.vehicle.owner?.name || data.vehicle.customer?.name || 'Walk-in Customer'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-black uppercase text-slate-400">Contact Number</span>
                                        <p className="font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            {data.vehicle.owner?.phone || data.vehicle.customer?.phone || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex gap-2">
                                    <Link
                                        to={`/job-cards/workspace?plate=${encodeURIComponent(data.vehicle.licensePlate)}`}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 text-center transition-colors"
                                    >
                                        Open New Job Card
                                    </Link>
                                </div>
                            </div>

                            {/* High-Level Metric Tiles */}
                            <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between">
                                    <span className="text-xs font-black uppercase text-slate-400">Total Workshop Visits</span>
                                    <h3 className="text-3xl font-black text-slate-950 mt-2">{data.metrics.totalVisits}</h3>
                                    <span className="text-[11px] font-bold text-slate-500 mt-2">Recorded Job Cards</span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-xs flex flex-col justify-between">
                                    <span className="text-xs font-black uppercase text-emerald-800">Total Lifetime Spend</span>
                                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2">
                                        LKR {data.metrics.totalLifetimeSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h3>
                                    <span className="text-[11px] font-bold text-emerald-700 mt-2">Billed Revenue</span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col justify-between">
                                    <span className="text-xs font-black uppercase text-amber-800">Billed Labor Hours</span>
                                    <h3 className="text-3xl font-black text-amber-950 mt-2">{data.metrics.totalLaborHours} hrs</h3>
                                    <span className="text-[11px] font-bold text-amber-700 mt-2">Workshop Technician Time</span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between">
                                    <span className="text-xs font-black uppercase text-slate-400">Spare Parts Installed</span>
                                    <h3 className="text-3xl font-black text-slate-950 mt-2">{data.partsReplaced.length}</h3>
                                    <span className="text-[11px] font-bold text-slate-500 mt-2">Parts Recorded on File</span>
                                </div>
                            </div>

                        </div>

                        {/* Toggle Tabs: Timeline vs. Parts Replaced Ledger */}
                        <div className="flex border-b-2 border-slate-200 gap-4">
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={`pb-3 text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-4 ${activeTab === 'timeline'
                                        ? 'border-[#BC0202] text-[#BC0202]'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" /> Service Timeline ({data.history.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('parts')}
                                className={`pb-3 text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-4 ${activeTab === 'parts'
                                        ? 'border-[#BC0202] text-[#BC0202]'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <Package className="w-4 h-4" /> Parts Replacement Ledger ({data.partsReplaced.length})
                            </button>
                        </div>

                        {/* Tab 1: Service Timeline */}
                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                {data.history.map((job, idx) => (
                                    <div
                                        key={job._id || job.jobId}
                                        className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden"
                                    >
                                        {/* Job Card Timeline Header */}
                                        <div className="p-4 sm:p-5 bg-slate-50 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black">
                                                    #{job.jobId}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {job.jobDate ? new Date(job.jobDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${job.status === 'Completed' ? 'bg-slate-900 text-white border-slate-900' :
                                                        job.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            job.status === 'Ready for Pickup' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-black text-slate-950">
                                                    Total: <strong className="text-emerald-700">LKR {(job.totalCost || job.subtotal || 0).toFixed(2)}</strong>
                                                </span>
                                                <Link
                                                    to={`/job-cards/workspace/${job.jobId}`}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:text-black hover:border-black transition-colors flex items-center gap-1"
                                                >
                                                    View Card <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Job Card Details Content */}
                                        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                                            {/* Customer Complaints & Technician Notes */}
                                            <div className="lg:col-span-5 space-y-4">
                                                <div>
                                                    <h4 className="text-xs font-black uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5 text-[#BC0202]" /> Reported Complaints
                                                    </h4>
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                                                        {job.customerRequests || job.notes || 'No specific complaint recorded.'}
                                                    </div>
                                                </div>

                                                {job.notes && job.notes !== job.customerRequests && (
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                                                            <Wrench className="w-3.5 h-3.5 text-slate-600" /> Technician Findings
                                                        </h4>
                                                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-xs font-medium text-amber-950 whitespace-pre-wrap leading-relaxed">
                                                            {job.notes}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="text-xs text-slate-500 font-bold flex gap-4">
                                                    <span>Mechanic: <strong>{job.mechanic || 'Unassigned'}</strong></span>
                                                    {job.laborHours > 0 && <span>Labor: <strong>{job.laborHours} hrs</strong></span>}
                                                </div>
                                            </div>

                                            {/* Line Items Applied */}
                                            <div className="lg:col-span-7">
                                                <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Itemized Work & Spares</h4>
                                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-100 text-slate-700 font-black uppercase border-b border-slate-200 text-[10px]">
                                                                <th className="p-2.5">Date</th>
                                                                <th className="p-2.5">Type</th>
                                                                <th className="p-2.5">Description</th>
                                                                <th className="p-2.5 text-right">Billed Rate</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                                            {Array.isArray(job.lineItems) && job.lineItems.length > 0 ? (
                                                                job.lineItems.map((item, iIdx) => (
                                                                    <tr key={iIdx} className="hover:bg-slate-50">
                                                                        <td className="p-2.5 font-bold text-slate-500">
                                                                            {item.date || (job.jobDate ? new Date(job.jobDate).toISOString().split('T')[0] : '—')}
                                                                        </td>
                                                                        <td className="p-2.5">
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'Part' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                                                }`}>
                                                                                {item.type}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-2.5 font-bold">{item.name}</td>
                                                                        <td className="p-2.5 text-right font-black">
                                                                            LKR {Number(item.rate || 0).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={4} className="p-3 text-center text-slate-400 italic">
                                                                        No itemized breakdown recorded for this job.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tab 2: Parts Replacement Ledger */}
                        {activeTab === 'parts' && (
                            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-[#BC0202]" /> All Installed Replacement Parts
                                    </h3>
                                    <span className="text-xs font-bold text-slate-500">
                                        Total Parts Installed: {data.partsReplaced.length}
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-slate-200 bg-slate-100/75 text-slate-700 text-xs uppercase font-black">
                                                <th className="py-3 px-5">Installed Date</th>
                                                <th className="py-3 px-5">Part Description</th>
                                                <th className="py-3 px-5">Job Reference</th>
                                                <th className="py-3 px-5 text-right">Price Charged (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                                            {data.partsReplaced.map((part, pIdx) => (
                                                <tr key={pIdx} className="hover:bg-slate-50">
                                                    <td className="py-3.5 px-5 text-xs text-slate-500 font-bold">
                                                        {part.date ? new Date(part.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                                    </td>
                                                    <td className="py-3.5 px-5 font-black text-slate-900">{part.name}</td>
                                                    <td className="py-3.5 px-5">
                                                        <Link
                                                            to={`/job-cards/workspace/${part.jobId}`}
                                                            className="text-xs font-bold text-indigo-600 hover:underline"
                                                        >
                                                            #{part.jobId}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-right font-black text-slate-950">
                                                        LKR {Number(part.rate || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.partsReplaced.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-slate-400 italic text-sm">
                                                        No spare parts have been billed for this vehicle yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
};

export default VehicleHistory;