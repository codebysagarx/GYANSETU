import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Award, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditsContext.jsx';

export default function QuizzesPage() {
  const { user } = useAuth();
  const { spend } = useCredits();

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedQuiz, setSubmittedQuiz] = useState(null);

  // Past Quizzes State
  const [pastQuizzes, setPastQuizzes] = useState([]);

  const documentedTopics = [
    { name: "Deadlock Conditions & Banker's Algorithm", subject: "Operating Systems (OS)" },
    { name: "Virtual Memory & Paging Address Translation", subject: "Operating Systems (OS)" },
    { name: "Database Normalization (1NF to BCNF)", subject: "Database Management Systems (DBMS)" },
    { name: "Two-Phase Locking (2PL) & Transactions", subject: "Database Management Systems (DBMS)" },
    { name: "Pigeonhole Principle & Propositional Logic", subject: "Mathematics" }
  ];

  useEffect(() => {
    loadSubjects();
    loadPastQuizzes();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPastQuizzes = async () => {
    try {
      const data = await api.getUserQuizzes();
      setPastQuizzes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!spend(8)) return;
    if (!topic.trim()) return;

    setGenerating(true);
    setErrorMsg('');
    try {
      const quiz = await api.generateQuiz({
        topic: topic.trim(),
        difficulty,
        subject_id: selectedSubjectId || undefined,
        num_questions: 5,
      });
      setActiveQuiz(quiz);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setSubmittedQuiz(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId, optionIdx) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const result = await api.submitQuiz(activeQuiz.id, {
        answers: selectedAnswers,
      });
      setSubmittedQuiz(result);
      loadPastQuizzes();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = activeQuiz?.questions?.[currentQuestionIdx];
  const totalQuestions = activeQuiz?.questions?.length || 0;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 antialiased">
      
      {/* Top Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary">
              AI Concept Quizzes
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-0.5">
              Generate curriculum assessments with instant evaluation and detailed explanations.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================================================
          1. ACTIVE QUIZ TEST RUNNER OR RESULTS
          ================================================== */}
      {activeQuiz ? (
        <div className="space-y-6">
          
          {/* Header Card with Progress Bar */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                  {activeQuiz.topic}
                </span>
                <span className="ml-2 text-xs font-semibold text-content-muted capitalize">
                  • {activeQuiz.difficulty} Difficulty
                </span>
              </div>

              <div className="text-xs font-bold text-content-primary">
                Question {currentQuestionIdx + 1} of {totalQuestions}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-brand-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Question Quick Nav Chips */}
            <div className="flex items-center gap-2 pt-1">
              {activeQuiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-brand-primary text-white shadow-xs'
                        : isAnswered
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'bg-surface-secondary text-content-muted hover:text-content-primary'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Card */}
          {currentQ && !submittedQuiz && (
            <motion.div 
              key={currentQ.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-6"
            >
              <h2 className="text-base sm:text-lg font-bold text-content-primary leading-snug">
                {currentQuestionIdx + 1}. {currentQ.question_text}
              </h2>

              {/* Options Radio List */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;
                  return (
                    <motion.button
                      key={optIdx}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-xs'
                          : 'border-border/80 bg-main text-content-primary hover:border-brand-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-brand-primary text-white' : 'bg-surface-secondary text-content-muted'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-border'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer Controls: Prev, Next, Submit */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-content-muted hover:text-content-primary disabled:opacity-40"
                >
                  Previous
                </button>

                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs"
                  >
                    Next Question
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={submitting || answeredCount < totalQuestions}
                    onClick={handleSubmitQuiz}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white text-xs font-bold shadow-xs hover:shadow-brand-primary/20 disabled:opacity-50"
                  >
                    {submitting ? 'Grading Assessment...' : 'Submit & Grade Quiz'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================================================
              RESULTS BREAKDOWN VIEW
              ================================================== */}
          {submittedQuiz && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Score Banner */}
              <div className="p-8 rounded-2xl border border-brand-primary/30 bg-gradient-to-tr from-brand-primary/10 via-surface to-brand-secondary/10 shadow-xs text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-extrabold text-content-primary">
                  Quiz Completed!
                </h2>

                <p className="text-3xl font-extrabold text-brand-primary">
                  {submittedQuiz.score} / {submittedQuiz.total_questions}
                  <span className="text-sm font-semibold text-content-muted ml-2">
                    ({Math.round((submittedQuiz.score / submittedQuiz.total_questions) * 100)}% Retention)
                  </span>
                </p>

                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    setSubmittedQuiz(null);
                  }}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs transition-colors"
                >
                  Take Another Assessment
                </button>
              </div>

              {/* Explanations List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-content-muted px-1">
                  Answer Explanations & Rationale
                </h3>

                {submittedQuiz.questions?.map((q, idx) => {
                  const studentAns = selectedAnswers[q.id];
                  const isCorrect = studentAns === q.correct_option;

                  return (
                    <div 
                      key={q.id}
                      className={`p-6 rounded-2xl border shadow-xs space-y-3 ${
                        isCorrect ? 'border-status-success/40 bg-status-success/5' : 'border-status-error/40 bg-status-error/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-status-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-status-error" />
                        )}
                        <h4 className="text-xs sm:text-sm font-bold text-content-primary">
                          {idx + 1}. {q.question_text}
                        </h4>
                      </div>

                      <div className="text-xs space-y-1 pl-7">
                        <p className="text-content-muted">
                          Your Answer: <strong>{q.options[studentAns] || 'Not answered'}</strong>
                        </p>
                        {!isCorrect && (
                          <p className="text-status-success font-semibold">
                            Correct Answer: <strong>{q.options[q.correct_option]}</strong>
                          </p>
                        )}
                        <p className="text-content-primary pt-2 leading-relaxed bg-surface/70 p-3 rounded-xl border border-border/60">
                          <strong>Academic Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}

        </div>
      ) : (
        /* ==================================================
            2. QUIZ GENERATOR CONFIGURATION VIEW
            ================================================== */
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-content-primary">
                Configure New Concept Assessment
              </h2>
              <p className="text-xs text-content-muted mt-1">
                Select a topic from your curriculum subjects or choose one of the pre-set topics below.
              </p>
            </div>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              
              {/* Topic Input */}
              <div>
                <label className="block text-xs font-bold text-content-primary mb-1">
                  Assessment Topic <span className="text-status-error">*</span>
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-brand-primary absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Banker's Algorithm safe state in Operating Systems"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-main text-xs sm:text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Curated Documented Topics */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
                  Suggested Curriculum Topics:
                </span>
                <div className="flex flex-wrap gap-2">
                  {documentedTopics.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(item.name)}
                      className="text-[11px] px-3 py-1.5 rounded-xl border border-border bg-surface-secondary/60 hover:border-brand-primary/40 text-content-primary transition-all text-left"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Segmented Control */}
              <div>
                <label className="block text-xs font-bold text-content-primary mb-1">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        difficulty === d
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-xs'
                          : 'border-border bg-main text-content-muted hover:text-content-primary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={generating || !topic.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-brand-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>{generating ? 'Synthesizing 5 MCQs...' : 'Generate 5-Question Assessment'}</span>
                </motion.button>
              </div>

            </form>
          </div>

          {/* Past Completed Quizzes History */}
          {pastQuizzes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted px-1">
                Completed Assessments ({pastQuizzes.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pastQuizzes.map((pq) => (
                  <div 
                    key={pq.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-content-primary">{pq.topic}</h4>
                      <p className="text-[10px] text-content-muted">
                        Score: <strong>{pq.score} / {pq.total_questions}</strong> ({Math.round((pq.score / pq.total_questions) * 100)}%)
                      </p>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase">
                      {pq.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
