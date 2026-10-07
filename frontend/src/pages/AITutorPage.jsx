import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Bot, 
  MessageSquare,
  BookOpen,
  Lightbulb,
  FileText,
  CheckCircle,
  HelpCircle,
  Search,
  RotateCcw,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  CornerDownLeft
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditsContext';

export default function AITutorPage() {
  const { user } = useAuth();
  const { credits, spend, setShowTopUp } = useCredits();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Exact Documented Modes: Explain, Simplify, Summarize, Exam Answer
  const [mode, setMode] = useState('explain');
  const [selectedSubject, setSelectedSubject] = useState('Operating Systems (OS)');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

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

  const documentedPrompts = [
    { text: "Explain virtual memory paging and page tables", subject: "Operating Systems (OS)", mode: "explain" },
    { text: "Simplify the concept of deadlock and circular wait", subject: "Operating Systems (OS)", mode: "simplify" },
    { text: "Summarize 1NF, 2NF, 3NF, and BCNF normalization", subject: "Database Management Systems (DBMS)", mode: "summarize" },
    { text: "Exam answer for Two-Phase Locking (2PL) protocol", subject: "Database Management Systems (DBMS)", mode: "exam_answer" },
    { text: "Explain the Pigeonhole Principle with an example", subject: "Mathematics", mode: "explain" }
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (location.state?.initialPrompt) {
      setInputMessage(location.state.initialPrompt);
      if (location.state.initialMode) setMode(location.state.initialMode);
      if (location.state.initialSubject) setSelectedSubject(location.state.initialSubject);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const data = await api.getTutorSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        selectSession(data[0].id);
      } else if (data.length === 0) {
        createNewSession();
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  const selectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const session = await api.getTutorSessionDetail(sessionId);
      setMessages(session.messages || []);
      setMode(session.mode || 'explain');
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  const createNewSession = async () => {
    try {
      const newSession = await api.createTutorSession({
        title: 'New Academic Discussion',
        mode: mode,
      });
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.deleteTutorSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          createNewSession();
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !activeSessionId || imageUploading) return;
    if (!spend(10)) return;
    setImageUploading(true); setLoading(true);
    try {
      const form = new FormData(); form.append('image', selectedImage); form.append('mode', mode);
      const answer = await api.sendTutorImage(activeSessionId, form);
      setMessages((prev) => [...prev, { id: `image-${Date.now()}`, role: 'user', content: `Uploaded doubt image: ${selectedImage.name}`, created_at: new Date().toISOString() }, answer]);
      setSelectedImage(null); setImagePreview('');
    } catch (err) {
      setMessages((prev) => [...prev, { id: `image-err-${Date.now()}`, role: 'assistant', content: `⚠️ ${err.message || 'Image analysis failed. Configure an AI provider to analyze images.'}`, created_at: new Date().toISOString() }]);
    } finally { setImageUploading(false); setLoading(false); }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading || !activeSessionId) return;
    if (!spend(5)) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const assistantMsg = await api.sendTutorMessage(activeSessionId, {
        content: userText,
        mode: mode,
      });
      setMessages((prev) => [...prev, assistantMsg]);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: userText.slice(0, 32) + (userText.length > 32 ? '...' : '') }
            : s
        )
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Unable to connect to AI Tutor. Please check your connection and retry.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-border bg-surface shadow-sm relative">
        
        {/* ==================================================
            1. SESSIONS HISTORY SIDEBAR
            ================================================== */}
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border-r border-border bg-surface-secondary/40 flex flex-col shrink-0 overflow-hidden select-none"
            >
              {/* Sidebar Header */}
              <div className="p-3.5 border-b border-border/80 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Conversations
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createNewSession}
                  className="px-2.5 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-brand-primary-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </motion.button>
              </div>

              {/* Search Sessions */}
              <div className="p-2.5 border-b border-border/60">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search history..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/70 bg-surface text-xs text-content-primary placeholder:text-content-muted/70 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredSessions.map((s) => {
                  const isActive = activeSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-all group ${
                        isActive
                          ? 'bg-brand-primary/10 text-brand-primary shadow-xs'
                          : 'text-content-muted hover:bg-surface hover:text-content-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-primary' : 'text-content-muted'}`} />
                        <span className="truncate">{s.title || 'Academic Discussion'}</span>
                      </div>
                      <button
                        onClick={(e) => deleteSession(e, s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-status-error hover:bg-status-error/10 transition-opacity shrink-0"
                        title="Delete chat session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ==================================================
            2. CHAT CANVAS & COMPOSER
            ================================================== */}
        <main className="flex-1 flex flex-col overflow-hidden bg-main min-w-0">
          
          {/* Top Control Bar */}
          <div className="p-3 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="absolute right-3 top-3 hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">⚡ {credits} credits <button type="button" onClick={() => setShowTopUp(true)} className="underline">Top up</button></div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 rounded-lg border border-border text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
                title={showSidebar ? "Hide History" : "Show History"}
              >
                {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-secondary text-xs font-semibold text-content-muted">
                <span className="text-[11px] uppercase tracking-wider font-bold">Subject:</span>
                <span className="text-content-primary font-bold">{selectedSubject}</span>
              </div>
            </div>

            {/* Mode Selector Segmented Tabs */}
            <div className="flex items-center gap-1 bg-surface-secondary/70 p-1 rounded-xl border border-border/60">
              {documentedModes.map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'text-content-muted hover:text-content-primary'
                    }`}
                    title={m.desc}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Messages Scroll Thread */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 mb-4 animate-pulse">
                  <Sparkles className="w-7 h-7" />
                </div>
                
                <h2 className="text-xl font-extrabold text-content-primary tracking-tight">
                  GYANSETU AI Academic Tutor
                </h2>
                
                <p className="mt-1.5 text-xs text-content-muted leading-relaxed max-w-md">
                  Active in <strong className="text-brand-primary">{mode.replace('_', ' ').toUpperCase()}</strong> mode for <strong className="text-content-primary">{selectedSubject}</strong>. Ask any concept question to receive structured curriculum answers.
                </p>

                {/* Prompt Suggestion Chips */}
                <div className="mt-6 w-full space-y-2 text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted px-1">
                    Select a core inquiry to begin:
                  </span>
                  
                  {documentedPrompts.map((p, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setInputMessage(p.text);
                        setSelectedSubject(p.subject);
                        setMode(p.mode);
                      }}
                      className="w-full p-3 rounded-xl border border-border/80 bg-surface hover:border-brand-primary/40 text-content-primary transition-all text-left flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="text-xs font-semibold truncate">"{p.text}"</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/10 text-brand-primary">
                          {p.mode.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-secondary text-content-muted">
                          {p.subject.split(' ')[0]}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                        isUser
                          ? 'bg-brand-primary text-white rounded-tr-xs'
                          : 'bg-surface border border-border text-content-primary rounded-tl-xs'
                      }`}
                    >
                      {/* Copy Action for Assistant */}
                      {!isUser && (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/60 text-[10px] text-content-muted">
                          <span className="font-bold uppercase tracking-wider text-brand-primary">
                            GYANSETU AI Solution
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.content, idx)}
                            className="p-1 rounded hover:text-content-primary hover:bg-surface-secondary transition-colors flex items-center gap-1"
                            title="Copy response"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-status-success" />
                                <span className="text-status-success font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed font-normal">
                        {msg.content}
                      </div>

                      <div className={`mt-2 text-[10px] ${isUser ? 'text-white/70 text-right' : 'text-content-muted'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-surface-secondary border border-border text-content-primary flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}

            {/* Thinking / Synthesizing Indicator */}
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start items-center"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-xs border border-border bg-surface text-content-muted text-xs flex items-center gap-2.5 shadow-xs">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" />
                  </div>
                  <span className="font-semibold text-content-primary">
                    GYANSETU AI is reading your question, checking the context, and preparing a {mode.replace('_', ' ')} response...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ==================================================
              3. FLOATING CHAT COMPOSER
              ================================================== */}
          <div className="p-3 sm:p-4 border-t border-border bg-surface shrink-0">
            <form 
              onSubmit={handleSendMessage} 
              className="max-w-4xl mx-auto rounded-2xl border border-border bg-surface-secondary/40 p-2 shadow-xs focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all"
            >
              <div className="flex items-center gap-2 px-2 pb-1.5 pt-1 text-[11px] text-content-muted border-b border-border/40">
                <span className="font-bold text-brand-primary uppercase tracking-wider">{mode.replace('_', ' ')}:</span>
                <span className="truncate">{selectedSubject}</span>
              </div>

              {imagePreview && (
                <div className="mx-2 mb-2 flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-white p-2 text-[11px] text-content-muted">
                  <img src={imagePreview} alt="Doubt preview" className="h-12 w-12 rounded-lg object-cover" />
                  <span className="flex-1 truncate">{selectedImage?.name}</span>
                  <button type="button" onClick={handleImageUpload} disabled={imageUploading} className="rounded-lg bg-brand-primary px-2.5 py-1.5 font-bold text-white disabled:opacity-50">{imageUploading ? 'Reading…' : 'Solve image · 10'}</button>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1.5">
                <label className="cursor-pointer rounded-xl p-2 text-content-muted hover:bg-brand-primary/10 hover:text-brand-primary" title="Upload a picture of your doubt">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if(f){setSelectedImage(f);setImagePreview(URL.createObjectURL(f));} }} />
                  📷
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask an academic question in '${mode.replace('_', ' ')}' mode...`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-content-primary focus:outline-none placeholder:text-content-muted/70"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="hidden sm:flex items-center justify-between px-2 pt-1 text-[10px] text-content-muted/70">
                <span>Press <strong>Enter ↵</strong> to send message</span>
                <span>GYANSETU Academic Grounding</span>
              </div>
            </form>
          </div>

        </main>

      </div>
    </div>
  );
}
