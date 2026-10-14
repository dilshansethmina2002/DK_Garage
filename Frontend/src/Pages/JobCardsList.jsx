import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Filter, Plus, Eye, Edit, Trash2, Download, AlertCircle, Wrench
} from 'lucide-react';

const JobCardsList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const navigate = useNavigate();

    // Secure data fetching
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Your Axios interceptor automatically attaches the JWT here
                const response = await axios.get('http://localhost:5000/api/jobs/active');
                setJobs(response.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                } else {
                    setError("Failed to securely load job cards.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [navigate]);

    // Client-side filtering (safe from SQL injection as it's purely in-memory React state)
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (jobId) => {
        if (window.confirm(`SECURITY ALERT: Are you sure you want to permanently delete job ${jobId}?`)) {
            try {
                // Future backend route: await axios.delete(`http://localhost:5000/api/jobs/${jobId}`);
                setJobs(jobs.filter(j => j.id !== jobId));
                alert('Job deleted securely.');
            } catch (err) {
                alert('Unauthorized or failed to delete.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
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
                        placeholder="Search by ID, Vehicle, or Customer..."
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
                        <option value="Pending Inspection">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                        {/* Card Header Info */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-md text-sm tracking-wider border border-blue-700 shadow-sm">
                                        {job.vehicle.split(' - ')[1] || 'NO-PLATE'}
                                    </span>
                                    <span className="text-slate-400 text-xs">{job.id} • {new Date().toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-indigo-700">{job.vehicle.split(' - ')[0]}</h3>
                                <div className="flex gap-2 mt-3">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">Medium</span>
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${job.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Body Info */}
                        <div className="p-5 flex-1 grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-bold text-slate-800">{job.customer}</p>
                                <p className="text-slate-500 text-sm mt-0.5">Assigned: {job.mechanic}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-sm mb-0.5">Total Cost</p>
                                <p className="text-xl font-extrabold text-slate-900">LKR 0.00</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Link to={`/job/${job.id}`} className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                                <Eye className="w-4 h-4" /> View
                            </Link>
                            <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all">
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDelete(job.id)} className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-all">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-all">
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