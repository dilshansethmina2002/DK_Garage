import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    UserCog, Shield, Wrench, Search, Plus, Edit, Trash2, Phone,
    UserCheck, AlertCircle, ShieldAlert, X
} from 'lucide-react';
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

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        phone: '',
        role: 'Mechanic',
        password: '',
        isActive: true
    });

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser?.role === 'Admin';

    // Helper for Authorization Headers
    const getAuthConfig = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get('http://localhost:5000/api/users', getAuthConfig());
            setUsers(res.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else if (err.response?.status === 403) {
                setError('Access Denied: Only Admins can view and manage user accounts.');
            } else {
                setError(err.response?.data?.message || 'Failed to load user list from server.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            setError('Access Denied: Administrator role required.');
            setLoading(false);
            return;
        }
        fetchUsers();
    }, [isAdmin, navigate]);

    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (u.username || '').toLowerCase().includes(q) ||
            (u.name || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q);
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            username: '',
            name: '',
            phone: '',
            role: 'Mechanic',
            password: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (u) => {
        setEditingId(u._id);
        setFormData({
            username: u.username,
            name: u.name,
            phone: u.phone || '',
            role: u.role,
            password: '', // Blank unless resetting
            isActive: u.isActive !== false
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const payload = { ...formData };

        // If editing and password is empty, strip it from the request body
        if (editingId && (!payload.password || payload.password.trim() === '')) {
            delete payload.password;
        }

        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/users/${editingId}`, payload, getAuthConfig());
            } else {
                await axios.post('http://localhost:5000/api/users', payload, getAuthConfig());
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('User save error details:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to save user account.');
        }
    };

    const handleDelete = async (id) => {
        setError(null);
        try {
            await axios.delete(`http://localhost:5000/api/users/${id}`, getAuthConfig());
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user account.');
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl border-2 border-red-300 max-w-md text-center shadow-lg">
                    <ShieldAlert className="w-12 h-12 text-[#BC0202] mx-auto mb-3" />
                    <h2 className="text-xl font-black text-gray-950">Unauthorized Access</h2>
                    <p className="text-sm text-gray-600 mt-2">
                        The User Management module contains security configurations restricted to Workshop Administrators only.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
                <Wrench className="w-8 h-8 text-gray-700 animate-spin" />
            </div>
        );
    }

    const adminCount = users.filter(u => u.role === 'Admin').length;
    const mechanicCount = users.filter(u => u.role === 'Mechanic').length;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans text-gray-900">

            {/* Header */}
            <div className="bg-white rounded-2xl border-2 border-gray-300 p-5 sm:p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300 mb-2">
                        <Shield className="w-3.5 h-3.5 text-[#BC0202]" />
                        RBAC Access Controls
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">
                        User Management
                    </h1>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                        Configure staff credentials, access permissions, and roles for Admins and Mechanics.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto bg-[#BC0202] hover:bg-[#830000] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#830000]"
                >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                    Create User Account
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl mb-6 flex items-center justify-between text-sm shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span className="font-semibold">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-xs text-red-800 underline font-extrabold cursor-pointer">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-5 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">Total Personnel</span>
                        <h3 className="text-3xl font-black text-slate-950 mt-1">{users.length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 flex items-center justify-center">
                        <UserCog className="w-6 h-6 stroke-[2.2]" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-red-300 shadow-md p-5 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-red-700">Administrators</span>
                        <h3 className="text-3xl font-black text-red-950 mt-1">{adminCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-300 text-[#BC0202] flex items-center justify-center">
                        <Shield className="w-6 h-6 stroke-[2.2]" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-md p-5 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700">Mechanics</span>
                        <h3 className="text-3xl font-black text-blue-950 mt-1">{mechanicCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-300 text-blue-700 flex items-center justify-center">
                        <Wrench className="w-6 h-6 stroke-[2.2]" />
                    </div>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-300 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by username, full name, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border-2 border-gray-300 rounded-lg outline-none focus:border-slate-800 text-sm font-medium"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setSearchQuery(''); setRoleFilter('All'); }}
                        className="py-2 px-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                    >
                        Clear
                    </button>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="py-2 px-3 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold cursor-pointer outline-none focus:border-slate-800"
                    >
                        <option value="All">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Mechanic">Mechanic</option>
                    </select>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredUsers.map((u) => {
                    const isCurrentLoggedIn = currentUser.username?.toLowerCase() === u.username.toLowerCase();

                    return (
                        <div
                            key={u._id}
                            className={`bg-white rounded-2xl border-2 ${u.role === 'Admin' ? 'border-red-300' : 'border-gray-300'
                                } p-5 shadow-sm flex flex-col justify-between relative overflow-hidden`}
                        >
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${u.role === 'Admin' ? 'bg-[#BC0202]' : 'bg-slate-700'
                                }`} />

                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-950 flex items-center gap-2">
                                            {u.name}
                                            {isCurrentLoggedIn && (
                                                <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
                                                    You
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-semibold mt-0.5">@{u.username}</p>
                                    </div>

                                    <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1 ${u.role === 'Admin'
                                            ? 'bg-red-50 text-[#BC0202] border border-red-200'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                        {u.role === 'Admin' ? <Shield className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                                        {u.role}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs text-gray-600 mt-4 pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 font-semibold">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
                                        </span>
                                        <span className="font-bold text-gray-800">{u.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 font-semibold">
                                            <UserCheck className="w-3.5 h-3.5 text-gray-400" /> Status:
                                        </span>
                                        <span className={`font-bold ${u.isActive !== false ? 'text-emerald-700' : 'text-gray-400'}`}>
                                            {u.isActive !== false ? 'Active Account' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 mt-4 border-t-2 border-gray-100 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => openEditModal(u)}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 transition-all cursor-pointer"
                                >
                                    <Edit className="w-3.5 h-3.5" /> Edit / Reset
                                </button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={isCurrentLoggedIn}
                                            title={isCurrentLoggedIn ? 'You cannot delete your own account' : 'Delete Account'}
                                            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-bold transition-all ${isCurrentLoggedIn
                                                    ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                                                    : 'bg-white border-red-200 text-red-600 hover:bg-red-50 cursor-pointer'
                                                }`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                                Delete {u.name}'s Account?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently revoke system access for{' '}
                                                <span className="font-bold text-gray-900">@{u.username}</span> ({u.role}). This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(u._id)}>
                                                Permanently Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>

                        </div>
                    );
                })}

                {filteredUsers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                        No staff accounts found matching your search.
                    </div>
                )}
            </div>

            {/* Add / Edit User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border-2 border-gray-400 w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200 mb-4">
                            <h2 className="text-lg font-black text-gray-950">
                                {editingId ? 'Modify Staff Account' : 'Register New Staff Member'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-950 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Kasun Perera"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Username *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={Boolean(editingId)}
                                    placeholder="e.g. kasun_mech"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                    className={`w-full border-2 rounded-xl p-2.5 outline-none ${editingId
                                            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:border-slate-800'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="0771234567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold outline-none focus:border-slate-800"
                                >
                                    <option value="Mechanic">Mechanic (Restricted to Repairs & Work Orders)</option>
                                    <option value="Admin">Administrator (Full System & User Control)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">
                                    {editingId ? 'Reset Password (leave blank to keep current)' : 'Account Password *'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingId}
                                    placeholder={editingId ? '••••••••' : 'Minimum 6 characters'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors cursor-pointer border border-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-[#BC0202] hover:bg-[#830000] text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer border border-[#830000]"
                                >
                                    {editingId ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;