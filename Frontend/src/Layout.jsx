import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* The main content area gets pushed 64 units (16rem) to the right to make room for the fixed sidebar */}
      <div className="flex-1 ml-64">
        {/* Outlet is where React Router injects the specific page content (Dashboard, Job Cards, etc.) */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;