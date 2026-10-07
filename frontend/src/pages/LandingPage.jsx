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
  Zap, 
  Users, 
  CheckCircle2,
  Bot,
  Shield,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AmbientBackground from '../components/common/AmbientBackground';

export default function LandingPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  // GSAP hero animation ref
  const heroRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    if (headlineRef.current) {
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
      );
    }
  }, []);

  const handleQuickDemoStudent = async () => {
    setDemoLoading(true);
    try {
      await login('student@gyansetu.edu', 'Student@123456');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setDemoLoading(true);
    try {
      await login('admin@gyansetu.edu', 'Admin@123456');
      navigate('/admin');
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  const coreModules = [
    {
      icon: Sparkles,
      title: "AI Academic Tutor",
      description: "Ask curriculum questions and receive structured explanations across 4 modes: Explain, Simplify, Summarize, and Exam Answer.",
      badge: "4 Modes"
    },
    {
      icon: HelpCircle,
      title: "Collaborative Doubt Forum",
      description: "Post student doubts with automated AI categorization and receive peer community replies or on-demand AI solutions.",
      badge: "Community + AI"
    },
    {
      icon: Bot,
      title: "Ask AI for This Doubt",
      description: "Generate structured, step-by-step verified explanations directly on any publicly posted student doubt thread.",
      badge: "Instant Solution"
    },
    {
      icon: FileText,
      title: "Ask From My Notes (RAG)",
      description: "Upload lecture notes or summaries. Semantic vector retrieval answers academic questions strictly referencing your uploaded notes.",
      badge: "Vector RAG"
    },
    {
      icon: CheckSquare,
      title: "AI Quiz Generator",
      description: "Generate multiple-choice concept assessments with instant evaluation, scoring analytics, and comprehensive answer rationales.",
      badge: "Assessments"
    },
    {
      icon: BookOpen,
      title: "Personalized Learning",
      description: "Automated analysis of study history, quiz scores, and doubts to generate personalized revision recommendations.",
      badge: "Analytics"
    }
  ];

  const documentedModes = [
    { name: "Explain", desc: "Detailed academic explanation with architectures and definitions." },
    { name: "Simplify", desc: "Intuitive ELI5 analogies without excessive academic jargon." },
    { name: "Summarize", desc: "High-yield revision bullet points and key takeaways." },
    { name: "Exam Answer", desc: "Structured university exam format with marking breakdowns." }
  ];

  return (
    <div className="min-h-screen bg-main flex flex-col transition-colors antialiased">
      
      {/* ==================================================
          TOP NAVBAR
          ================================================== */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-md shadow-brand-primary/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-content-primary leading-tight">
                GYANSETU
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-content-muted">
                AI Educational Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================================================
          HERO SECTION WITH THREE.JS & GSAP
          ================================================== */}
      <section ref={heroRef} className="relative overflow-hidden py-16 sm:py-24 border-b border-border bg-gradient-to-br from-white via-indigo-50/70 to-teal-50/70">
        <AmbientBackground particleCount={42} className="opacity-15" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Powered Academic Intelligence for Engineering Curricula</span>
          </div>

          <h1 ref={headlineRef} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-content-primary tracking-tight leading-tight">
            Intelligent AI Tutoring &{' '}
            <span className="text-brand-primary">
              Collaborative Doubt Solving
            </span>
          </h1>

          <p className="text-sm sm:text-base text-content-muted max-w-2xl mx-auto leading-relaxed">
            GYANSETU bridges university curricula and modern artificial intelligence. Instant multi-mode tutoring, verified AI problem solving, semantic note querying (RAG), and targeted concept retention assessments.
          </p>

          {/* Quick Demo Login Action Row */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={demoLoading}
              onClick={handleQuickDemoStudent}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-brand-primary/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{demoLoading ? 'Logging In...' : 'Launch Demo Student Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={demoLoading}
              onClick={handleQuickDemoAdmin}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-content-primary text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-brand-primary" />
              <span>Explore Faculty Admin Portal</span>
            </motion.button>
          </div>

          {/* Documented Subjects Indicator */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-content-muted">
            <span className="font-bold uppercase tracking-wider text-[10px]">Curriculum Grounding:</span>
            {['Operating Systems (OS)', 'Database Management Systems (DBMS)', 'Mathematics'].map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full border border-border bg-surface text-content-primary font-semibold text-[11px]">
                {s}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ==================================================
          4 DOCUMENTED AI TUTOR MODES SHOWCASE
          ================================================== */}
      <section className="py-16 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full">
              Multi-Mode Pedagogical Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary">
              4 Specialized Academic Response Modes
            </h2>
            <p className="text-xs sm:text-sm text-content-muted">
              Choose the exact learning depth you need for any concept.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentedModes.map((m, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                className="p-6 rounded-2xl border border-border bg-main/50 hover:border-brand-primary/40 transition-all shadow-xs space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs mb-3">
                  0{idx + 1}
                </div>
                <h3 className="text-sm font-bold text-content-primary">{m.name}</h3>
                <p className="text-xs text-content-muted leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ==================================================
          CORE PLATFORM CAPABILITIES
          ================================================== */}
      <section className="py-16 bg-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary">
              Engineered for Seamless Concept Mastery
            </h2>
            <p className="text-xs sm:text-sm text-content-muted">
              Complete full-stack architecture with SQLite persistence, JWT authentication, and AI services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-2xl border border-border bg-surface hover:border-brand-primary/40 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-secondary px-2 py-0.5 rounded-full text-content-muted">
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-content-primary">{mod.title}</h3>
                  <p className="text-xs text-content-muted leading-relaxed">{mod.description}</p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ==================================================
          FOOTER
          ================================================== */}
      <footer className="mt-auto py-8 border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span className="font-bold text-content-primary">GYANSETU</span>
            <span>— AI-Powered Educational Chatbot & Collaborative Platform</span>
          </div>

          <div>
            Built strictly to authoritative specifications • {new Date().getFullYear()}
          </div>
        </div>
      </footer>

    </div>
  );
}
