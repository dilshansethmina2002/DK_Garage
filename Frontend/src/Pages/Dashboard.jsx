import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
// Add Package, Users, FileText, and Settings to your existing imports
import {
  Car, Wrench, CircleDollarSign, Plus, Activity, AlertCircle, LogOut, User,
  Package, Users, FileText, Settings
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

const Dashboard = () => {
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', make: '', model: '', licensePlate: '', mechanic: ''
  });

  // 1. Check Authentication on Load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login'); // Kick them out if not logged in
      return;
    }

    setCurrentUser(JSON.parse(userStr));
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/jobs/active');
      setActiveJobs(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout(); // Token expired
      } else {
        setError("Failed to load active jobs.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jobs', formData);
      setIsModalOpen(false);
      setFormData({ customerName: '', customerPhone: '', make: '', model: '', licensePlate: '', mechanic: '' });
      fetchJobs();
    } catch (err) {
      alert("Failed to create job card. Make sure you have Admin permissions.");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/jobs/${jobId}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  if (!currentUser) return null; // Prevent flash of dashboard before redirect

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-900">

      {/* Top Navigation / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            System operational | Welcome, {currentUser.username}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Job Card
          </button>

          <button
            onClick={handleLogout}
            className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Vehicles in Shop</p>
            <h3 className="text-3xl font-bold text-slate-800">{activeJobs.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Inspections</p>
            <h3 className="text-3xl font-bold text-slate-800">
              {activeJobs.filter(job => job.status === 'Pending Inspection').length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Est. Daily Revenue</p>
            <h3 className="text-3xl font-bold text-slate-800">LKR 45,000</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- QUICK NAVIGATION GRID --- */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Link to="/inventory" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 group hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-xl flex items-center justify-center transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">Parts Inventory</span>
          </Link>

          <Link to="/invoices" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 group hover:shadow-md hover:border-emerald-200 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-xl flex items-center justify-center transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">Invoices</span>
          </Link>

          <Link to="/customers" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 group hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-xl flex items-center justify-center transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">Customers</span>
          </Link>

          <Link to="/settings" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 group hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-800 rounded-xl flex items-center justify-center transition-colors">
              <Settings className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Settings</span>
          </Link>

        </div>
      </div>
      {/* ----------------------------- */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Active Jobs Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-500" /> Active Repairs
            </h2>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold">Job Details</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {activeJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link to={`/job/${job.id}`} className="font-bold text-indigo-600 hover:text-indigo-800 group-hover:underline">
                          {job.id}
                        </Link>
                        <span className="text-slate-500 mt-0.5">{job.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{job.customer}</span>
                        <span className="text-slate-400 text-xs mt-0.5">Assigned to: {job.mechanic}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer outline-none transition-all appearance-none text-center
                          ${job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            job.status === 'Awaiting Parts' ? 'bg-amber-100 text-amber-700' :
                              job.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-700'}`}
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
        </div>

        {/* Right Column: Analytics Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-emerald-500" /> Revenue This Week
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Create New Job Card</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input type="text" name="customerName" required value={formData.customerName} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Phone</label>
                  <input type="text" name="customerPhone" required value={formData.customerPhone} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Make</label>
                    <input type="text" name="make" placeholder="e.g. Toyota" required value={formData.make} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Model</label>
                    <input type="text" name="model" placeholder="e.g. Corolla" required value={formData.model} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                  <input type="text" name="licensePlate" required value={formData.licensePlate} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Mechanic</label>
                  <input type="text" name="mechanic" required value={formData.mechanic} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors">
                  Save Job Card
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