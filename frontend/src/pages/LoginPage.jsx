import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail, GraduationCap, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      navigate(user.role === 'ADMIN' ? '/admin' : from);
    } catch (err) {
      setError(err.message || 'Demo account login failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-main transition-colors antialiased">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6"
      >
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-content-primary">
              GYANSETU
            </span>
          </Link>
          <h2 className="text-xl font-bold text-content-primary">Welcome back</h2>
          <p className="text-xs text-content-muted">
            Sign in to access your AI Tutor, doubts forum, and quizzes.
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-5">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-status-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-content-primary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-content-muted absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gyansetu.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-main text-content-primary text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-primary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-content-muted absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-main text-content-primary text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          {/* Demo Login Quick Fill Buttons */}
          <div className="pt-4 border-t border-border space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-content-muted text-center">
              Quick One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student@gyansetu.edu', 'Student@123456')}
                disabled={loading}
                className="p-2 rounded-xl border border-border bg-surface-secondary hover:border-brand-primary/40 text-[11px] font-bold text-content-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
                <span>Demo Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@gyansetu.edu', 'Admin@123456')}
                disabled={loading}
                className="p-2 rounded-xl border border-border bg-surface-secondary hover:border-brand-primary/40 text-[11px] font-bold text-content-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-brand-primary" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <p className="text-center text-xs text-content-muted pt-1">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-primary hover:underline">
              Create an account
            </Link>
          </p>

        </div>

      </motion.div>
    </div>
  );
}
