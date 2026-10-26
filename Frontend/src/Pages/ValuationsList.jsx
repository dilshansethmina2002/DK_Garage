import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, Plus, Search, Edit, Trash2, Printer,
    RefreshCw, AlertCircle, Car
} from 'lucide-react';
import API from '../api';
import ValuationPrintView from '../components/ValuationPrintView.jsx';

const ValuationsList = () => {
    const [valuations, setValuations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // State for direct printing
    const [printData, setPrintData] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const fetchValuations = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await API.get('/api/valuations');
            setValuations(Array.isArray(res.data) ? res.data : res.data.valuations || []);
        } catch (err) {
            setError('Failed to fetch valuation records.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchValuations();
    }, []);

    const handleDelete = async (id, reportNo) => {
        if (!window.confirm(`Are you sure you want to delete Report #${reportNo}?`)) return;

        try {
            await API.delete(`/api/valuations/${id}`);
            setValuations(prev => prev.filter(v => v._id !== id));
        } catch (err) {
            alert('Failed to delete the valuation record.');
        }
    };

    const handlePrintClick = async (id) => {
        try {
            setIsPrinting(true);
            // Fetch the full document to ensure photos and nested data are present for the report
            const res = await API.get(`/api/valuations/${id}`);
            setPrintData(res.data);

            // Wait for React to render the ValuationPrintView component, then open the print dialog
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 500);
        } catch (err) {
            console.error(err);
            alert('Failed to load report data for printing.');
            setIsPrinting(false);
        }
    };

    const filteredValuations = valuations.filter(val => {
        const searchString = `${val.reportNo} ${val.identification?.registrationNo} ${val.contactPerson} ${val.identification?.make}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    return (
        <>
            {/* MAIN LIST UI (Hidden during printing) */}
            <div className="min-h-screen bg-slate-100/90 p-4 sm:p-6 lg:p-8 font-sans text-slate-900 print:hidden">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
                                <FileText className="w-8 h-8 text-[#BC0202]" /> Valuation Reports
                            </h1>
                            <p className="text-sm font-bold text-slate-500 mt-1">Manage and track all generated vehicle valuations</p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-grow md:flex-grow-0">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search Reg No, Report #..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-64 pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:border-slate-800 outline-none"
                                />
                            </div>
                            <Link
                                to="/valuations/new"
                                className="bg-[#BC0202] hover:bg-[#830000] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4 stroke-[3]" /> New Report
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Report Info</th>
                                        <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vehicle Details</th>
                                        <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client</th>
                                        <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Market Value</th>
                                        <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center">
                                                <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-sm">
                                                    <RefreshCw className="w-5 h-5 animate-spin text-[#BC0202]" /> Loading records...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredValuations.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-500 font-bold text-sm">
                                                No valuation reports found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredValuations.map((val) => (
                                            <tr key={val._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="text-sm font-black text-slate-900">#{val.reportNo}</p>
                                                    <p className="text-xs font-bold text-slate-500">{new Date(val.inspectionDate).toLocaleDateString()}</p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                            {val.photos?.vehiclePhotos?.[0] ? (
                                                                <img src={val.photos.vehiclePhotos[0]} alt="Vehicle" className="w-full h-full object-cover rounded-lg" />
                                                            ) : (
                                                                <Car className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 uppercase">
                                                                {val.identification?.registrationNo || 'UNREGISTERED'}
                                                            </p>
                                                            <p className="text-[11px] font-bold text-slate-500">
                                                                {val.identification?.make} {val.identification?.model}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-black text-slate-800">{val.contactPerson}</p>
                                                    <p className="text-[11px] font-bold text-slate-500">{val.opinionProvidedTo}</p>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <p className="text-sm font-black text-slate-900">
                                                        Rs. {val.evaluationTab2?.marketValue?.toLocaleString('en-US')}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            to={`/valuations/workspace/${val._id}`}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip cursor-pointer"
                                                            title="Edit / View"
                                                        >
                                                            <Edit className="w-4 h-4 stroke-[2.5]" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handlePrintClick(val._id)}
                                                            disabled={isPrinting}
                                                            className={`p-2 rounded-lg transition-colors tooltip cursor-pointer ${isPrinting ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                                                            title="Print Report"
                                                        >
                                                            {isPrinting ? <RefreshCw className="w-4 h-4 stroke-[2.5] animate-spin" /> : <Printer className="w-4 h-4 stroke-[2.5]" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(val._id, val.reportNo)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4 stroke-[2.5]" />
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

            {/* INVISIBLE PRINT TEMPLATE */}
            <ValuationPrintView data={printData} />
        </>
    );
};

export default ValuationsList;