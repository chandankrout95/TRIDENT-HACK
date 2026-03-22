import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, Loader2, User, Mail, Phone, Award, Clock, BookOpen, Calendar } from 'lucide-react';
import apiClient from '../../services/apiClient';

const TherapistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        const { data } = await apiClient.get(`/admin/therapist/${id}`);
        setTherapist(data);
      } catch (err) {
        console.error('Failed to fetch therapist:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTherapist();
  }, [id]);

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await apiClient.post(`/admin/approve/${id}`);
      setTherapist(prev => ({ ...prev, status: 'approved' }));
    } catch (err) {
      alert('Failed to approve');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim() || rejectionNote.length < 5) {
      alert('Please provide a rejection note (at least 5 characters)');
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.post(`/admin/reject/${id}`, { rejectionNote });
      setTherapist(prev => ({ ...prev, status: 'rejected', rejectionNote }));
      setShowRejectModal(false);
    } catch (err) {
      alert('Failed to reject');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-lg">Therapist not found</p>
        <button onClick={() => navigate('/therapists')} className="mt-4 text-indigo-600 font-medium hover:underline">
          ← Back to list
        </button>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto">
      {/* Back Button */}
      <button onClick={() => navigate('/therapists')}
        className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
        <ArrowLeft size={18} className="mr-2" /> Back to Therapist Management
      </button>

      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-indigo-700">{therapist.name?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">{therapist.name}</h1>
              <p className="text-sm text-slate-500">{therapist.email || therapist.user?.email}</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[therapist.status] || statusColors.pending}`}>
            {therapist.status?.charAt(0).toUpperCase() + therapist.status?.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Info */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-indigo-500" /> Professional Info
          </h3>
          <div className="space-y-4">
            {[
              { icon: BookOpen, label: 'Qualification', value: therapist.qualification },
              { icon: Clock, label: 'Experience', value: therapist.experience },
              { icon: Award, label: 'Specialization', value: therapist.specialization },
              { icon: FileText, label: 'License', value: therapist.licenseNumber },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <item.icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{item.label}</p>
                  <p className="text-sm text-slate-700 font-medium">{item.value || 'N/A'}</p>
                </div>
              </div>
            ))}
            {therapist.bio && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Bio</p>
                <p className="text-sm text-slate-600 leading-relaxed">{therapist.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-indigo-500" /> Personal Info
          </h3>
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'Email', value: therapist.email || therapist.user?.email },
              { icon: Phone, label: 'Phone', value: therapist.phone || therapist.user?.phone },
              { icon: Calendar, label: 'Age', value: therapist.age ? `${therapist.age} years` : 'N/A' },
              { icon: Calendar, label: 'Date of Birth', value: therapist.dob ? new Date(therapist.dob).toLocaleDateString() : 'N/A' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <item.icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{item.label}</p>
                  <p className="text-sm text-slate-700 font-medium">{item.value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6 mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-indigo-500" /> Uploaded Documents
        </h3>
        {therapist.documents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {therapist.documents.map((doc, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 capitalize">
                      {doc.type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{doc.originalName || 'Document'}</p>
                  </div>
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors font-medium">
                    <Download size={14} /> View Document
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No documents uploaded yet.</p>
        )}
      </div>

      {/* Action Buttons (only for pending) */}
      {therapist.status === 'pending' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Review Decision</h3>
          <div className="flex gap-4">
            <button onClick={handleApprove} disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60">
              <CheckCircle size={20} /> Approve Application
            </button>
            <button onClick={() => setShowRejectModal(true)} disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60">
              <XCircle size={20} /> Reject Application
            </button>
          </div>
        </div>
      )}

      {/* Rejection Note (for rejected) */}
      {therapist.status === 'rejected' && therapist.rejectionNote && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-bold text-rose-800 mb-2">Rejection Reason</h3>
          <p className="text-sm text-rose-700">{therapist.rejectionNote}</p>
        </div>
      )}

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
              <button onClick={() => { setShowRejectModal(false); setRejectionNote(''); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleReject} disabled={isActionLoading}
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

export default TherapistDetail;
