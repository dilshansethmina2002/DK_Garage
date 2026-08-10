import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New states for the Modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    make: '',
    model: '',
    licensePlate: '',
    mechanic: ''
  });

  // Fetch jobs function (separated so we can call it again after adding a new job)
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/jobs/active');
      setActiveJobs(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load active jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle input changes in the form
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit the new job card to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jobs', formData);
      setIsModalOpen(false); // Close the modal
      setFormData({ customerName: '', customerPhone: '', make: '', model: '', licensePlate: '', mechanic: '' }); // Clear form
      fetchJobs(); // Refresh the table to show the new job
    } catch (err) {
      console.error("Error submitting job:", err);
      alert("Failed to create job card. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans relative">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Overview Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back. Here is what's happening today.</p>
        </div>
        {/* Updated Button to open modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          + New Job Card
        </button>
      </div>

      {/* --- Rest of your Metrics Cards and Table go here (kept same as before) --- */}
      {/* Active Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Active Repairs</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading live data from server...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : activeJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active jobs found in the database.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Job ID</th>
                  <th className="px-6 py-3 font-medium">Vehicle</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Mechanic</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeJobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{job.id}</td>
                    <td className="px-6 py-4 text-gray-600">{job.vehicle}</td>
                    <td className="px-6 py-4 text-gray-600">{job.customer}</td>
                    <td className="px-6 py-4 text-gray-600">{job.mechanic}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- NEW: Modal Form Overlay --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Create New Job Card</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input type="text" name="customerName" required value={formData.customerName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                  <input type="text" name="customerPhone" required value={formData.customerPhone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make</label>
                    <input type="text" name="make" placeholder="e.g. Toyota" required value={formData.make} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                    <input type="text" name="model" placeholder="e.g. Corolla" required value={formData.model} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input type="text" name="licensePlate" required value={formData.licensePlate} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Mechanic</label>
                  <input type="text" name="mechanic" required value={formData.mechanic} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">
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