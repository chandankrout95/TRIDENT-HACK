import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginAdmin } from './authSlice'; // We will create this
import apiClient from '../../services/apiClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.token && res.data.role === 'admin') {
        localStorage.setItem('adminToken', res.data.token);
        dispatch(loginAdmin({ 
          token: res.data.token, 
          user: { email: res.data.email, role: res.data.role } 
        }));
      } else {
        setError('Unauthorized: Admin access required.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-indigo-50 via-white to-emerald-50 -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl mix-blend-multiply opacity-50 pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl mix-blend-multiply opacity-50 pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-xl border border-white/40 p-10 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10 animate-fade-in-up">
        <div>
          <h2 className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-500 tracking-tight">TridentAdmin</h2>
          <p className="mt-3 text-center text-sm text-slate-500 font-medium">Log in to manage the platform backend.</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all sm:text-sm font-medium"
                placeholder="admin@trident.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all sm:text-sm font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-600 text-sm text-center font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
