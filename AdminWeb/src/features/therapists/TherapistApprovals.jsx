import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Loader2, UserCheck, Clock, Eye, Bell } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { initiateAdminSocket, getAdminSocket, disconnectAdminSocket } from '../../services/socket';

const TherapistApprovals = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTherapists, setActiveTherapists] = useState([]);
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newApplicationAlert, setNewApplicationAlert] = useState(false);

  // Fetch data
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiClient.get('/admin/therapists'),
      apiClient.get('/admin/therapist-requests'),
    ])
      .then(([activeRes, pendingRes]) => {
        setActiveTherapists(activeRes.data);
        setPendingTherapists(pendingRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Socket.io realtime updates
  useEffect(() => {
    const socket = initiateAdminSocket();

    socket.on('therapist_application_created', (data) => {
      setNewApplicationAlert(true);
      // Refresh pending list
      apiClient.get('/admin/therapist-requests')
        .then(res => setPendingTherapists(res.data))
        .catch(err => console.error(err));
      setTimeout(() => setNewApplicationAlert(false), 5000);
    });

    return () => {
      socket.off('therapist_application_created');
    };
  }, []);

  const handleApprove = async (id) => {
    setIsActionLoading(true);
    try {
      await apiClient.post(`/admin/approve/${id}`);
      const approved = pendingTherapists.find(t => t._id === id);
      setPendingTherapists(pendingTherapists.filter(t => t._id !== id));
      if (approved) {
        setActiveTherapists([...activeTherapists, { ...approved, status: 'approved', isApproved: true }]);
      }
    } catch (err) {
      alert('Failed to approve');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionNote.trim() || rejectionNote.length < 5) {
      alert('Please provide a rejection note (at least 5 characters)');
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.post(`/admin/reject/${id}`, { rejectionNote });
      setPendingTherapists(pendingTherapists.filter(t => t._id !== id));
      setShowRejectModal(null);
      setRejectionNote('');
    } catch (err) {
      alert('Failed to reject');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlockToggle = async (id, isBlocked, index) => {
    try {
      const t = activeTherapists[index];
      if (t.user?._id) {
        await apiClient.patch(`/admin/users/${t.user._id}/block`);
        const updated = [...activeTherapists];
        updated[index].user.isBlocked = !updated[index].user.isBlocked;
        setActiveTherapists(updated);
      }
    } catch (err) {
      alert('Failed to update therapist status.');
    }
  };

  const listToRender = activeTab === 'active' ? activeTherapists : pendingTherapists;

  const filtered = listToRender.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded-lg" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-lg shadow-slate-200/50 animate-fade-in-up">
      {/* Realtime Alert */}
      {newApplicationAlert && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
          <Bell size={18} className="text-indigo-600 shrink-0" />
          <span className="text-sm font-medium text-indigo-700">New therapist application received!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Therapist Management</h2>
          <p className="text-sm text-slate-500 mt-1">Review pending applications and manage active providers.</p>
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

      <div className="flex space-x-2 mb-6 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200/50">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${activeTab === 'pending' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={16} className="mr-2" /> Pending Approvals
          {pendingTherapists.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingTherapists.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'active' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <UserCheck size={16} className="mr-2" /> Active Providers
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white/40">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/60">
              <th className="py-4 px-6 font-semibold rounded-tl-xl">Name & Email</th>
              <th className="py-4 px-6 font-semibold">Specialization</th>
              <th className="py-4 px-6 font-semibold">Experience</th>
              <th className="py-4 px-6 font-semibold">Documents</th>
              <th className="py-4 px-6 font-semibold">{activeTab === 'active' ? 'Status' : 'Applied On'}</th>
              <th className="py-4 px-6 font-semibold text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6">{renderSkeleton()}</td></tr>
            ) : filtered.map((t, index) => (
              <tr key={t._id}
                className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/therapists/${t._id}`)}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-full flex justify-center items-center shadow-sm border border-white">
                      <span className="text-teal-700 font-bold">{t.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-400 font-medium">{t.email || t.user?.email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {t.specialization || 'N/A'}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-600 font-medium text-sm">{t.experience || 'N/A'}</td>
                <td className="py-4 px-6">
                  <span className="text-xs font-semibold text-slate-500">
                    {t.documents?.length || 0}/3
                  </span>
                </td>
                <td className="py-4 px-6 text-sm">
                  {activeTab === 'active' ? (
                    t.user?.isBlocked ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-100">Suspended</span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                    )
                  ) : (
                    <span className="text-slate-500 font-medium">{new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                  {activeTab === 'pending' ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => navigate(`/therapists/${t._id}`)} className="p-2 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all shadow-sm" title="View Details">
                        <Eye size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleApprove(t._id)} disabled={isActionLoading} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all shadow-sm disabled:opacity-50" title="Approve">
                        <CheckCircle size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => { setShowRejectModal(t._id); setRejectionNote(''); }} disabled={isActionLoading} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm disabled:opacity-50" title="Reject">
                        <XCircle size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBlockToggle(t._id, t.user?.isBlocked, index)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${t.user?.isBlocked ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'}`}
                    >
                      {t.user?.isBlocked ? 'Restore Access' : 'Suspend Account'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      {activeTab === 'pending' ? <Clock size={24} className="text-slate-300" /> : <UserCheck size={24} className="text-slate-300" />}
                    </div>
                    <p className="text-slate-400 font-medium">No {activeTab} therapists found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Reject Application</h3>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejection. This will be shown to the therapist.
            </p>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none h-32 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all"
              placeholder="Enter reason for rejection..."
              value={rejectionNote}
              onChange={e => setRejectionNote(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowRejectModal(null); setRejectionNote(''); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleReject(showRejectModal)} disabled={isActionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors disabled:opacity-60">
                {isActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistApprovals;
