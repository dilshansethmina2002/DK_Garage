import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, ShieldAlert } from 'lucide-react';
import Sidebar from './Sidebar';
import dkLogo from './assets/dk-logo.webp';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col lg:flex-row text-[#000000]">
      
      {/* Mobile Top Header (Visible only on < lg screens) */}
      <header className="lg:hidden bg-[#000000] border-b border-[#830000]/40 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-xl text-neutral-300 hover:text-white hover:bg-[#830000]/30 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="bg-white rounded-lg px-2 py-1 border border-[#BC0202] flex items-center">
          <img 
            src={dkLogo} 
            alt="DK Automobile" 
            className="h-7 w-auto object-contain" 
          />
        </div>

        <div className="w-8 flex justify-end">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000] animate-pulse" title="System Online" />
        </div>
      </header>

      {/* Responsive Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 lg:ml-64 min-w-0 transition-all duration-300">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;