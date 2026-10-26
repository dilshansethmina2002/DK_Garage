import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Car, Wrench, CircleDollarSign, Plus, AlertCircle,
  ChevronRight, Clock, EyeOff, TrendingUp, ShieldAlert,
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import API from '../api';

const Dashboard = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [analyticsView, setAnalyticsView] = useState('revenue'); // 'revenue' | 'profit'

  const navigate = useNavigate();

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

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [activeRes, allRes] = await Promise.all([
        API.get('/api/jobs/active').catch(() => ({ data: [] })),
        API.get('/api/jobs').catch(() => ({ data: [] }))
      ]);

      setActiveJobs(activeRes.data || []);
      setAllJobs(allRes.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError('Failed to load garage dashboard intelligence from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await API.put(`/api/jobs/${jobId}/status`, { status: newStatus });
      setActiveJobs(prev =>
        prev.map(j => (j.id === jobId || j._id === jobId) ? { ...j, status: newStatus } : j)
      );
      setAllJobs(prev =>
        prev.map(j => (j.id === jobId || j._id === jobId) ? { ...j, status: newStatus } : j)
      );
    } catch {
      alert('Failed to update status on server.');
    }
  };

  // Helper to extract clean YYYY-MM-DD from any date string/timestamp
  const toISODate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's Exact Income & Net Profit (Evaluates both line-item work dates and job creation date)
  const todayFinancials = useMemo(() => {
    let billedTotal = 0;
    let actualCostTotal = 0;
    let itemsCount = 0;

    allJobs.forEach(job => {
      const isJobCreatedToday = toISODate(job.jobDate || job.createdAt) === todayStr;

      if (Array.isArray(job.lineItems) && job.lineItems.length > 0) {
        job.lineItems.forEach(item => {
          const itemDate = toISODate(item.date) || (isJobCreatedToday ? todayStr : '');
          if (itemDate === todayStr) {
            const actual = Math.max(0, Number(item.costPrice) || 0);
            const rate = Math.max(0, Number(item.rate) || 0);

            actualCostTotal += actual;
            billedTotal += rate;
            itemsCount++;
          }
        });
      } else if (isJobCreatedToday && job.total) {
        // Fallback if legacy job without lineItems
        billedTotal += Number(job.total) || 0;
      }
    });

    const grossProfit = billedTotal - actualCostTotal;
    const margin = billedTotal > 0 ? ((grossProfit / billedTotal) * 100).toFixed(1) : '0.0';

    return {
      billedTotal,
      actualCostTotal,
      grossProfit,
      margin,
      itemsCount
    };
  }, [allJobs, todayStr]);

  // Precise 7-Day Rolling Revenue & Profit Analytics
  const preciseWeeklyAnalytics = useMemo(() => {
    const daysMap = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const target = new Date(now);
      target.setDate(now.getDate() - i);
      const dateKey = target.toISOString().split('T')[0];
      const shortDay = target.toLocaleDateString('en-US', { weekday: 'short' });

      daysMap.push({
        dateKey,
        name: shortDay,
        revenue: 0,
        cost: 0,
        profit: 0
      });
    }

    allJobs.forEach(job => {
      const fallbackDate = toISODate(job.jobDate || job.createdAt);

      if (Array.isArray(job.lineItems) && job.lineItems.length > 0) {
        job.lineItems.forEach(item => {
          const itemDate = toISODate(item.date) || fallbackDate;
          const targetDay = daysMap.find(d => d.dateKey === itemDate);
          if (targetDay) {
            const actual = Math.max(0, Number(item.costPrice) || 0);
            const charging = Math.max(0, Number(item.rate) || 0);
            targetDay.revenue += charging;
            targetDay.cost += actual;
          }
        });
      } else if (fallbackDate) {
        const targetDay = daysMap.find(d => d.dateKey === fallbackDate);
        if (targetDay && job.total) {
          targetDay.revenue += Number(job.total) || 0;
        }
      }
    });

    daysMap.forEach(d => {
      d.profit = d.revenue - d.cost;
    });

    const total7DayRevenue = daysMap.reduce((acc, curr) => acc + curr.revenue, 0);
    const total7DayProfit = daysMap.reduce((acc, curr) => acc + curr.profit, 0);
    const peakDay = [...daysMap].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      chartData: daysMap,
      total7DayRevenue,
      total7DayProfit,
      peakDay: peakDay || { name: 'N/A', revenue: 0 }
    };
  }, [allJobs]);

  // Live Garage Warnings (Detects actual operational bottlenecks)
  const workshopAlerts = useMemo(() => {
    const alerts = [];
    const nowMs = Date.now();

    // 1. Unassigned Active Jobs
    const unassignedJobs = activeJobs.filter(j => {
      const mechs = Array.isArray(j.mechanics) ? j.mechanics : [j.mechanic].filter(Boolean);
      return mechs.length === 0;
    });
    if (unassignedJobs.length > 0) {
      alerts.push({
        id: 'unassigned',
        type: 'critical',
        title: `${unassignedJobs.length} Vehicle(s) Have No Mechanic Assigned`,
        desc: `Job(s) ${unassignedJobs.map(j => j.id || j.jobId || j._id).slice(0, 3).join(', ')} are idling on the workshop floor without a lead technician.`
      });
    }

    // 2. Delayed Inspections (> 24 hours in Pending Inspection)
    const delayedInspections = activeJobs.filter(j => {
      if (j.status !== 'Pending Inspection') return false;
      const createdMs = new Date(j.createdAt || j.jobDate).getTime();
      return nowMs - createdMs > 24 * 60 * 60 * 1000;
    });
    if (delayedInspections.length > 0) {
      alerts.push({
        id: 'inspection_delay',
        type: 'warning',
        title: `${delayedInspections.length} Inspection(s) Delayed Past 24 Hours`,
        desc: `Vehicles waiting for initial diagnostic writeup. Prioritize immediate inspection.`
      });
    }

    // 3. Vehicles Awaiting Parts
    const awaitingParts = activeJobs.filter(j => j.status === 'Awaiting Parts');
    if (awaitingParts.length > 0) {
      alerts.push({
        id: 'parts_delay',
        type: 'info',
        title: `${awaitingParts.length} Repair(s) Awaiting Spare Parts`,
        desc: `Work paused pending inventory or local supplier delivery for job(s) ${awaitingParts.map(j => j.id || j.jobId || j._id).slice(0, 3).join(', ')}.`
      });
    }

    // 4. Overdue Estimated Delivery
    const overdueJobs = activeJobs.filter(j => {
      if (!j.deliveryDate || j.status === 'Completed') return false;
      return toISODate(j.deliveryDate) < todayStr;
    });
    if (overdueJobs.length > 0) {
      alerts.push({
        id: 'overdue_delivery',
        type: 'critical',
        title: `${overdueJobs.length} Vehicle(s) Past Promised Delivery Date`,
        desc: `Customer promised date has lapsed for ${overdueJobs.map(j => j.vehicle?.licensePlate || j.id || j._id).slice(0, 3).join(', ')}. Action required.`
      });
    }

    return alerts;
  }, [activeJobs, todayStr]);

  const renderMechanicsBadges = (job) => {
    const list = Array.isArray(job.mechanics) && job.mechanics.length > 0
      ? job.mechanics
      : job.mechanic ? String(job.mechanic).split(',').map(s => s.trim()).filter(Boolean)
        : [];

    if (list.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[#BC0202] bg-red-50 border border-red-200 text-[11px] font-black px-2 py-0.5 rounded-md mt-1">
          <AlertCircle className="w-3 h-3" /> Unassigned
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {list.map((mech, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-md"
          >
            <Wrench className="w-2.5 h-2.5 text-slate-500" />
            {mech}
          </span>
        ))}
      </div>
    );
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-100/80 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-red-50 text-[#BC0202] border border-red-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#BC0202] animate-pulse" />
              Live Workshop Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              DK Automobile Control Center
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Logged in as <strong className="text-slate-950 font-bold">{currentUser.username}</strong>
              <span className="text-slate-400 mx-2">•</span>
              <span className="text-slate-700 uppercase font-extrabold text-xs tracking-wider">{currentUser.role || 'Staff'}</span>
              <span className="text-slate-400 mx-2">•</span>
              <span>Today: <strong>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
            </p>
          </div>

          <Link
            to="/job-cards/workspace"
            className="w-full sm:w-auto bg-[#BC0202] hover:bg-[#830000] text-white px-7 py-3 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#830000]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            New Job Card Workspace
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center justify-between text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs text-red-800 underline font-extrabold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Real Live Workshop Warnings */}
        {workshopAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <ShieldAlert className="w-4 h-4 text-[#BC0202]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Actionable Workshop Alerts ({workshopAlerts.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {workshopAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 shadow-xs ${alert.type === 'critical'
                      ? 'bg-red-50/90 border-red-300 text-red-950'
                      : alert.type === 'warning'
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                        : 'bg-blue-50/90 border-blue-300 text-blue-950'
                    }`}
                >
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.type === 'critical' ? 'text-red-600' : alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-tight">{alert.title}</h4>
                    <p className="text-xs font-semibold opacity-90 mt-0.5 leading-snug">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial & Floor KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">

          {/* KPI 1: Today's Billed Revenue */}
          <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-xs p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Today's Billed Income</span>
                <h3 className="text-3xl font-black text-emerald-950 mt-2">
                  LKR {todayFinancials.billedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span>{todayFinancials.itemsCount} Billed Item(s) Today</span>
              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-black text-[11px]">Gross Billed</span>
            </div>
          </div>

          {/* KPI 2: Today's Net Gross Profit */}
          <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xs p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" /> Today's Net Profit
                </span>
                <h3 className={`text-3xl font-black mt-2 ${todayFinancials.grossProfit >= 0 ? 'text-amber-950' : 'text-red-600'}`}>
                  LKR {todayFinancials.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-900 font-bold">
              <span>Actual Cost: LKR {todayFinancials.actualCostTotal.toFixed(0)}</span>
              <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-black text-[11px]">
                {todayFinancials.margin}% Margin
              </span>
            </div>
          </div>

          {/* KPI 3: Vehicles in Workshop */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Active in Workshop</span>
                <h3 className="text-3xl font-black text-slate-950 mt-2">{activeJobs.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 flex items-center justify-center">
                <Car className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-bold">
              <span>{activeJobs.filter(j => j.status === 'In Progress').length} Under Mechanical Repair</span>
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-black text-[11px]">Floor Load</span>
            </div>
          </div>

          {/* KPI 4: Pending Diagnostic Inspection */}
          <div className="bg-white rounded-2xl border-2 border-red-300 shadow-xs p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#BC0202]" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-red-700">Awaiting Inspection</span>
                <h3 className="text-3xl font-black text-red-950 mt-2">
                  {activeJobs.filter(job => job.status === 'Pending Inspection').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-300 text-[#BC0202] flex items-center justify-center">
                <Clock className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-red-100 flex items-center justify-between text-xs text-red-800 font-bold">
              <span>{activeJobs.filter(j => j.status === 'Ready for Pickup').length} Ready for Customer Pickup</span>
              <span className="bg-red-100 text-red-900 px-2 py-0.5 rounded font-black text-[11px]">Priority</span>
            </div>
          </div>

        </div>

        {/* Main Grid: Active Repairs Table & Precise Revenue Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Left Column: Active Repairs Floor Table */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border-2 border-slate-300 overflow-hidden flex flex-col shadow-xs">
            <div className="p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-800" />
                <h2 className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-wide">
                  Active Repairs on Workshop Floor ({activeJobs.length})
                </h2>
              </div>
              <Link
                to="/job-cards"
                className="text-xs font-black text-slate-800 hover:text-black transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs"
              >
                Full Register <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-100/75 text-slate-700 text-xs uppercase font-black tracking-wider">
                    <th className="py-3.5 px-5">Job & Vehicle</th>
                    <th className="py-3.5 px-5">Customer & Mechanics</th>
                    <th className="py-3.5 px-5 text-right">Floor Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeJobs.map((job) => (
                    <tr key={job.id || job._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-5">
                        <Link
                          to={`/job-cards/workspace/${job.id || job.jobId || job._id}`}
                          className="font-black text-slate-900 hover:text-[#BC0202] text-sm hover:underline block"
                        >
                          {job.id || job.jobId || job._id}
                        </Link>
                        <span className="text-slate-800 text-xs font-extrabold mt-0.5 block">
                          {job.vehicle?.make ? `${job.vehicle.make} ${job.vehicle.model || ''}` : (job.vehicle || 'N/A')}
                        </span>
                        <span className="inline-block mt-1 font-black text-[10px] bg-slate-100 border border-slate-300 text-slate-900 px-2 py-0.5 rounded">
                          {job.vehicle?.licensePlate || job.licensePlate || 'NO-PLATE'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-slate-950 font-black">{job.customer?.name || job.customerName || job.customer || 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-semibold">{job.customer?.phone || job.customerPhone || ''}</p>
                        {renderMechanicsBadges(job)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id || job._id, e.target.value)}
                          className={`text-xs font-black px-3 py-1.5 rounded-xl border-2 outline-none cursor-pointer ${job.status === 'In Progress' ? 'bg-blue-50 border-blue-300 text-blue-900' :
                              job.status === 'Awaiting Parts' ? 'bg-amber-50 border-amber-300 text-amber-900' :
                                job.status === 'Ready for Pickup' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                                  job.status === 'Completed' ? 'bg-slate-900 border-slate-900 text-white' :
                                    'bg-white border-slate-300 text-slate-800'
                            }`}
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
            <div className="md:hidden divide-y divide-slate-200">
              {activeJobs.map((job) => (
                <div key={job.id || job._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/job-cards/workspace/${job.id || job.jobId || job._id}`}
                        className="font-black text-slate-900 text-sm hover:underline"
                      >
                        {job.id || job.jobId || job._id}
                      </Link>
                      <p className="text-slate-950 font-bold text-sm">
                        {job.vehicle?.make ? `${job.vehicle.make} ${job.vehicle.model || ''}` : (job.vehicle || 'N/A')}
                      </p>
                      <span className="inline-block mt-0.5 font-black text-[10px] bg-slate-100 border border-slate-300 text-slate-900 px-2 py-0.5 rounded">
                        {job.vehicle?.licensePlate || job.licensePlate || 'NO-PLATE'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 font-medium">
                    Customer: <strong className="text-slate-900">{job.customer?.name || job.customerName || job.customer || 'N/A'}</strong>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Mechanics Assigned:</span>
                    {renderMechanicsBadges(job)}
                  </div>

                  <div className="pt-1">
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.id || job._id, e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-800 outline-none"
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
              <div className="py-16 text-center text-slate-500 text-sm font-bold flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                No active repair cards currently on the floor. All caught up!
              </div>
            )}
          </div>

          {/* Right Column: Precise Rolling 7-Day Revenue Analytics */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border-2 border-slate-300 p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-200 gap-2">
                <div>
                  <h2 className="font-black text-sm text-slate-950 uppercase tracking-wide flex items-center gap-2">
                    <CircleDollarSign className="w-4 h-4 text-emerald-700" />
                    Rolling 7-Day Analytics
                  </h2>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Calculated dynamically from billed jobs</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setAnalyticsView('revenue')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${analyticsView === 'revenue' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-black'
                      }`}
                  >
                    Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsView('profit')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${analyticsView === 'profit' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-black'
                      }`}
                  >
                    Profit
                  </button>
                </div>
              </div>

              {/* Exact Bar Chart */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={preciseWeeklyAnalytics.chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 800 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-white border-2 border-slate-800 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-black text-slate-900 border-b border-slate-100 pb-1">
                                {data.name} ({data.dateKey})
                              </p>
                              <div className="flex justify-between gap-4 font-bold text-slate-700">
                                <span>Billed Revenue:</span>
                                <span className="text-slate-950 font-black">LKR {data.revenue.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between gap-4 font-bold text-slate-600">
                                <span>Actual Cost:</span>
                                <span>LKR {data.cost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between gap-4 font-black border-t border-slate-100 pt-1 text-emerald-700">
                                <span>Gross Margin:</span>
                                <span>LKR {data.profit.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={analyticsView}
                      fill={analyticsView === 'revenue' ? '#0f172a' : '#f59e0b'}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Breakdown Footer */}
            <div className="pt-4 border-t-2 border-slate-200 mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>7-Day Total Billed:</span>
                <span className="font-black text-slate-950">
                  LKR {preciseWeeklyAnalytics.total7DayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>7-Day Net Profit:</span>
                <span className="font-black text-emerald-700">
                  LKR {preciseWeeklyAnalytics.total7DayProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100">
                <span className="text-slate-500">Peak Day ({preciseWeeklyAnalytics.peakDay.name}):</span>
                <span className="font-black text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                  LKR {preciseWeeklyAnalytics.peakDay.revenue.toFixed(0)}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;