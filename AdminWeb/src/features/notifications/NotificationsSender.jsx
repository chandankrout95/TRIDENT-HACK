import React, { useState } from 'react';
import { Send, Bell } from 'lucide-react';
import apiClient from '../../services/apiClient';

const NotificationsSender = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('All Users');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      alert('Please fill out all fields');
      return;
    }
// NotificationsSender.jsx chunk 1
    setIsSending(true);
    try {
       await apiClient.post('/admin/notifications', { title, message, target });
       alert('Notification dispatched successfully!');
       setTitle('');
       setMessage('');
    } catch(err) {
       alert('Failed to dispatch notification');
    } finally {
       setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
      <div className="flex items-center mb-6">
        <Bell className="text-blue-600 mr-3" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Send Push Notification</h2>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <select 
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full border-gray-300 border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All Users">All Users & Therapists</option>
            <option value="users">Only Users</option>
            <option value="therapists">Only Therapists</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Feature Update!"
            className="w-full border-gray-300 border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
          <textarea 
            required
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full border-gray-300 border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSending}
          className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSending ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          <Send size={18} className="mr-2" />
          {isSending ? 'Dispatching...' : 'Dispatch Notification'}
        </button>
      </form>
    </div>
  );
};

export default NotificationsSender;
