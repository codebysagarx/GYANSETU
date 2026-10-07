import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Search, 
  User, 
  GraduationCap,
  Menu,
  ChevronRight,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCredits } from '../../context/CreditsContext.jsx';
import { useThemeStore } from '../../context/ThemeStore';

export default function TopHeader({ isCollapsed, setIsCollapsed }) {
  const { user } = useAuth();
  const { credits, topUp, showTopUp, setShowTopUp } = useCredits();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const getPageInfo = (pathname) => {
    if (pathname.startsWith('/tutor')) return { title: 'AI Academic Tutor', subtitle: 'Interactive Concept Learning' };
    if (pathname.startsWith('/doubts')) return { title: 'Doubt Forum', subtitle: 'Collaborative Problem Solving' };
    if (pathname.startsWith('/quizzes')) return { title: 'AI Quizzes', subtitle: 'Concept Retention Assessments' };
    if (pathname.startsWith('/notes')) return { title: 'Ask My Notes', subtitle: 'RAG Knowledge Retrieval' };
    if (pathname.startsWith('/my-learning')) return { title: 'My Learning', subtitle: 'Performance & Topic Analytics' };
    if (pathname.startsWith('/admin')) return { title: 'Faculty Admin', subtitle: 'Platform Oversight & Moderation' };
    if (pathname.startsWith('/onboarding')) return { title: 'Profile Setup', subtitle: 'Curriculum & Semester Preferences' };
    return { title: 'Student Dashboard', subtitle: 'Academic Overview' };
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate('/tutor', { state: { initialPrompt: searchQuery } });
  };

  const pageInfo = getPageInfo(location.pathname);

  return (
    <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between transition-colors">
      
      {/* Left: Mobile Brand & Desktop Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Brand Link (screens < 768px) */}
        <Link to="/dashboard" className="md:hidden flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-base font-extrabold text-content-primary">
            GYANSETU
          </span>
        </Link>

        {/* Tablet Toggle Button (768px - 1023px) */}
        {setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex lg:hidden p-1.5 rounded-lg border border-border text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Breadcrumbs (screens >= 768px) */}
        <div className="hidden md:flex items-center gap-2 text-xs truncate">
          <span className="text-content-muted font-medium">GYANSETU</span>
          <ChevronRight className="w-3.5 h-3.5 text-content-muted shrink-0" />
          <span className="font-bold text-content-primary truncate">{pageInfo.title}</span>
          <span className="hidden xl:inline text-[11px] text-content-muted/80">
            — {pageInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar (hidden on small mobile) */}
      <form 
        onSubmit={handleGlobalSearch}
        className="hidden sm:flex items-center max-w-xs md:max-w-sm lg:max-w-md w-full mx-4"
      >
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask AI Tutor any concept..."
            className="w-full pl-9 pr-14 py-1.5 rounded-lg border border-border/80 bg-surface-secondary/50 text-content-primary text-xs placeholder:text-content-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
          <div className="absolute right-2 top-1.5 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border/80 bg-surface text-[10px] font-semibold text-content-muted/80 select-none">
            ↵
          </div>
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        <button type="button" onClick={() => setShowTopUp(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors" title="Prototype credit wallet">⚡ {credits}<span className="hidden sm:inline"> credits</span></button>
        {/* Quick Ask AI CTA (screens >= 640px) */}
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/tutor"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white text-xs font-semibold shadow-xs hover:shadow-brand-primary/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tutor</span>
          </Link>
        </motion.div>

        {/* Academic Course Badge (screens >= 1024px) */}
        {user?.course && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-secondary/60 text-[11px] font-semibold text-content-muted">
            <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
            <span className="truncate max-w-[120px]">{user.course}</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border bg-surface-secondary/40 text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-content-muted" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </motion.button>

        {/* User Profile Avatar Link */}
        <Link
          to="/onboarding"
          className="p-1 rounded-full border border-border hover:border-brand-primary/50 transition-colors flex items-center"
          title="Profile & Curriculum Settings"
        >
          <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
        </Link>

      </div>

      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm" onClick={() => setShowTopUp(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-widest text-brand-primary">GYANSETU wallet</p><h2 className="mt-1 text-xl font-extrabold text-content-primary">Keep learning</h2><p className="mt-2 text-xs leading-relaxed text-content-muted">Credits are a prototype usage meter. Real payment checkout is not connected in this local build.</p></div>
              <button type="button" onClick={() => setShowTopUp(false)} className="text-content-muted hover:text-content-primary">×</button>
            </div>
            <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-primary to-indigo-500 p-4 text-white"><span className="text-xs opacity-80">Current balance</span><div className="mt-1 text-3xl font-extrabold">{credits} credits</div></div>
            <button type="button" onClick={() => topUp(100)} className="mt-4 w-full rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-primary-hover transition-colors">Add 100 demo credits</button>
            <p className="mt-3 text-center text-[10px] text-content-muted">Tutor question: 5 credits · Image doubt: 10 credits</p>
          </div>
        </div>
      )}
    </header>
  );
}
