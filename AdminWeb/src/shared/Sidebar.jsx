import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, Calendar, BellRing, FileBarChart, ChevronLeft, ChevronRight, X } from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Users', icon: Users, path: '/users' },
    { name: 'Therapists', icon: UserCog, path: '/therapists' },
    { name: 'Sessions', icon: Calendar, path: '/sessions' },
    { name: 'Notifications', icon: BellRing, path: '/notifications' },
    { name: 'Reports', icon: FileBarChart, path: '/reports' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed lg:relative z-40 flex flex-col items-center py-6 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg shadow-indigo-100/20 transition-all duration-300 ease-in-out h-full
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
        ${!isMobileMenuOpen && isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="w-full flex items-center justify-between px-5 mb-8">
          {(!isCollapsed || isMobileMenuOpen) && <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-500 tracking-tight truncate">TridentAdmin</span>}
          <button 
            onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsCollapsed(!isCollapsed)} 
            className="p-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors mx-auto shadow-sm"
          >
            {isMobileMenuOpen ? <X size={18} strokeWidth={2.5} /> : isCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
          </button>
        </div>
      
      <nav className="flex-1 w-full space-y-1.5 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group relative flex items-center p-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-indigo-600 shadow-md shadow-indigo-200 text-white font-medium' 
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
              } ${isCollapsed ? 'justify-center cursor-pointer' : 'justify-start'}`
            }
          >
            <item.icon size={22} strokeWidth={2} className={`transition-transform duration-300 ${(!isMobileMenuOpen && isCollapsed) ? 'group-hover:scale-110' : ''}`} />
            {(!isCollapsed || isMobileMenuOpen) && <span className="ml-3.5 whitespace-nowrap">{item.name}</span>}
            
            {/* Tooltip for collapsed state */}
            {(!isMobileMenuOpen && isCollapsed) && (
              <div className="absolute left-14 hidden group-hover:block bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="w-full px-4 mt-auto">
        <div className={`p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 transition-all duration-300 ${(!isMobileMenuOpen && isCollapsed) ? 'items-center px-2' : ''}`}>
          {(!isCollapsed || isMobileMenuOpen) && <p className="text-xs font-semibold text-indigo-800 mb-1">System Status</p>}
          <div className="flex items-center justify-center sm:justify-start">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {(!isCollapsed || isMobileMenuOpen) && <span className="text-xs text-slate-600">All services operational</span>}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
