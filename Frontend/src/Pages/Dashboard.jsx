import React, { useState } from 'react';

const Dashboard = () => {
  // Mock data - eventually this will come from your Express API
  const [activeJobs, setActiveJobs] = useState([
    { id: 'JC-1042', vehicle: 'Toyota Corolla - WP CAA-1234', customer: 'Kamal Perera', status: 'In Progress', mechanic: 'Nuwan' },
    { id: 'JC-1043', vehicle: 'Honda Civic - WP CB-5521', customer: 'Sarah Silva', status: 'Awaiting Parts', mechanic: 'Ruwan' },
    { id: 'JC-1044', vehicle: 'Nissan Leaf - WP KW-8812', customer: 'Dinuka M.', status: 'Ready for Pickup', mechanic: 'Saman' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Overview Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back. Here is what's happening today.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
          + New Job Card
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Vehicles in Shop</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
          <p className="text-sm text-green-600 mt-2">↑ 2 from yesterday</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Pending Inspections</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">4</p>
          <p className="text-sm text-red-500 mt-2">Requires attention</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Today's Revenue (Est.)</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">Rs. 45,000</p>
          <p className="text-sm text-green-600 mt-2">3 jobs completed</p>
        </div>
      </div>

      {/* Active Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Active Repairs</h2>
          <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</a>
        </div>
        
        <div className="overflow-x-auto">
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                        job.status === 'Awaiting Parts' ? 'bg-orange-100 text-orange-700' : 
                        'bg-green-100 text-green-700'}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;