import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, Filter, Plus, Eye, Trash2, Download, AlertCircle, Wrench, ShieldAlert
} from 'lucide-react';
import API from '../api';
import { generateJobReceipt } from '../utils/generateJobReceipt';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../components/ui/alert-dialog';

const JobCardsList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const navigate = useNavigate();

    // Read logged-in user role for UI-level RBAC protection
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser?.role === 'Admin';

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/jobs');
            setJobs(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                setError('Failed to securely load job cards.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [navigate]);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            (job.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.vehicle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.customer || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = async (jobId, newStatus) => {
        try {
            await API.put(`/api/jobs/${jobId}/status`, { status: newStatus });
            setJobs(jobs.map(job => (job.id === jobId ? { ...job, status: newStatus } : job)));
        } catch {
            setError('Failed to update job status.');
        }
    };

    // Triggered only when the user clicks "Permanently Delete" inside the AlertDialog
    const handleDelete = async (jobId) => {
        try {
            await API.delete(`/api/jobs/${jobId}`);
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (err) {
            setError(err.response?.data?.message || 'Unauthorized: Only Admins can delete Job Cards.');
        }
    };

    const handleDownload = async (jobId) => {
        try {
            const response = await API.get(`/api/jobs/${jobId}`);
            generateJobReceipt(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                setError('Failed to generate PDF receipt. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 min-h-screen">
                <Wrench className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 font-sans text-slate-900 bg-slate-50 min-h-screen">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Job Cards</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage all your garage job cards and track service progress.</p>
                </div>
                <Link
                    to="/job-cards/workspace"
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Job Card Workspace
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-medium whitespace-nowrap">
                    <Filter className="w-4 h-4" /> Job Card Filters
                </div>

                <div className="flex-1 w-full relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID, License Plate, Vehicle, or Customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                        className="text-sm text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap"
                    >
                        ✕ Clear Filters
                    </button>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-2 px-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending Inspection">Pending Inspection</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Awaiting Parts">Awaiting Parts</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center justify-between border border-red-100">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                    <button onClick={() => setError(null)} className="text-xs font-bold underline">Dismiss</button>
                </div>
            )}

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                        {/* Card Header Info */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                            <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden mb-3 shadow-xs bg-white">
                                <span className="bg-blue-700 text-white text-[10px] font-bold px-2 py-1.5 leading-none">
                                    SL
                                </span>
                                <span className="px-3 py-1 font-extrabold text-sm tracking-wider text-slate-900">
                                    {job.vehicle?.split(' - ')[1] || 'NO-PLATE'}
                                </span>
                            </div>

                            <h3 className="text-base font-bold text-blue-700">{job.vehicle?.split(' - ')[0] || job.vehicle}</h3>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {job.id} • {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>

                            <div className="flex gap-2 mt-3">
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${job.priority === 'High' || job.priority === 'Urgent'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {job.priority || 'Medium'}
                                </span>
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${job.status === 'Completed'
                                    ? 'bg-red-700 text-white'
                                    : job.status === 'In Progress'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>

                        {/* Card Body Info */}
                        <div className="p-5 flex-1 space-y-4">
                            <div>
                                <p className="font-bold text-slate-800 italic">{job.customer}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{job.customerPhone}</p>
                                <p className="text-slate-400 text-xs mt-1">
                                    Mechanic: {Array.isArray(job.mechanics) && job.mechanics.length > 0 ? job.mechanics.join(', ') : (job.mechanic || 'Unassigned')}
                                </p>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-slate-500 text-sm">Total Cost:</span>
                                <span className="text-lg font-extrabold text-slate-900">
                                    LKR {(job.totalCost || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Change Status:</label>
                                <select
                                    value={job.status}
                                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    <option value="Pending Inspection">Pending Inspection</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Awaiting Parts">Awaiting Parts</option>
                                    <option value="Ready for Pickup">Ready for Pickup</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons with Shadcn AlertDialog on Delete */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
                            <Link
                                to={`/job-cards/workspace/${job.id}`}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                                <Eye className="w-4 h-4" /> View
                            </Link>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={!isAdmin}
                                        title={!isAdmin ? 'Admin role required to delete job cards' : 'Delete Job Card'}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold transition-all ${isAdmin
                                            ? 'text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer'
                                            : 'text-slate-300 cursor-not-allowed'
                                            }`}
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-red-600" />
                                            Delete Job Card {job.id}?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete job card{' '}
                                            <span className="font-bold text-slate-800">{job.id}</span> for{' '}
                                            <span className="font-bold text-slate-800">{job.customer}</span> ({job.vehicle}) and remove its repair records from the database.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(job.id)}>
                                            Permanently Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <button
                                type="button"
                                onClick={() => handleDownload(job.id)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                            >
                                <Download className="w-4 h-4" /> Download
                            </button>
                        </div>
                    </div>
                ))}

                {filteredJobs.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        No job cards found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobCardsList;