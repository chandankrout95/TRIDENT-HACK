import React, { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, MoreVertical } from 'lucide-react';
import apiClient from '../../services/apiClient';

const UsersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
// UsersList.jsx replacement chunk 1
  useEffect(() => {
    apiClient.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleBlockUser = async (id, isBlocked) => {
    try {
      // Toggling block status
      await apiClient.patch(`/admin/users/${id}/block`, { isBlocked: !isBlocked });
      setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !isBlocked } : u));
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-lg shadow-slate-200/50 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">View, search, and manage platform members.</p>
        </div>
        
        <div className="flex bg-slate-100/80 px-4 py-2.5 rounded-xl items-center w-full sm:w-72 border border-slate-200/50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search by email or ID..." 
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
              <th className="py-4 px-6 font-semibold rounded-tl-xl">User</th>
              <th className="py-4 px-6 font-semibold">Role</th>
              <th className="py-4 px-6 font-semibold">Status</th>
              <th className="py-4 px-6 font-semibold">Joined</th>
              <th className="py-4 px-6 font-semibold text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-4">Loading users...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex justify-center items-center shadow-sm border border-white">
                        <span className="text-indigo-600 font-bold">{user.email?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-800">{user.email}</div>
                        <div className="text-xs text-slate-400 font-medium">ID: {user._id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBlocked ? (
                      <span className="px-3 py-1 flex items-center w-fit text-xs leading-5 font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                        <Ban size={12} className="mr-1.5" /> Blocked
                      </span>
                    ) : (
                      <span className="px-3 py-1 flex items-center w-fit text-xs leading-5 font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle size={12} className="mr-1.5" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleBlockUser(user._id, user.isBlocked)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all mr-3 ${user.isBlocked ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'}`}
                    >
                      {user.isBlocked ? 'Unblock Account' : 'Block Account'}
                    </button>
                    <button className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors inline-flex align-middle">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            {filteredUsers.length === 0 && !isLoading && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
