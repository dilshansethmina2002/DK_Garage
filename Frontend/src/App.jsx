import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import Dashboard from './Pages/Dashboard';
import JobDetails from './Pages/JobDetails';
import Login from './Login';
import JobCardsList from './Pages/JobCardsList';
import JobCardWorkspace from './Pages/JobCardWorkspace';
import Vehicles from './Pages/Vehicles';

// --- AXIOS INTERCEPTOR ---
// This automatically attaches the JWT to every single request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
// -------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - No Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Wrapped in Sidebar Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/job-cards" element={<JobCardsList />} />
          <Route path="/job-cards/workspace" element={<JobCardWorkspace />} />
          <Route path="/job-cards/workspace/:jobId" element={<JobCardWorkspace />} />
          <Route path="/job/:jobId" element={<JobDetails />} />
          <Route path="/inventory" element={<div className="p-8 font-bold text-xl">Inventory Coming Soon</div>} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/customers" element={<div className="p-8 font-bold text-xl">Customers Coming Soon</div>} />
          <Route path="/reports" element={<div className="p-8 font-bold text-xl">Reports Coming Soon</div>} />
          <Route path="/finance" element={<div className="p-8 font-bold text-xl">Finance Coming Soon</div>} />
          <Route path="/users" element={<div className="p-8 font-bold text-xl">User Management Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;