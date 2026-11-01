import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, DollarSign, Car, Users, Calendar, RefreshCw, AlertCircle
} from 'lucide-react';
import API from '../api';

// Custom colors for charts matching your brand
const COLORS = ['#BC0202', '#0f172a', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

const ReportsDashboard = () => {
    const [valuations, setValuations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Month Range Filters (Format: YYYY-MM)
    const currentYear = new Date().getFullYear();
    const [startMonth, setStartMonth] = useState(`${currentYear}-01`);
    const [endMonth, setEndMonth] = useState(`${currentYear}-12`);

    useEffect(() => {
        const fetchValuations = async () => {
            try {
                setLoading(true);
                const res = await API.get('/api/valuations');
                setValuations(Array.isArray(res.data) ? res.data : res.data.valuations || []);
            } catch (err) {
                setError('Failed to fetch analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchValuations();
    }, []);

    // Filter Data by Month Range
    const filteredData = useMemo(() => {
        if (!startMonth || !endMonth) return valuations;

        const start = new Date(`${startMonth}-01T00:00:00`);
        const end = new Date(`${endMonth}-31T23:59:59`); // Covers end of month

        return valuations.filter(val => {
            const vDate = new Date(val.inspectionDate);
            return vDate >= start && vDate <= end;
        });
    }, [valuations, startMonth, endMonth]);

    // Aggregate Financials & KPIs
    const analytics = useMemo(() => {
        let totalIncome = 0;
        let totalMarketValue = 0;
        const makeCount = {};
        const clientCount = {};
        const monthlyIncome = {};
        const classCount = {};

        filteredData.forEach(val => {
            // Financials
            const valCharge = Number(val.evaluationTab2?.valuationCharge) || 0;
            const travelCharge = Number(val.evaluationTab2?.travelingCharge) || 0;
            const marketVal = Number(val.evaluationTab2?.marketValue) || 0;

            const reportIncome = valCharge + travelCharge;
            totalIncome += reportIncome;
            totalMarketValue += marketVal;

            // Make Distribution
            const make = val.identification?.make?.toUpperCase() || 'UNKNOWN';
            makeCount[make] = (makeCount[make] || 0) + 1;

            // Classification Distribution
            const vClass = val.identification?.classification?.toUpperCase() || 'OTHER';
            classCount[vClass] = (classCount[vClass] || 0) + 1;

            // Client Distribution
            const client = val.opinionProvidedTo?.toUpperCase() || 'UNKNOWN';
            clientCount[client] = (clientCount[client] || 0) + 1;

            // Monthly Trend (Format: YYYY-MM)
            const monthKey = val.inspectionDate ? val.inspectionDate.substring(0, 7) : 'Unknown';
            if (!monthlyIncome[monthKey]) {
                monthlyIncome[monthKey] = { month: monthKey, income: 0, reports: 0 };
            }
            monthlyIncome[monthKey].income += reportIncome;
            monthlyIncome[monthKey].reports += 1;
        });

        // Format for Recharts
        const trendData = Object.values(monthlyIncome).sort((a, b) => a.month.localeCompare(b.month));
        const makeData = Object.keys(makeCount).map(key => ({ name: key, count: makeCount[key] })).sort((a, b) => b.count - a.count).slice(0, 6);
        const classData = Object.keys(classCount).map(key => ({ name: key, value: classCount[key] }));

        // Top Client
        const topClient = Object.keys(clientCount).sort((a, b) => clientCount[b] - clientCount[a])[0] || 'N/A';

        return { totalIncome, totalMarketValue, topClient, trendData, makeData, classData, reportCount: filteredData.length };
    }, [filteredData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-800 font-bold animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#BC0202] animate-spin" /> Loading Analytics...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100/90 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header & Date Filters */}
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-[#BC0202]" /> Financial & Analytics Dashboard
                        </h1>
                        <p className="text-sm font-bold text-slate-500 mt-1">Track income, report volume, and business metrics.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <Calendar className="w-5 h-5 text-slate-400 ml-2" />
                        <div className="flex items-center gap-2">
                            <input
                                type="month"
                                value={startMonth}
                                onChange={e => setStartMonth(e.target.value)}
                                className="bg-white border-2 border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-slate-800"
                            />
                            <span className="text-slate-400 font-bold">to</span>
                            <input
                                type="month"
                                value={endMonth}
                                onChange={e => setEndMonth(e.target.value)}
                                className="bg-white border-2 border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-slate-800"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                        <AlertCircle className="w-5 h-5 text-red-600" /> {error}
                    </div>
                )}

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-100 rounded-full opacity-50 pointer-events-none"></div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Total Income (LKR)</p>
                        <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                            Rs. {analytics.totalIncome.toLocaleString('en-US')}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">Sum of Valuation + Travel Charges</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-100 rounded-full opacity-50 pointer-events-none"></div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Reports Generated</p>
                        <h3 className="text-3xl font-black text-slate-900">{analytics.reportCount}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">In selected date range</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-100 rounded-full opacity-50 pointer-events-none"></div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Total Market Value Inspected</p>
                        <h3 className="text-2xl font-black text-slate-900">
                            Rs. {analytics.totalMarketValue >= 1000000 ? (analytics.totalMarketValue / 1000000).toFixed(2) + ' M' : analytics.totalMarketValue.toLocaleString('en-US')}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">Cumulative value of all vehicles</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-100 rounded-full opacity-50 pointer-events-none"></div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Top Client / Bank</p>
                        <h3 className="text-lg font-black text-slate-900 leading-tight truncate mt-1" title={analytics.topClient}>
                            {analytics.topClient}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">Most frequent requester</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Monthly Income Line Chart */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs">
                        <h4 className="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-[#BC0202]" /> Monthly Income Trend
                        </h4>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <LineChart data={analytics.trendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `Rs ${val / 1000}k`} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '2px solid #cbd5e1' }}
                                        formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Income']}
                                    />
                                    <Line type="monotone" dataKey="income" stroke="#BC0202" strokeWidth={4} dot={{ r: 4, fill: '#BC0202', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Vehicle Makes Bar Chart */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs">
                        <h4 className="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
                            <Car className="w-5 h-5 text-blue-600" /> Top Evaluated Brands
                        </h4>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <BarChart data={analytics.makeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#0f172a' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '2px solid #cbd5e1' }}
                                    />
                                    <Bar dataKey="count" fill="#0f172a" radius={[0, 6, 6, 0]}>
                                        {analytics.makeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#BC0202' : '#0f172a'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vehicle Classification Distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs lg:col-span-2">
                        <h4 className="text-sm font-black uppercase text-slate-800 mb-2 flex items-center gap-2">
                            <Users className="w-5 h-5 text-amber-600" /> Vehicle Classification Distribution
                        </h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={analytics.classData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelStyle={{ fontSize: '10px', fontWeight: 'bold', fill: '#0f172a' }}
                                    >
                                        {analytics.classData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '2px solid #cbd5e1' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;