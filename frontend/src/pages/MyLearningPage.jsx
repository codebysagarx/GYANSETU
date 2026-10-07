import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  HelpCircle, 
  CheckSquare, 
  MessageSquare, 
  Zap, 
  Check, 
  Clock, 
  Sparkles,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyLearningPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      const data = await api.getLearningDashboard();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (recId) => {
    try {
      await api.markRecommendationRead(recId);
      setMetrics((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === recId ? { ...r, is_read: true } : r
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <span className="text-xs text-content-muted">Loading learning analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 antialiased">
      
      {/* Page Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary">
              My Learning Analytics & Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-0.5">
              Review your study engagement, concept retention rate, and personalized AI curriculum advice.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase">Doubts Asked</span>
            <HelpCircle className="w-4 h-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
            {metrics?.total_doubts_asked || 0}
          </p>
          <span className="text-[11px] text-content-muted">Questions published</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase">Answers Given</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
            {metrics?.total_answers_given || 0}
          </p>
          <span className="text-[11px] text-content-muted">Community solutions</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase">Quizzes Taken</span>
            <CheckSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
            {metrics?.total_quizzes_taken || 0}
          </p>
          <span className="text-[11px] text-content-muted">Assessments finished</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase">Retention Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
            {metrics?.average_quiz_score ? `${metrics.average_quiz_score}%` : 'N/A'}
          </p>
          <span className="text-[11px] text-content-muted">Average accuracy</span>
        </motion.div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Studied Topics Distribution */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider">
              Curriculum Topics Studied
            </h2>
          </div>

          {metrics?.frequent_topics && metrics.frequent_topics.length > 0 ? (
            <div className="space-y-3 pt-1">
              {metrics.frequent_topics.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-content-primary">{t.topic}</span>
                    <span className="text-brand-primary">{t.count} inquiries</span>
                  </div>
                  <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-brand-primary h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, t.count * 25)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-content-muted">
              Start asking doubts or taking quizzes to see your topics distribution.
            </div>
          )}
        </div>

        {/* Personalized AI Recommendations */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider">
              Personalized AI Recommendations
            </h2>
          </div>

          {metrics?.recommendations && metrics.recommendations.length > 0 ? (
            <div className="space-y-3">
              {metrics.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rec.is_read
                      ? 'border-border/60 bg-surface-secondary/20 opacity-70'
                      : 'border-brand-primary/30 bg-brand-primary/5 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                        {rec.recommendation_type.replace('_', ' ')}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-content-primary">{rec.title}</h3>
                      <p className="text-xs text-content-muted leading-relaxed">{rec.description}</p>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Link
                        to="/quizzes"
                        className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs text-center"
                      >
                        Practice
                      </Link>
                      {!rec.is_read && (
                        <button
                          onClick={() => handleMarkRead(rec.id)}
                          className="text-[10px] text-content-muted hover:text-content-primary text-center"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-content-muted">
              No active recommendations. Complete assessments to receive AI advice.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
