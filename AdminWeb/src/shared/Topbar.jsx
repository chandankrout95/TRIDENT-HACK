import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, UserCircle, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutAdmin } from '../features/auth/authSlice';

const Topbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm shadow-slate-100/50 gap-4">
      {/* Search & Menu Toggle */}
      <div className="flex items-center flex-1 lg:w-1/3 gap-3">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl transition-all"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center flex-1 md:flex-none md:w-72 bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200/50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
          <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search global records..." 
            className="bg-transparent outline-none w-full text-sm text-slate-700 placeholder:text-slate-400 hidden sm:block"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-5">
        <button className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-1 ring-white"></span>
        </button>
        
        <div className="relative border-l border-slate-200 pl-5" ref={dropdownRef}>
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
               <UserCircle size={24} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-tight">Admin User</p>
              <p className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider">Superadmin</p>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up origin-top-right">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">admin@trident.com</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center text-left px-3 py-2.5 text-sm text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={16} className="mr-2.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
