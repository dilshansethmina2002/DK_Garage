import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Pages/Dashboard';
import JobDetails from './Pages/JobDetails';
import Login from './Login';

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
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/job/:jobId" element={<JobDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;