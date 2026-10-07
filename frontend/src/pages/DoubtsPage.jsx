import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  MessageSquare, 
  Eye, 
  CheckCircle2, 
  Sparkles, 
  X,
  AlertCircle,
  Tag,
  ArrowRight,
  Filter,
  User
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DoubtsPage() {
  const { user } = useAuth();

  const [doubts, setDoubts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Ask Doubt Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [suggestedTagsList, setSuggestedTagsList] = useState([]);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadDoubts();
  }, [selectedSubject, statusFilter]);

  const loadSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const res = await api.listDoubts({
        q: searchQuery,
        subject_id: selectedSubject || undefined,
        status_filter: statusFilter || undefined,
      });
      setDoubts(res.items || []);
    } catch (err) {
      console.error('Failed to load doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDoubts();
  };

  const handleAICategorize = async () => {
    if (!modalTitle.trim() && !modalDesc.trim()) {
      setModalError('Please enter a title or description first so AI can categorize.');
      return;
    }
    setAiCategorizing(true);
    setModalError('');
    try {
      const cat = await api.aiCategorize({
        title: modalTitle,
        description: modalDesc,
      });

      if (cat.category) {
        const matched = subjects.find(
          (s) => s.name.toLowerCase().includes(cat.category.toLowerCase()) ||
                 cat.category.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matched) setModalSubjectId(matched.id);
      }

      if (cat.suggested_tags && cat.suggested_tags.length > 0) {
        setSuggestedTagsList(cat.suggested_tags);
        setModalTags(cat.suggested_tags.join(', '));
      }
    } catch (err) {
      console.error(err);
      setModalError('Failed to run AI categorization.');
    } finally {
      setAiCategorizing(false);
    }
  };

  const handleCreateDoubt = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalDesc.trim()) {
      setModalError('Title and description are required.');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const tagsArray = modalTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.createDoubt({
        title: modalTitle.trim(),
        description: modalDesc.trim(),
        subject_id: modalSubjectId || null,
        tags: tagsArray,
      });

      setModalOpen(false);
      setModalTitle('');
      setModalDesc('');
      setModalSubjectId('');
      setModalTags('');
      setSuggestedTagsList([]);
      loadDoubts();
    } catch (err) {
      console.error('Failed to post doubt:', err);
      setModalError(err.message || 'Failed to submit doubt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 antialiased">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary">
              Student Doubt Community
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-content-muted mt-1 leading-relaxed">
            Collaborative academic doubt forum with automated AI categorization and on-demand AI solutions.
          </p>
        </div>

        <motion.button
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-brand-primary/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ask a Doubt</span>
        </motion.button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doubts by concept, title, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-xs text-content-primary placeholder:text-content-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-xs"
            />
          </div>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-secondary/70 p-1 rounded-xl border border-border/70 text-xs">
            {['', 'OPEN', 'SOLVED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                {status === '' ? 'All Doubts' : status === 'OPEN' ? 'Open' : 'Solved'}
              </button>
            ))}
          </div>

          {/* Subject Filter Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 shadow-xs"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Doubts List Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
          <span className="text-xs text-content-muted">Loading doubts...</span>
        </div>
      ) : doubts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-surface/50 p-8 space-y-3">
          <HelpCircle className="w-10 h-10 text-content-muted mx-auto" />
          <h3 className="text-sm font-bold text-content-primary">No doubts found</h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Try adjusting your search criteria or be the first to ask a question!
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs transition-colors"
          >
            Ask a Doubt
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((doubt) => (
            <motion.div
              key={doubt.id}
              whileHover={{ y: -2 }}
              className="p-5 rounded-2xl border border-border bg-surface hover:border-brand-primary/40 transition-all shadow-xs group"
            >
              <Link to={`/doubts/${doubt.id}`} className="block">
                
                {/* Card Top Row: Subject & Solved Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-secondary/10 text-brand-secondary">
                      {doubt.subject_name || doubt.ai_category || 'Operating Systems (OS)'}
                    </span>

                    {doubt.tags && doubt.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-content-muted bg-surface-secondary px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {doubt.status === 'SOLVED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-status-success/10 text-status-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Solved</span>
                    </span>
                  )}
                </div>

                {/* Title & Excerpt */}
                <h2 className="text-sm sm:text-base font-bold text-content-primary group-hover:text-brand-primary transition-colors leading-snug">
                  {doubt.title}
                </h2>
                
                <p className="mt-1 text-xs text-content-muted line-clamp-2 leading-relaxed">
                  {doubt.description}
                </p>

                {/* Card Bottom Meta */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-content-muted">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[9px]">
                      {doubt.author_name?.charAt(0) || 'S'}
                    </div>
                    <span>{doubt.author_name || 'Student'}</span>
                    <span>•</span>
                    <span>{new Date(doubt.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-3 font-semibold shrink-0">
                    <span className="hidden sm:flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{doubt.views_count} views</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{doubt.answers_count ? 'View solution' : 'Open thread'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* ==================================================
          ASK A DOUBT MODAL
          ================================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-content-primary">Ask a Doubt</h2>
                    <p className="text-[11px] text-content-muted">Submit your question with AI auto-categorization</p>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateDoubt} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">
                    Doubt Title <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g., How does Banker's Algorithm ensure safe state?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-main text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">
                    Detailed Explanation <span className="text-status-error">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={modalDesc}
                    onChange={(e) => setModalDesc(e.target.value)}
                    placeholder="Provide details on where you are stuck, expected behavior, or code context..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-main text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                {/* AI Auto-Categorize Button */}
                <div className="p-3.5 rounded-xl border border-brand-primary/20 bg-brand-primary/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="text-content-muted">
                      Let AI detect curriculum subject and suggest tags
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={aiCategorizing}
                    onClick={handleAICategorize}
                    className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {aiCategorizing ? 'Analyzing...' : 'Auto-Detect'}
                  </button>
                </div>

                {/* Subject Selector */}
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">
                    Subject Category
                  </label>
                  <select
                    value={modalSubjectId}
                    onChange={(e) => setModalSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-main text-xs font-semibold text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Select a subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={modalTags}
                    onChange={(e) => setModalTags(e.target.value)}
                    placeholder="os, deadlocks, bankers-algorithm"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-main text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-content-muted hover:text-content-primary hover:bg-surface-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Publishing...' : 'Post Doubt'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
