import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { 
  Sparkles, 
  HelpCircle, 
  CheckSquare, 
  FileText, 
  BookOpen, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  Award,
  Zap,
  Lightbulb,
  CheckCircle,
  GraduationCap,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AmbientBackground from '../components/common/AmbientBackground';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [recentDoubts, setRecentDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Action Center State
  const [selectedMode, setSelectedMode] = useState('explain');
  const [selectedSubject, setSelectedSubject] = useState('Operating Systems (OS)');
  const [promptText, setPromptText] = useState('');

  // Refs for GSAP counter rollups
  const counterRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const documentedModes = [
    { id: 'explain', label: 'Explain', icon: BookOpen, desc: 'Academic breakdown' },
    { id: 'simplify', label: 'Simplify', icon: Lightbulb, desc: 'ELI5 intuitive analogy' },
    { id: 'summarize', label: 'Summarize', icon: FileText, desc: 'High-yield points' },
    { id: 'exam_answer', label: 'Exam Answer', icon: CheckCircle, desc: 'Exam format solution' },
  ];

  const documentedSubjects = [
    'Operating Systems (OS)',
    'Database Management Systems (DBMS)',
    'Mathematics'
  ];

  const suggestedPrompts = {
    'Operating Systems (OS)': [
      "Banker's Algorithm safe state conditions and resource allocation",
      "Virtual memory paging vs segmentation trade-offs",
      "Process synchronization using semaphores and mutexes"
    ],
    'Database Management Systems (DBMS)': [
      "Differences between 3NF and BCNF with functional dependencies",
      "ACID properties and Two-Phase Locking (2PL) protocol",
      "B+ Tree indexing vs hash indexing in query execution"
    ],
    'Mathematics': [
      "Pigeonhole Principle applications and formal proof",
      "Eigenvalues and eigenvectors geometric interpretation",
      "Bayes' Theorem probability derivation and real-world calculation"
    ]
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashData, doubtsData] = await Promise.all([
          api.getLearningDashboard(),
          api.listDoubts({ limit: 4 })
        ]);
        setMetrics(dashData);
        setRecentDoubts(doubtsData.items || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // GSAP Counter Rollup effect
  useEffect(() => {
    if (!loading && metrics) {
      const stats = [
        metrics.total_doubts_asked || 0,
        metrics.total_answers_given || 0,
        metrics.total_quizzes_taken || 0,
        metrics.average_quiz_score || 0
      ];

      counterRefs.forEach((ref, index) => {
        if (ref.current) {
          const target = stats[index];
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => {
              if (ref.current) {
                ref.current.innerText = index === 3 && target > 0 ? `${Math.round(obj.val)}%` : Math.round(obj.val);
              }
            }
          });
        }
      });
    }
  }, [loading, metrics]);

  const handleLaunchAI = (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    navigate('/tutor', { 
      state: { 
        initialPrompt: promptText,
        initialMode: selectedMode,
        initialSubject: selectedSubject
      } 
    });
  };

  const handleQuickPromptClick = (p) => {
    setPromptText(p);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <span className="text-xs font-semibold text-content-muted">Initializing GYANSETU Dashboard...</span>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      
      {/* ==================================================
          1. HERO: AI TUTOR / AI ACTION CENTER (Centerpiece)
          ================================================== */}
      <motion.section 
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-gradient-to-b from-surface via-surface to-surface-secondary/40 p-6 sm:p-8 shadow-sm backdrop-blur-xs"
      >
        {/* Subtle WebGL Ambient Node Constellation */}
        <AmbientBackground particleCount={36} className="opacity-60" />

        <div className="relative z-10 max-w-4xl space-y-5">
          
          {/* Top Pill Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>GYANSETU AI Academic Hub</span>
              <span className="text-content-muted">•</span>
              <span className="text-content-muted font-normal">{user?.course || 'Computer Science'} ({user?.semester || 'Semester 5'})</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-content-muted">
              <Clock className="w-3.5 h-3.5 text-brand-primary" />
              <span>Session Active</span>
            </div>
          </div>

          {/* Welcome Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-content-primary tracking-tight leading-tight">
              Master core concepts with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-secondary">
                GYANSETU AI Tutor
              </span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-content-muted max-w-2xl leading-relaxed">
              {user?.learning_goal || 'Instant explanations, ELI5 simplifications, key summaries, and university exam answers tailored to your curriculum.'}
            </p>
          </div>

          {/* Mode Selector Segmented Tabs */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
              Select Response Mode:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {documentedModes.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-xs'
                        : 'border-border/80 bg-surface/70 text-content-muted hover:text-content-primary hover:border-brand-primary/30'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-brand-primary text-white' : 'bg-surface-secondary text-content-muted'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{m.label}</p>
                      <p className="text-[10px] text-content-muted truncate">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Context Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
              Subject Context:
            </span>
            {documentedSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  selectedSubject === sub
                    ? 'border-brand-secondary bg-brand-secondary/15 text-brand-secondary font-bold'
                    : 'border-border/80 bg-surface text-content-muted hover:border-brand-secondary/40'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Prompt Composer Box */}
          <form onSubmit={handleLaunchAI} className="mt-2">
            <div className="p-1.5 rounded-2xl border border-border/80 bg-surface/90 shadow-sm focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-1 px-3 py-1">
                <Sparkles className="w-4 h-4 text-brand-primary shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={`Ask AI Tutor in '${selectedMode.replace('_', ' ')}' mode for ${selectedSubject}...`}
                  className="w-full bg-transparent text-content-primary text-xs sm:text-sm focus:outline-none placeholder:text-content-muted/70"
                />
              </div>

              <motion.button
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>Launch Tutor</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </form>

          {/* Quick Subject Inquiries / Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-content-muted">Suggested:</span>
            {suggestedPrompts[selectedSubject]?.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPromptClick(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-border/70 bg-surface-secondary/60 hover:border-brand-primary/40 text-content-primary hover:text-brand-primary transition-colors text-left truncate max-w-xs sm:max-w-none"
              >
                "{p}"
              </button>
            ))}
          </div>

        </div>
      </motion.section>

      {/* ==================================================
          2. LEARNING STATISTICS (4 Premium Cards with GSAP)
          ================================================== */}
      <motion.section variants={cardVariants} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-content-muted">
            Academic Performance & Retention Metrics
          </h2>
          <Link to="/my-learning" className="text-xs font-semibold text-brand-primary hover:underline">
            Detailed Analytics →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Doubts Asked */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-5 rounded-xl border border-border bg-surface shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-muted uppercase">Doubts Asked</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <p ref={counterRefs[0]} className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
              {metrics?.total_doubts_asked || 0}
            </p>
            <p className="mt-1 text-[11px] text-content-muted">Community & AI inquiries</p>
          </motion.div>

          {/* Card 2: Answers Given */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-5 rounded-xl border border-border bg-surface shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-muted uppercase">Answers Given</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <p ref={counterRefs[1]} className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
              {metrics?.total_answers_given || 0}
            </p>
            <p className="mt-1 text-[11px] text-content-muted">Peer problem contributions</p>
          </motion.div>

          {/* Card 3: Quizzes Taken */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-5 rounded-xl border border-border bg-surface shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-muted uppercase">Quizzes Completed</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <p ref={counterRefs[2]} className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
              {metrics?.total_quizzes_taken || 0}
            </p>
            <p className="mt-1 text-[11px] text-content-muted">MCQ assessments taken</p>
          </motion.div>

          {/* Card 4: Average Score */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-5 rounded-xl border border-border bg-surface shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-muted uppercase">Retention Score</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p ref={counterRefs[3]} className="mt-2 text-2xl sm:text-3xl font-extrabold text-content-primary">
              {metrics?.average_quiz_score ? `${metrics.average_quiz_score}%` : 'N/A'}
            </p>
            <p className="mt-1 text-[11px] text-content-muted">Average accuracy rate</p>
          </motion.div>

        </div>
      </motion.section>

      {/* ==================================================
          3. MAIN CONTENT: RECOMMENDATIONS & COMMUNITY
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Recommendations & Study Quick Launchers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personalized Recommendations */}
          <motion.div 
            variants={cardVariants}
            className="p-6 rounded-xl border border-border bg-surface shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-content-primary leading-tight">
                    Personalized Study Recommendations
                  </h2>
                  <p className="text-[11px] text-content-muted">Targeted revision derived from your quiz and doubt history</p>
                </div>
              </div>

              <Link to="/my-learning" className="text-xs font-bold text-brand-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {metrics?.recommendations && metrics.recommendations.length > 0 ? (
                metrics.recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-border/80 bg-surface-secondary/40 flex items-start justify-between gap-4 hover:border-brand-primary/40 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary">
                        {rec.recommendation_type.replace('_', ' ')}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-content-primary">{rec.title}</h3>
                      <p className="text-xs text-content-muted leading-relaxed">{rec.description}</p>
                    </div>

                    <Link
                      to="/quizzes"
                      className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs shrink-0 transition-colors"
                    >
                      Practice
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center rounded-xl border border-dashed border-border text-content-muted text-xs">
                  Take a quiz or ask a doubt to generate personalized curriculum study recommendations.
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Hub Launchers */}
          <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <Link
              to="/tutor"
              className="p-5 rounded-xl border border-border bg-surface hover:border-brand-primary/40 transition-all card-hover group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-content-primary">AI Tutor Chat</h3>
              <p className="text-xs text-content-muted mt-1 leading-relaxed">
                4 Documented modes: Explain, Simplify, Summarize, Exam Answer.
              </p>
            </Link>

            <Link
              to="/quizzes"
              className="p-5 rounded-xl border border-border bg-surface hover:border-brand-primary/40 transition-all card-hover group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-content-primary">AI Quiz Engine</h3>
              <p className="text-xs text-content-muted mt-1 leading-relaxed">
                Generate topic assessments with instant scoring and explanations.
              </p>
            </Link>

            <Link
              to="/notes"
              className="p-5 rounded-xl border border-border bg-surface hover:border-brand-primary/40 transition-all card-hover group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-content-primary">Ask From Notes</h3>
              <p className="text-xs text-content-muted mt-1 leading-relaxed">
                Query study lecture notes with semantic RAG vector retrieval.
              </p>
            </Link>

          </motion.div>

        </div>

        {/* Right Column: Active Community Doubts */}
        <motion.div 
          variants={cardVariants}
          className="p-6 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-content-primary">Community Doubts</h2>
                <p className="text-[11px] text-content-muted">Peer collaboration and questions</p>
              </div>
              <Link to="/doubts" className="text-xs font-bold text-brand-primary hover:underline">
                Explore All
              </Link>
            </div>

            <div className="space-y-3">
              {recentDoubts.length > 0 ? (
                recentDoubts.map((doubt) => (
                  <Link
                    key={doubt.id}
                    to={`/doubts/${doubt.id}`}
                    className="block p-3.5 rounded-xl border border-border/80 bg-surface-secondary/30 hover:border-brand-primary/40 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-secondary/10 text-brand-secondary">
                        {doubt.subject_name || doubt.ai_category || 'Operating Systems'}
                      </span>
                      {doubt.status === 'SOLVED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-status-success">
                          <CheckCircle2 className="w-3 h-3" /> Solved
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-content-primary line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {doubt.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-content-muted">
                      <span>{doubt.answers_count} {doubt.answers_count === 1 ? 'answer' : 'answers'}</span>
                      <span>•</span>
                      <span>{doubt.views_count} views</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-content-muted border border-dashed border-border rounded-xl">
                  No community doubts posted yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Link
              to="/doubts"
              className="w-full py-2.5 px-3 rounded-xl border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask a Doubt in Community</span>
            </Link>
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}
