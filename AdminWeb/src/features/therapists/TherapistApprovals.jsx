import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient';

const TherapistApprovals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
// TherapistApprovals.jsx chunk 1
  useEffect(() => {
    apiClient.get('/admin/therapists/pending')
      .then(res => {
        const pending = res.data.filter(t => !t.isApproved);
        setTherapists(pending);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

// TherapistApprovals.jsx chunk 2
  const handleApprove = async (id) => {
    try {
      await apiClient.patch(`/admin/therapists/${id}/approve`);
      setTherapists(therapists.filter(t => t._id !== id));
      alert('Therapist Approved');
    } catch(err) {
      alert('Failed to approve');
    }
  };

// TherapistApprovals.jsx chunk 3
  const handleReject = async (id) => {
    try {
      if(window.confirm('Are you sure you want to reject and delete this application?')) {
        await apiClient.delete(`/admin/therapists/${id}/reject`);
        setTherapists(therapists.filter(t => t._id !== id));
      }
    } catch(err) {
      alert('Failed to reject');
    }
  };

  const filtered = therapists.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-lg shadow-slate-200/50 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Therapist Approvals</h2>
          <p className="text-sm text-slate-500 mt-1">Review and manage pending provider applications.</p>
        </div>
        
        <div className="flex bg-slate-100/80 px-4 py-2.5 rounded-xl items-center w-full sm:w-80 border border-slate-200/50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search name, specialization, or license..." 
            className="bg-transparent outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white/40">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/60">
              <th className="py-4 px-6 font-semibold rounded-tl-xl">Name & Email</th>
              <th className="py-4 px-6 font-semibold">Specialization</th>
              <th className="py-4 px-6 font-semibold">Experience</th>
              <th className="py-4 px-6 font-semibold">License #</th>
              <th className="py-4 px-6 font-semibold">Application Date</th>
              <th className="py-4 px-6 font-semibold text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan="6" className="text-center py-4"><Loader2 className="inline-block animate-spin mr-2" size={20} />Loading applications...</td></tr>
            ) : filtered.map(t => (
              <tr key={t._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-semibold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400 font-medium">{t.user?.email || 'N/A'}</div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {t.specialization}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-600 font-medium">{t.experience || 'N/A'}</td>
                <td className="py-4 px-6 text-slate-500 font-mono text-xs">{t.licenseNumber}</td>
                <td className="py-4 px-6 text-slate-500 font-medium">{new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleApprove(t._id)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all mr-2 shadow-sm" title="Approve">
                    <CheckCircle size={18} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleReject(t._id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm" title="Reject">
                    <XCircle size={18} strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">No applications pending approval.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TherapistApprovals;
