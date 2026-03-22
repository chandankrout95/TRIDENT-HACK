import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', desc: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await apiClient.get('/admin/emergency-contacts');
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (contact) => {
    setEditingId(contact._id);
    setEditForm({ role: contact.role, desc: contact.desc, phoneNumber: contact.phoneNumber });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ role: '', desc: '', phoneNumber: '' });
    setPhoneError('');
  };

  const handlePhoneChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setEditForm({ ...editForm, phoneNumber: digitsOnly });
    if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const isFormValid = editForm.role.trim() && editForm.desc.trim() && editForm.phoneNumber.length === 10;

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/emergency-contacts/${id}`, editForm);
      setContacts(prev => prev.map(c => c._id === id ? res.data : c));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update contact:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Emergency Contacts</h1>
        <p className="text-sm text-slate-500 mt-1">Manage the emergency specialist numbers that users see in the SOS screen. Changes are reflected instantly.</p>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-100/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Specialist Role</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Description</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Phone Number</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <tr key={contact._id} className="hover:bg-indigo-50/30 transition-colors">
                {editingId === contact._id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={editForm.desc}
                        onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <input
                          value={editForm.phoneNumber}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="10 digit number"
                          maxLength={10}
                          inputMode="numeric"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none font-mono ${phoneError ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-indigo-400'}`}
                        />
                        {phoneError && <p className="text-red-500 text-xs mt-1 font-medium">{phoneError}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => saveEdit(contact._id)}
                        disabled={saving || !isFormValid}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: contact.color }}>
                          {contact.role.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{contact.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{contact.desc}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">{contact.phoneNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${contact.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {contact.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => startEdit(contact)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <strong>Note:</strong> Updating a phone number here instantly pushes the change to all connected users via real-time socket. Users on the SOS screen will see updated numbers without refreshing.
      </div>
    </div>
  );
};

export default EmergencyContacts;
