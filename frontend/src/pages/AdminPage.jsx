import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Check,
  UserCheck,
  Shield,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [m, r, u] = await Promise.all([
        api.getAdminMetrics(),
        api.getReports(),
        api.getAdminUsers(),
      ]);
      setMetrics(m);
      setReports(r);
      setUsersList(u);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await api.resolveReport(reportId, action);
      loadAdminData();
    } catch (err) {
      alert('Failed to resolve report');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await api.updateUserRole(userId, newRole);
      loadAdminData();
    } catch (err) {
      alert('Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <span className="text-xs text-content-muted">Loading administration portal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-status-error/10 text-status-error flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary">
              Faculty Administration & Moderation
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-0.5">
              Platform-wide metrics oversight, content moderation queue, and student directory management.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl border border-border bg-surface shadow-xs">
          <span className="text-xs font-semibold text-content-muted uppercase">Users</span>
          <p className="mt-1 text-2xl font-extrabold text-content-primary">{metrics?.total_users || 0}</p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl border border-border bg-surface shadow-xs">
          <span className="text-xs font-semibold text-content-muted uppercase">Doubts</span>
          <p className="mt-1 text-2xl font-extrabold text-content-primary">{metrics?.total_doubts || 0}</p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl border border-border bg-surface shadow-xs">
          <span className="text-xs font-semibold text-content-muted uppercase">Answers</span>
          <p className="mt-1 text-2xl font-extrabold text-content-primary">{metrics?.total_answers || 0}</p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl border border-border bg-surface shadow-xs">
          <span className="text-xs font-semibold text-content-muted uppercase">Quizzes</span>
          <p className="mt-1 text-2xl font-extrabold text-content-primary">{metrics?.total_quizzes_generated || 0}</p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl border border-border bg-surface shadow-xs">
          <span className="text-xs font-semibold text-content-muted uppercase">Pending</span>
          <p className="mt-1 text-2xl font-extrabold text-status-error">{metrics?.pending_reports || 0}</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Moderation Queue ({reports.filter(r => r.status === 'PENDING').length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          User Management ({usersList.length})
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border p-6 text-xs text-content-muted">
              No reported content. Platform moderation queue is completely clear.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl border border-border bg-surface shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-status-error uppercase">Reason: {rep.reason}</span>
                  <span className="text-content-muted">{new Date(rep.created_at).toLocaleString()}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-secondary text-xs text-content-primary border border-border/60">
                  {rep.content_preview || 'No content preview available'}
                </div>

                {rep.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismiss')}
                      className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-bold text-content-muted hover:text-content-primary hover:bg-surface-secondary"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'delete_content')}
                      className="px-3.5 py-1.5 rounded-xl bg-status-error text-white text-xs font-bold hover:bg-status-error/90 shadow-xs"
                    >
                      Delete Content
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary border-b border-border text-content-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3 font-bold">User</th>
                  <th className="px-6 py-3 font-bold">Email</th>
                  <th className="px-6 py-3 font-bold">Role</th>
                  <th className="px-6 py-3 font-bold">Semester</th>
                  <th className="px-6 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-content-primary">{u.full_name}</td>
                    <td className="px-6 py-4 text-content-muted">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'ADMIN' ? 'bg-status-error/10 text-status-error' : 'bg-brand-primary/10 text-brand-primary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-content-muted">{u.semester || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="px-3 py-1 rounded-lg border border-border text-[11px] font-bold text-content-primary hover:bg-surface-secondary transition-colors"
                      >
                        Change to {u.role === 'ADMIN' ? 'Student' : 'Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
