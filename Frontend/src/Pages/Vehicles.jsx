import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, Search, Filter, Plus, Edit, Trash2, User, Phone, Gauge, Fuel, Calendar, AlertCircle, Wrench, ShieldAlert, ClipboardList
} from 'lucide-react';
import API from '../api';
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

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fuelFilter, setFuelFilter] = useState('All');

    // Modal State for Add / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        licensePlate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        fuelType: 'Petrol',
        mileage: '',
        ownerName: '',
        ownerPhone: ''
    });

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser?.role === 'Admin';

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/vehicles');
            setVehicles(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                setError('Failed to securely load vehicles.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [navigate]);

    const filteredVehicles = vehicles.filter(v => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (v.licensePlate || '').toLowerCase().includes(query) ||
            (v.make || '').toLowerCase().includes(query) ||
            (v.model || '').toLowerCase().includes(query) ||
            (v.ownerName || '').toLowerCase().includes(query) ||
            (v.ownerPhone || '').toLowerCase().includes(query);
        const matchesFuel = fuelFilter === 'All' || v.fuelType === fuelFilter;
        return matchesSearch && matchesFuel;
    });

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            licensePlate: '',
            make: '',
            model: '',
            year: new Date().getFullYear(),
            fuelType: 'Petrol',
            mileage: '',
            ownerName: '',
            ownerPhone: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (v) => {
        setEditingId(v._id);
        setFormData({
            licensePlate: v.licensePlate,
            make: v.make,
            model: v.model,
            year: v.year || new Date().getFullYear(),
            fuelType: v.fuelType || 'Petrol',
            mileage: v.mileage || 0,
            ownerName: v.ownerName,
            ownerPhone: v.ownerPhone === 'N/A' ? '' : v.ownerPhone
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingId) {
                await API.put(`/api/vehicles/${editingId}`, formData);
            } else {
                await API.post('/api/vehicles', formData);
            }
            setIsModalOpen(false);
            fetchVehicles();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save vehicle.');
        }
    };

    const handleDelete = async (id) => {
        setError(null);
        try {
            await API.delete(`/api/vehicles/${id}`);
            setVehicles(vehicles.filter(v => v._id !== id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete vehicle.');
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

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Registered Vehicles</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage all customer vehicles, service histories, and technical specifications.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    Register Vehicle
                </button>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fleet</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{vehicles.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicles With Job History</p>
                        <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                            {vehicles.filter(v => v.totalJobs > 0).length}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hybrid & Electric</p>
                        <h3 className="text-3xl font-extrabold text-blue-600 mt-1">
                            {vehicles.filter(v => v.fuelType === 'Hybrid' || v.fuelType === 'Electric').length}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Fuel className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-medium whitespace-nowrap">
                    <Filter className="w-4 h-4" /> Vehicle Filters
                </div>

                <div className="flex-1 w-full relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Search by License Plate, Make, Model, Owner, or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => { setSearchQuery(''); setFuelFilter('All'); }}
                        className="text-sm text-slate-500 hover:text-slate-800 whitespace-nowrap cursor-pointer"
                    >
                        ✕ Clear
                    </button>
                    <select
                        value={fuelFilter}
                        onChange={(e) => setFuelFilter(e.target.value)}
                        className="py-2 px-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer"
                    >
                        <option value="All">All Fuel Types</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Electric">Electric</option>
                    </select>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center justify-between border border-red-100">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                    </div>
                    <button onClick={() => setError(null)} className="text-xs font-bold underline cursor-pointer">Dismiss</button>
                </div>
            )}

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((v) => (
                    <div key={v._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">

                        <div>
                            {/* Card Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex justify-between items-start">
                                <div>
                                    <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden mb-2 shadow-xs bg-white">
                                        <span className="bg-blue-700 text-white text-[10px] font-bold px-2 py-1.5 leading-none">
                                            SL
                                        </span>
                                        <span className="px-3 py-1 font-extrabold text-sm tracking-wider text-slate-900">
                                            {v.licensePlate}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">{v.make} {v.model}</h3>
                                </div>

                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                                    {v.fuelType}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Owner:</span>
                                    <span className="font-bold text-slate-800">{v.ownerName}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> Phone:</span>
                                    <span className="font-medium text-slate-700">{v.ownerPhone}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-2"><Gauge className="w-4 h-4 text-slate-400" /> Odometer:</span>
                                    <span className="font-medium text-slate-700">{(v.mileage || 0).toLocaleString()} km</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Year / Jobs:</span>
                                    <span className="font-medium text-slate-700">
                                        {v.year || 'N/A'} • <strong className="text-indigo-600">{v.totalJobs || 0} Job(s)</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => openEditModal(v)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer"
                            >
                                <Edit className="w-4 h-4" /> Edit Details
                            </button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={!isAdmin}
                                        title={!isAdmin ? 'Admin role required to delete vehicles' : 'Delete Vehicle'}
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
                                            Delete Vehicle {v.licensePlate}?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to permanently remove{' '}
                                            <span className="font-bold text-slate-800">{v.make} {v.model} ({v.licensePlate})</span> owned by{' '}
                                            <span className="font-bold text-slate-800">{v.ownerName}</span>? Note: Vehicles with existing job card histories cannot be deleted.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(v._id)}>
                                            Permanently Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                    </div>
                ))}

                {filteredVehicles.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        No vehicles found matching your search criteria.
                    </div>
                )}
            </div>

            {/* Add / Edit Vehicle Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
                        <h2 className="text-xl font-extrabold text-slate-900 mb-4">
                            {editingId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Plate *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. WP KV-2008"
                                        value={formData.licensePlate}
                                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fuel Type</label>
                                    <select
                                        value={formData.fuelType}
                                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Petrol">Petrol</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Electric">Electric</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Make *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Toyota"
                                        value={formData.make}
                                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Yaris"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manufacture Year</label>
                                    <input
                                        type="number"
                                        min="1950"
                                        max={new Date().getFullYear() + 1}
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Mileage (km)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 85000"
                                        value={formData.mileage}
                                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Customer Full Name"
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner Phone *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="0771234567"
                                        value={formData.ownerPhone}
                                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer"
                                >
                                    {editingId ? 'Save Changes' : 'Register Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vehicles;