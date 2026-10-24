import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Car, Wrench, CircleDollarSign, Plus, Activity, AlertCircle,
  Package, Users, ClipboardList, X, ChevronRight, Clock, ArrowUpRight,
  UserCheck, Check, ChevronDown, Search, FileText, Sparkles
} from 'lucide-react';

const weeklyRevenue = [
  { name: 'Mon', revenue: 45000 },
  { name: 'Tue', revenue: 52000 },
  { name: 'Wed', revenue: 38000 },
  { name: 'Thu', revenue: 65000 },
  { name: 'Fri', revenue: 48000 },
  { name: 'Sat', revenue: 85000 },
  { name: 'Sun', revenue: 30000 },
];

const commonIssues = [
  'Regular Service & Oil Change',
  'Brake Pad Replacement / Noise',
  'AC Not Cooling',
  'Engine Check Light On',
  'Suspension Knocking',
  'Wheel Alignment & Balance'
];

const Dashboard = () => {
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Registered mechanics from DB
  const [registeredMechanics, setRegisteredMechanics] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mechSearch, setMechSearch] = useState('');
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    make: '',
    model: '',
    licensePlate: '',
    customerRequests: ''
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      setCurrentUser(JSON.parse(userStr));
    } catch {
      navigate('/login');
      return;
    }

    fetchJobs();
    fetchRegisteredMechanics();
  }, [navigate]);

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

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/jobs/active', getAuthConfig());
      setActiveJobs(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError("Failed to load active repairs from server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredMechanics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/mechanics', getAuthConfig());
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRegisteredMechanics(res.data);
      } else {
        const fallbackRes = await axios.get('http://localhost:5000/api/users', getAuthConfig());
        const filtered = (fallbackRes.data || []).filter(u =>
          String(u.role).toLowerCase() === 'mechanic'
        );
        setRegisteredMechanics(filtered);
      }
    } catch {
      try {
        const fallbackRes = await axios.get('http://localhost:5000/api/users', getAuthConfig());
        const filtered = (fallbackRes.data || []).filter(u =>
          String(u.role).toLowerCase() === 'mechanic'
        );
        setRegisteredMechanics(filtered);
      } catch (fallbackErr) {
        console.warn("Could not load mechanics list:", fallbackErr);
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addQuickIssue = (issue) => {
    setFormData(prev => ({
      ...prev,
      customerRequests: prev.customerRequests
        ? `${prev.customerRequests.trim()}\n• ${issue}`
        : `• ${issue}`
    }));
  };

  const toggleMechanicSelection = (mechanicName) => {
    if (selectedMechanics.includes(mechanicName)) {
      setSelectedMechanics(selectedMechanics.filter(m => m !== mechanicName));
    } else {
      setSelectedMechanics([...selectedMechanics, mechanicName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMechanics.length === 0) {
      alert("Please select at least one registered mechanic.");
      return;
    }

    const payload = {
      ...formData,
      mechanics: selectedMechanics,
      mechanic: selectedMechanics.join(', ')
    };

    try {
      await axios.post('http://localhost:5000/api/jobs', payload, getAuthConfig());
      setIsModalOpen(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        make: '',
        model: '',
        licensePlate: '',
        customerRequests: ''
      });
      setSelectedMechanics([]);
      setMechSearch('');
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create job card.");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/jobs/${jobId}/status`, { status: newStatus }, getAuthConfig());
      setActiveJobs(activeJobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch {
      alert("Failed to update status.");
    }
  };

  const renderMechanicsBadges = (job) => {
    const list = Array.isArray(job.mechanics) && job.mechanics.length > 0
      ? job.mechanics
      : job.mechanic ? String(job.mechanic).split(',').map(s => s.trim()).filter(Boolean)
        : [];

    if (list.length === 0) {
      return <span className="text-gray-400 italic text-xs">Unassigned</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {list.map((mech, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-800 text-[11px] font-bold px-2 py-0.5 rounded-md"
          >
            <Wrench className="w-2.5 h-2.5 text-gray-500" />
            {mech}
          </span>
        ))}
      </div>
    );
  };

  const filteredRegisteredMechanics = registeredMechanics.filter(m =>
    (m.name || '').toLowerCase().includes(mechSearch.toLowerCase()) ||
    (m.username || '').toLowerCase().includes(mechSearch.toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans text-gray-900">

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-300 p-5 sm:p-6 mb-6 sm:mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Live
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">
            DK Automobile Dashboard
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            Logged in as <strong className="text-gray-950 font-bold">{currentUser.username}</strong>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-700 uppercase font-extrabold text-xs tracking-wider">{currentUser.role || 'Staff'}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              customerName: '',
              customerPhone: '',
              make: '',
              model: '',
              licensePlate: '',
              customerRequests: ''
            });
            setSelectedMechanics([]);
            setMechSearch('');
            setIsModalOpen(true);
            fetchRegisteredMechanics();
          }}
          className="w-full sm:w-auto bg-[#BC0202] hover:bg-[#830000] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#830000]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          New Job Card
        </button>
      </div>

      {/* Error Alert */}
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

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Vehicles in Workshop</span>
              <h3 className="text-4xl font-black text-slate-950 mt-2">{activeJobs.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 flex items-center justify-center shadow-inner">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Current Floor Occupancy</span>
            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">Pending Inspections</span>
              <h3 className="text-4xl font-black text-amber-950 mt-2">
                {activeJobs.filter(job => job.status === 'Pending Inspection').length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Requires Diagnostics</span>
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">Priority</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-md p-6 flex flex-col justify-between relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Estimated Target</span>
              <h3 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-2">LKR 45,000</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-inner">
              <CircleDollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span>Daily Projection</span>
            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">Revenue</span>
          </div>
        </div>
      </div>

      {/* Operations Quick Menu */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3 px-1">
          Operations & Modules
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/job-cards/workspace"
            className="p-5 rounded-2xl bg-white border-2 border-gray-300 shadow-sm hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center border border-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <ClipboardList className="w-6 h-6 stroke-[2.2]" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-950 transition-colors" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-950">Job Workspace</h3>
              <p className="text-gray-600 text-xs hidden sm:block mt-1">Open repairs editor</p>
            </div>
          </Link>

          <Link
            to="/vehicles"
            className="p-5 rounded-2xl bg-white border-2 border-gray-300 shadow-sm hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center border border-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <Car className="w-6 h-6 stroke-[2.2]" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-950 transition-colors" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-950">Vehicles</h3>
              <p className="text-gray-600 text-xs hidden sm:block mt-1">Database & history</p>
            </div>
          </Link>

          <Link
            to="/inventory"
            className="p-5 rounded-2xl bg-white border-2 border-gray-300 shadow-sm hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center border border-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <Package className="w-6 h-6 stroke-[2.2]" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-950 transition-colors" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-950">Spare Parts</h3>
              <p className="text-gray-600 text-xs hidden sm:block mt-1">Stock balance</p>
            </div>
          </Link>

          <Link
            to="/customers"
            className="p-5 rounded-2xl bg-white border-2 border-gray-300 shadow-sm hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center border border-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-950 transition-colors" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-950">Customers</h3>
              <p className="text-gray-600 text-xs hidden sm:block mt-1">Contacts list</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Grid: Active Repairs & Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* Left Column: Active Repairs */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border-2 border-gray-300 overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 sm:p-5 border-b-2 border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-gray-800" />
              <h2 className="font-black text-sm sm:text-base text-gray-950 uppercase tracking-wide">
                Active Repairs on Floor
              </h2>
            </div>
            <Link
              to="/job-cards"
              className="text-xs font-black text-slate-800 hover:text-black transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-xs"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-100/75 text-gray-700 text-xs uppercase font-black tracking-wider">
                  <th className="py-3.5 px-5">Job Details</th>
                  <th className="py-3.5 px-5">Customer & Assigned Mechanics</th>
                  <th className="py-3.5 px-5 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <Link
                        to={`/job-cards/workspace/${job.id}`}
                        className="font-black text-slate-900 hover:text-[#BC0202] text-sm hover:underline block"
                      >
                        {job.id}
                      </Link>
                      <span className="text-gray-700 text-xs font-bold mt-0.5 block">
                        {job.vehicle}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-gray-950 font-extrabold">{job.customer}</p>
                      {renderMechanicsBadges(job)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-gray-300 bg-white text-gray-800 outline-none cursor-pointer focus:border-slate-800"
                      >
                        <option value="Pending Inspection">Pending Inspection</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Awaiting Parts">Awaiting Parts</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-gray-200">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/job-cards/workspace/${job.id}`}
                      className="font-black text-slate-900 text-sm hover:underline"
                    >
                      {job.id}
                    </Link>
                    <p className="text-gray-950 font-bold text-sm">{job.vehicle}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  Customer: <strong className="text-gray-900">{job.customer}</strong>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Mechanics Assigned:</span>
                  {renderMechanicsBadges(job)}
                </div>

                <div className="pt-1">
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-800 outline-none"
                  >
                    <option value="Pending Inspection">Pending Inspection</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Parts">Awaiting Parts</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {activeJobs.length === 0 && !loading && (
            <div className="py-12 text-center text-gray-500 text-sm font-semibold">
              No active repair cards currently registered.
            </div>
          )}
        </div>

        {/* Right Column: Weekly Revenue Chart */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border-2 border-gray-300 p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h2 className="font-black text-sm text-gray-950 uppercase tracking-wide flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-emerald-700" />
                Revenue Analytics
              </h2>
              <span className="text-xs font-black text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-300">
                LKR
              </span>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenue} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={false}
                    tick={{ fill: '#374151', fontSize: 11, fontWeight: 700 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '2px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-200 mt-4 flex items-center justify-between text-xs text-gray-600 font-semibold">
            <span>Peak: <strong className="text-gray-900">Saturday</strong></span>
            <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              LKR 85,000
            </span>
          </div>
        </div>

      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border-2 border-gray-400 p-6 max-h-[92vh] overflow-y-auto shadow-2xl">

            <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200 mb-4">
              <h2 className="text-lg font-black text-gray-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#BC0202]" /> Create Job Card
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-950 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="e.g. Ruwan Silva"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="customerPhone"
                    required
                    placeholder="0771234567"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    name="make"
                    required
                    placeholder="Toyota"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    required
                    placeholder="Yaris"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    required
                    placeholder="WP KV-2008"
                    value={formData.licensePlate}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 uppercase font-black outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* REPORTED ISSUES / CUSTOMER REQUESTS AREA */}
              <div className="bg-gray-50 border-2 border-gray-200 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#BC0202]" />
                    Customer Request & Issues Reported *
                  </label>
                  <span className="text-[11px] text-gray-500 font-semibold">Tap to auto-insert</span>
                </div>

                {/* Quick select tags */}
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
                  name="customerRequests"
                  required
                  rows={3}
                  placeholder="Detail the issues reported by customer (e.g. Brake noise when stopping, engine hesitation at 60km/h, routine oil change)..."
                  value={formData.customerRequests}
                  onChange={handleInputChange}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-gray-900 outline-none focus:border-slate-800 resize-none text-xs sm:text-sm font-medium"
                />
              </div>

              {/* REGISTERED MECHANICS DROPDOWN & TAG PICKER */}
              <div className="relative" ref={dropdownRef}>
                <label className="block font-bold text-gray-700 mb-1">
                  Assign Registered Mechanics *
                </label>

                {/* Selected Mechanics Badges Area */}
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full min-h-[46px] p-2 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:border-slate-800 transition-colors"
                >
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {selectedMechanics.map((name) => (
                      <span
                        key={name}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMechanicSelection(name);
                        }}
                        className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs group"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {name}
                        <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400" />
                      </span>
                    ))}
                    {selectedMechanics.length === 0 && (
                      <span className="text-gray-400 text-xs py-1 px-1">
                        Select registered mechanic(s)...
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Searchable Dropdown Popup */}
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-gray-300 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search registered staff..."
                        value={mechSearch}
                        onChange={(e) => setMechSearch(e.target.value)}
                        className="w-full bg-transparent text-xs outline-none text-gray-800 font-medium"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {filteredRegisteredMechanics.map((m) => {
                        const isSelected = selectedMechanics.includes(m.name);
                        return (
                          <div
                            key={m._id}
                            onClick={() => toggleMechanicSelection(m.name)}
                            className={`p-2.5 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${isSelected
                              ? 'bg-slate-100 text-slate-900'
                              : 'hover:bg-gray-50 text-gray-700'
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

                      {filteredRegisteredMechanics.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400 font-medium">
                          No registered mechanics found. Add mechanics in User Management first.
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;