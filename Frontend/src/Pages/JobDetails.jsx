import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Printer, User, Car, Wrench, Clock, FileText, Save, CheckCircle
} from 'lucide-react';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the mechanic's repair log
  const [notes, setNotes] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/jobs/${jobId}`);
        setJob(response.data);

        // If your backend eventually sends existing notes/hours, you'd populate them here:
        setNotes(response.data.notes || '');
        setLaborHours(response.data.laborHours || '');
      } catch (err) {
        console.error("Error fetching job details:", err);
        // Automatically kick out unauthenticated users
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError("Could not load job details. It may have been deleted.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, navigate]);

  const handleSaveLog = async () => {
    setIsSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/jobs/${jobId}/log`, {
        notes: notes,
        laborHours: laborHours
      });

      alert('Repair log saved successfully!');
    } catch (err) {
      console.error("Error saving log:", err);
      // Automatically kick out unauthenticated users
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        alert('Failed to save the repair log. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium animate-pulse flex items-center gap-2">
          <Wrench className="w-5 h-5 animate-spin" /> Loading Job Data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-red-500 font-medium mb-4">{error}</div>
        <Link to="/" className="text-indigo-600 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-900">

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              Job Card: {job.jobId}
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  job.status === 'Awaiting Parts' ? 'bg-amber-100 text-amber-700' :
                    job.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'Completed' ? 'bg-slate-800 text-white' :
                        'bg-slate-200 text-slate-700'}`}
              >
                {job.status}
              </span>
            </h1>
          </div>
        </div>

        <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Details Cards */}
        <div className="lg:col-span-1 space-y-8">

          {/* Customer Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-indigo-500" /> Customer Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</p>
                <p className="font-medium text-slate-800">{job.customer.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</p>
                <p className="font-medium text-slate-800">{job.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Car className="w-5 h-5 text-indigo-500" /> Vehicle Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Make & Model</p>
                <p className="font-medium text-slate-800">{job.vehicle.make} {job.vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">License Plate</p>
                <p className="font-medium text-slate-800">{job.vehicle.licensePlate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Mechanic</p>
                <p className="font-medium inline-flex items-center gap-1 text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md mt-1">
                  <Wrench className="w-3 h-3 text-slate-500" /> {job.mechanic}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Repair Log & Diagnostics */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-indigo-500" /> Repair Log & Diagnostics
            </h2>

            <div className="flex-1 space-y-6">
              {/* Labor Hours Input */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Logged Labor Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full md:w-1/3 border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Diagnostic Notes Textarea */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Inspection Notes & Work Completed
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                  placeholder="Describe the issues found, repairs made, and any parts replaced..."
                ></textarea>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveLog}
                disabled={isSaving}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <>Saving Data...</>
                ) : (
                  <><Save className="w-5 h-5" /> Save Repair Log</>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default JobDetails;