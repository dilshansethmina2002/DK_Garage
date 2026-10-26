import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Printer, User, Car, Wrench, Clock, FileText, Save,
  Phone, Gauge, Edit3, ShieldAlert
} from 'lucide-react';
import API from '../api';
import { generateJobReceipt } from '../utils/generateJobReceipt';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mechanic's repair log state
  const [notes, setNotes] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await API.get(`/api/jobs/${jobId}`);
        const data = response.data;
        setJob(data);
        setNotes(data.repairNotes || data.notes || '');
        setLaborHours(data.laborHours || '');
      } catch (err) {
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
      await API.put(`/api/jobs/${jobId}/log`, {
        notes,
        laborHours: Number(laborHours) || 0
      });
      alert('Repair log saved successfully!');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        alert(err.response?.data?.message || 'Failed to save the repair log. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    if (job) {
      generateJobReceipt(job);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-800 font-black text-lg animate-pulse">
          <Wrench className="w-6 h-6 text-[#BC0202] animate-spin" />
          Loading Job Card Details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border-2 border-red-300 p-8 rounded-2xl shadow-sm text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-[#BC0202] mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-900 mb-1">Error Loading Job</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <Link
            to="/job-cards"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Job Cards
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const mechanicsList = Array.isArray(job.mechanics) && job.mechanics.length > 0
    ? job.mechanics.join(', ')
    : (job.mechanic || 'Unassigned');

  const customerNameDisplay = job.customer?.name || job.customerName || job.customer || 'N/A';
  const customerPhoneDisplay = job.customer?.phone || job.customerPhone || 'N/A';
  const vehicleMakeDisplay = job.vehicle?.make || job.make || 'N/A';
  const vehicleModelDisplay = job.vehicle?.model || job.model || '';
  const vehiclePlateDisplay = job.vehicle?.licensePlate || job.licensePlate || 'NO-PLATE';
  const vehicleMileageDisplay = job.vehicle?.mileage || job.mileage || 0;
  const reportedIssuesDisplay = job.customerRequests || job.reportedIssues || job.issues || '';

  return (
    <div className="min-h-screen bg-slate-100/80 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/job-cards"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border-2 border-slate-300 text-slate-700 hover:text-slate-950 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Job Card #{job.jobId || job.id || jobId}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${job.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    job.status === 'Awaiting Parts' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      job.status === 'Ready for Pickup' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        job.status === 'Completed' ? 'bg-slate-900 text-white border-slate-900' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Vehicle: {vehicleMakeDisplay} {vehicleModelDisplay} • Plate: {vehiclePlateDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/job-cards/workspace/${job._id || jobId}`}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Edit Workspace
            </Link>
            <button
              onClick={handlePrintReceipt}
              className="bg-[#BC0202] hover:bg-[#830000] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#830000]"
            >
              <Printer className="w-4 h-4" /> Print Customer Bill
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Left Column: Customer & Vehicle Snapshot */}
          <div className="xl:col-span-4 space-y-6">

            {/* Customer Details */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-3 border-b-2 border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-[#BC0202]" /> Customer Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">Customer Name</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{customerNameDisplay}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">Phone Contact</p>
                  <p className="font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customerPhoneDisplay}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-3 border-b-2 border-slate-100 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#BC0202]" /> Vehicle Specifications
              </h2>
              <div className="space-y-3.5 text-sm">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">Make & Model</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {vehicleMakeDisplay} {vehicleModelDisplay}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">License Plate</p>
                  <span className="inline-block mt-1 font-black text-xs px-3 py-1 bg-slate-100 border border-slate-300 text-slate-900 rounded-lg">
                    {vehiclePlateDisplay}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">Odometer Reading</p>
                  <p className="font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    {Number(vehicleMileageDisplay).toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">Allocated Mechanic(s)</p>
                  <p className="font-bold inline-flex items-center gap-1.5 text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg mt-1 text-xs">
                    <Wrench className="w-3.5 h-3.5 text-[#BC0202]" /> {mechanicsList}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Work Order Details & Diagnostic Editor */}
          <div className="xl:col-span-8 space-y-6">

            {/* Customer Reported Problems Box */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-3">
              <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-3 border-b-2 border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#BC0202]" /> Customer Reported Issues & Requested Tasks
              </h2>
              <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl">
                {reportedIssuesDisplay ? (
                  <pre className="font-sans text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-semibold">
                    {reportedIssuesDisplay}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold italic">
                    No customer complaints or specific tasks documented.
                  </p>
                )}
              </div>
            </div>

            {/* Mechanic Diagnostic Notes Editor */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-3 border-b-2 border-slate-100 flex items-center gap-2 mb-6">
                  <Wrench className="w-4 h-4 text-[#BC0202]" /> Workshop Diagnostic & Repair Log
                </h2>

                <div className="space-y-6">
                  {/* Labor Hours Input */}
                  <div>
                    <label className="text-xs font-black uppercase text-slate-600 mb-1.5 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" /> Logged Billable Labor Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={laborHours}
                      onChange={(e) => setLaborHours(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full sm:w-1/3 bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-sm outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>

                  {/* Diagnostic Notes Textarea */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
                      Inspection Notes, Work Completed & Parts Replaced
                    </label>
                    <textarea
                      rows={9}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 p-4 border-2 border-slate-300 rounded-xl font-medium text-xs sm:text-sm text-slate-900 focus:border-slate-800 focus:bg-white outline-none resize-y"
                      placeholder="Document actual mechanical repairs completed, parts replaced, torque specs, scan codes cleared, or upcoming service advisories..."
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t-2 border-slate-100 flex justify-end">
                <button
                  onClick={handleSaveLog}
                  disabled={isSaving}
                  className={`bg-[#BC0202] hover:bg-[#830000] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#830000] ${isSaving ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving Log...' : 'Save Repair Log'}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default JobDetails;