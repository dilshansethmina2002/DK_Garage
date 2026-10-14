import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Car, 
  Users, 
  BarChart3, 
  CreditCard, 
  UserCog,
  Wrench
} from 'lucide-react';

const Sidebar = () => {
  // Navigation links mapping directly to your 9 modules
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Job Cards', path: '/job-cards', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Job Card Workspace', path: '/job-cards/workspace', icon: <Wrench className="w-5 h-5" /> },
    { name: 'Inventory', path: '/inventory', icon: <Package className="w-5 h-5" /> },
    { name: 'Vehicles', path: '/vehicles', icon: <Car className="w-5 h-5" /> },
    { name: 'Customers', path: '/customers', icon: <Users className="w-5 h-5" /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Payments', path: '/finance', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'User Management', path: '/users', icon: <UserCog className="w-5 h-5" /> },
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 flex flex-col fixed left-0 top-0">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 bg-slate-950 text-white font-bold text-xl gap-2 border-b border-slate-800">
        <div className="bg-indigo-500 p-1.5 rounded-lg">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        Garage OS
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;