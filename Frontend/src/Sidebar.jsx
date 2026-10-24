import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Car,
  Users,
  BarChart3,
  CreditCard,
  UserCog,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';
import dkLogo from './assets/dk-logo.webp';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    currentUser = {};
  }

  const isAdmin = currentUser?.role === 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    if (onClose) onClose();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Job Cards', path: '/job-cards', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Inventory', path: '/inventory', icon: <Package className="w-5 h-5" /> },
    { name: 'Vehicles', path: '/vehicles', icon: <Car className="w-5 h-5" /> },
    { name: 'Customers', path: '/customers', icon: <Users className="w-5 h-5" /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Payments', path: '/finance', icon: <CreditCard className="w-5 h-5" /> },
    // Only visible to workshop Administrators
    ...(isAdmin ? [{ name: 'User Management', path: '/users', icon: <UserCog className="w-5 h-5" /> }] : [])
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#000000]/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#000000] text-neutral-300 flex flex-col border-r border-[#830000]/40 z-50 transition-transform duration-300 ease-in-out select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Seamless Blended Logo Header */}
        <div className="p-4 border-b border-[#830000]/40 flex items-center justify-between">
          <div className="flex-1 flex items-center justify-center mr-2 py-1">
            <img
              src={dkLogo}
              alt="DK Automobile"
              className="h-12 w-auto object-contain mix-blend-screen brightness-110 contrast-125"
              draggable="false"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-[#830000]/30 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                  ? 'bg-[#BC0202] text-white shadow-lg shadow-[#FF0000]/20 border border-[#FF0000]/40'
                  : 'text-neutral-400 hover:bg-[#830000]/25 hover:text-white border border-transparent hover:border-[#830000]/50'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Info & Sign Out Section */}
        <div className="p-4 border-t border-[#830000]/40 bg-[#000000] space-y-3">
          {currentUser?.username && (
            <div className="px-3 py-2 rounded-xl bg-neutral-900/90 border border-[#830000]/40 flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-extrabold text-white truncate">
                  {currentUser.username}
                </p>
                <p className="text-[11px] text-[#FF0000] font-semibold">
                  {currentUser.role || 'Staff'}
                </p>
              </div>
              <ShieldCheck className="w-4 h-4 text-[#BC0202] shrink-0" />
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#830000]/40 hover:bg-[#BC0202] active:bg-[#830000] border border-[#BC0202]/60 hover:border-[#FF0000] shadow-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;