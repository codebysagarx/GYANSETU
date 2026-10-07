import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Sparkles, 
  ThumbsUp, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Bot, 
  ArrowLeft, 
  ShieldAlert, 
  Check, 
  ListOrdered, 
  AlertCircle,
  Copy,
  User,
  Share2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditsContext.jsx';

export default function DoubtDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { spend } = useCredits();

  const [doubt, setDoubt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedAnswerId, setCopiedAnswerId] = useState(null);

  useEffect(() => {
    loadDoubt();
  }, [id]);

  const loadDoubt = async () => {
    try {
      const data = await api.getDoubtDetail(id);
      setDoubt(data);
      if (data.ai_summary) {
        setSummaryData({ summary: data.ai_summary, key_points: [] });
      }
    } catch (err) {
      setErrorMsg('Failed to load doubt details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || replying) return;

    setReplying(true);
    setErrorMsg('');
    try {
      const newAnswer = await api.postAnswer(id, { content: replyContent });
      setDoubt((prev) => ({
        ...prev,
        answers: [...prev.answers, newAnswer],
        answers_count: prev.answers_count + 1,
      }));
      setReplyContent('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit answer');
    } finally {
      setReplying(false);
    }
  };

  const handleAskAI = async () => {
    if (!spend(10)) return;
    setAiGenerating(true);
    setErrorMsg('');
    try {
      const aiAnswer = await api.askAIOnDoubt(id);
      setDoubt((prev) => {
        const exists = prev.answers.some((a) => a.id === aiAnswer.id);
        if (exists) return prev;
        return {
          ...prev,
          answers: [aiAnswer, ...prev.answers],
          answers_count: prev.answers_count + 1,
        };
      });
    } catch (err) {
      setErrorMsg(err.message || 'AI assistance generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSummarizeDiscussion = async () => {
    setSummarizing(true);
    setErrorMsg('');
    try {
      const res = await api.summarizeDiscussion(id);
      setSummaryData(res);
      setDoubt((prev) => ({ ...prev, ai_summary: res.summary }));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate discussion summary');
    } finally {
      setSummarizing(false);
    }
  };

  const handleUpvote = async (answerId) => {
    try {
      const res = await api.upvoteAnswer(answerId);
      setDoubt((prev) => ({
        ...prev,
        answers: prev.answers.map((a) =>
          a.id === answerId
            ? { ...a, upvotes_count: res.upvotes_count, has_upvoted: res.has_upvoted }
            : a
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.acceptAnswer(answerId);
      setDoubt((prev) => ({
        ...prev,
        status: 'SOLVED',
        answers: prev.answers.map((a) => ({
          ...a,
          is_accepted: a.id === answerId,
        })),
      }));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept solution');
    }
  };

  const copyToClipboard = (text, ansId) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswerId(ansId);
    setTimeout(() => setCopiedAnswerId(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <span className="text-xs text-content-muted">Loading question thread...</span>
      </div>
    );
  }

  if (!doubt) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm font-bold text-content-primary">Doubt not found</p>
        <Link to="/doubts" className="text-xs font-bold text-brand-primary hover:underline">
          ← Back to doubts forum
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === doubt.author_id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 antialiased">
      
      {/* Back Link */}
      <Link
        to="/doubts"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-content-muted hover:text-content-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community Doubts</span>
      </Link>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================================================
          1. MAIN QUESTION HERO CARD
          ================================================== */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
        
        {/* Header Tags & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-secondary/10 text-brand-secondary">
              {doubt.subject_name || doubt.ai_category || 'Operating Systems (OS)'}
            </span>

            {doubt.tags && doubt.tags.map((t, idx) => (
              <span key={idx} className="text-xs text-content-muted bg-surface-secondary px-2.5 py-0.5 rounded-md">
                #{t}
              </span>
            ))}
          </div>

          {doubt.status === 'SOLVED' && (
            <motion.span 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-success/10 text-status-success border border-status-success/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolved • Solved</span>
            </motion.span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
          {doubt.title}
        </h1>

        {/* Description Body */}
        <div className="text-xs sm:text-sm text-content-primary leading-relaxed whitespace-pre-wrap">
          {doubt.description}
        </div>

        {/* Meta Bar */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-content-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
              {doubt.author_name?.charAt(0) || 'S'}
            </div>
            <span className="font-semibold text-content-primary">{doubt.author?.full_name}</span>
            <span>•</span>
            <span>{new Date(doubt.created_at).toLocaleDateString()}</span>
          </div>

          {/* Action: Ask AI for this doubt */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={aiGenerating}
              onClick={handleAskAI}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white text-xs font-bold shadow-xs hover:shadow-brand-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{aiGenerating ? 'AI Synthesizing...' : 'Ask AI for This Doubt'}</span>
            </motion.button>
          </div>
        </div>

      </div>

      {/* ==================================================
          2. AI DISCUSSION SUMMARY SECTION
          ================================================== */}
      {doubt.answers && doubt.answers.length >= 2 && (
        <div className="p-5 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                AI Discussion Summary
              </h3>
            </div>
            <button
              onClick={handleSummarizeDiscussion}
              disabled={summarizing}
              className="text-xs font-bold text-brand-primary hover:underline disabled:opacity-50"
            >
              {summarizing ? 'Synthesizing...' : summaryData ? 'Refresh Summary' : 'Generate Summary'}
            </button>
          </div>

          {summaryData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-1 text-xs">
              <p className="text-content-primary leading-relaxed">{summaryData.summary}</p>
              {summaryData.key_points && summaryData.key_points.length > 0 && (
                <ul className="space-y-1 pl-4 list-disc text-content-muted">
                  {summaryData.key_points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ==================================================
          3. COMMUNITY & AI ANSWERS
          ================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-content-muted">
            Solutions & Peer Replies ({doubt.answers?.length || 0})
          </h2>
        </div>

        {doubt.answers && doubt.answers.length > 0 ? (
          <div className="space-y-4">
            {doubt.answers.map((ans) => {
              const isAI = ans.is_ai_generated;
              const isAccepted = ans.is_accepted;

              return (
                <motion.div
                  key={ans.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-2xl border transition-all shadow-xs relative ${
                    isAccepted
                      ? 'border-status-success bg-status-success/5 ring-1 ring-status-success/30'
                      : isAI
                      ? 'border-brand-primary/30 bg-brand-primary/5'
                      : 'border-border bg-surface'
                  }`}
                >
                  {/* Top Badge for AI or Accepted Solution */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isAI ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary text-white">
                          <Bot className="w-3 h-3" />
                          <span>GYANSETU Verified AI</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-6 h-6 rounded-full bg-surface-secondary text-content-primary flex items-center justify-center font-bold text-xs">
                            {ans.author_name?.charAt(0) || 'P'}
                          </div>
                          <span className="font-bold text-content-primary">{ans.author_name || 'Peer'}</span>
                        </div>
                      )}

                      <span className="text-[10px] text-content-muted">
                        {new Date(ans.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/20">
                          <Check className="w-3 h-3" />
                          <span>Accepted Solution</span>
                        </span>
                      )}

                      <button
                        onClick={() => copyToClipboard(ans.content, ans.id)}
                        className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
                        title="Copy answer"
                      >
                        {copiedAnswerId === ans.id ? (
                          <Check className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Answer Content */}
                  <div className="text-xs sm:text-sm text-content-primary leading-relaxed whitespace-pre-wrap">
                    {ans.content}
                  </div>

                  {/* Answer Footer: Upvotes & Author Accept */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUpvote(ans.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ans.has_upvoted
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{ans.upvotes_count} Upvotes</span>
                    </motion.button>

                    {isAuthor && !isAccepted && (
                      <button
                        onClick={() => handleAcceptAnswer(ans.id)}
                        className="px-3 py-1.5 rounded-lg border border-status-success/40 bg-status-success/10 text-status-success text-xs font-bold hover:bg-status-success/20 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Solution</span>
                      </button>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center rounded-2xl border border-dashed border-border bg-surface p-6 space-y-2">
            <p className="text-xs text-content-muted">
              No answers posted yet. Click <strong>"Ask AI for This Doubt"</strong> or write the first reply below.
            </p>
          </div>
        )}
      </div>

      {/* ==================================================
          4. POST PEER REPLY COMPOSER
          ================================================== */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Contribute an Academic Answer
        </h3>
        
        <form onSubmit={handlePostReply} className="space-y-3">
          <textarea
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a clear, academic solution with reasoning, code, or references..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-main text-xs sm:text-sm text-content-primary placeholder:text-content-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={replying || !replyContent.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{replying ? 'Publishing...' : 'Post Answer'}</span>
            </motion.button>
          </div>
        </form>
      </div>

    </div>
  );
}
