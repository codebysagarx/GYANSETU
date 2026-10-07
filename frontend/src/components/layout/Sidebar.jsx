import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  LayoutDashboard, 
  HelpCircle, 
  CheckSquare, 
  FileText, 
  BookOpen, 
  ShieldAlert, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const coreNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Tutor', path: '/tutor', icon: Sparkles, badge: 'AI', accent: 'from-indigo-500 to-sky-500' },
    { name: 'Doubt Forum', path: '/doubts', icon: HelpCircle },
    { name: 'AI Quizzes', path: '/quizzes', icon: CheckSquare },
  ];

  const toolsNavItems = [
    { name: 'Ask My Notes', path: '/notes', icon: FileText, badge: 'RAG' },
    { name: 'My Learning', path: '/my-learning', icon: BookOpen },
  ];

  if (isAdmin) {
    toolsNavItems.push({ name: 'Admin Portal', path: '/admin', icon: ShieldAlert, badge: 'Admin' });
  }

  const renderNavGroup = (title, items) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-content-muted/80">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        
        return (
          <Link
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.name : undefined}
            className={`relative flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
              isActive
                ? 'bg-brand-primary/10 text-brand-primary font-bold shadow-xs'
                : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary/80'
            }`}
          >
            {/* Active Pill Left Accent */}
            {isActive && (
              <motion.div
                layoutId="sidebarActivePill"
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-primary"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className={`p-1 rounded-lg transition-transform group-hover:scale-110 ${
                isActive ? 'text-brand-primary bg-brand-primary/15' : 'text-content-muted'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                    isActive ? 'bg-brand-primary text-white' : 'bg-surface-secondary text-content-muted'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside 
      className={`border-r border-border bg-surface flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className={`h-16 border-b border-border/80 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-content-primary leading-tight">
                    GYANSETU
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-brand-primary/10 text-brand-primary">
                    AI
                  </span>
                </div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-content-muted truncate">
                  Smart Education
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors hidden md:block lg:hidden"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-5 overflow-y-auto">
          {renderNavGroup('Academic Hub', coreNavItems)}
          {renderNavGroup('Study Tools', toolsNavItems)}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-border/80 bg-surface/50">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl border border-border/80 bg-surface-secondary/40 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-content-primary truncate leading-tight">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-content-muted truncate font-medium">
                  {user?.role === 'ADMIN' ? 'Faculty Admin' : user?.semester || 'Student'}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-1.5 text-content-muted hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-bold flex items-center justify-center text-xs shadow-xs"
              title={user?.full_name}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-1.5 text-content-muted hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
    </aside>
  );
}
