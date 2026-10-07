import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Sparkles, 
  HelpCircle, 
  CheckSquare, 
  FileText, 
  BookOpen 
} from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const tabs = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Tutor', path: '/tutor', icon: Sparkles, badge: 'AI' },
    { name: 'Doubts', path: '/doubts', icon: HelpCircle },
    { name: 'Quizzes', path: '/quizzes', icon: CheckSquare },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'Analytics', path: '/my-learning', icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path || (tab.path !== '/dashboard' && location.pathname.startsWith(tab.path));
        
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 py-1 rounded-xl transition-all ${
              isActive
                ? 'text-brand-primary font-bold'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="mobileActiveDock"
                className="absolute inset-0 bg-brand-primary/10 rounded-xl"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <div className="relative flex items-center justify-center">
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-brand-primary' : ''}`} />
              {tab.badge && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8px] font-extrabold uppercase bg-brand-primary text-white scale-75">
                  {tab.badge}
                </span>
              )}
            </div>
            
            <span className="relative mt-1 text-[10px] font-medium leading-none truncate max-w-[50px]">
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
