import React from 'react';
import { Users, UserCog, CalendarDays, TrendingUp, Activity, ShieldCheck } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${colorClass}`} />
    
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-opacity-90`}>
        <Icon size={24} strokeWidth={2} />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
          <TrendingUp size={14} className="mr-1" /> {trend}
        </span>
      )}
    </div>
    
    <div>
      <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
      <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-2">Monitor platform activity and growth metrics in real-time.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Patients Active" 
          value="1,024" 
          icon={Users} 
          trend="+12.5%" 
          colorClass="bg-blue-500 text-blue-600"
        />
        <StatCard 
          title="Verified Therapists" 
          value="156" 
          icon={UserCog} 
          trend="+4.2%" 
          colorClass="bg-indigo-500 text-indigo-600"
        />
        <StatCard 
          title="Sessions Today" 
          value="42" 
          icon={CalendarDays} 
          colorClass="bg-emerald-500 text-emerald-600"
        />
        <StatCard 
          title="Server Health" 
          value="99.9%" 
          icon={Activity} 
          colorClass="bg-rose-500 text-rose-600"
        />
        <StatCard 
          title="Security Alerts" 
          value="0 Issues" 
          icon={ShieldCheck} 
          colorClass="bg-amber-500 text-amber-600"
        />
      </div>
    </div>
  );
};

export default Dashboard;
