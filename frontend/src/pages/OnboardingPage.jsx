import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, GraduationCap, ArrowRight, Check, BookOpen } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(user?.course || 'Computer Science');
  const [semester, setSemester] = useState(user?.semester || 'Semester 5');
  const [selectedSubjects, setSelectedSubjects] = useState(
    user?.subjects || ['Operating Systems (OS)', 'Database Management Systems (DBMS)', 'Mathematics']
  );
  const [learningGoal, setLearningGoal] = useState(
    user?.learning_goal || 'Understand core curriculum concepts and prepare for semester examinations'
  );
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const list = await api.getSubjects();
        setAvailableSubjects(list);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    }
    loadSubjects();
  }, []);

  const toggleSubject = (name) => {
    if (selectedSubjects.includes(name)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== name));
    } else {
      setSelectedSubjects([...selectedSubjects, name]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await api.updateProfile({
        course,
        semester,
        subjects: selectedSubjects,
        learning_goal: learningGoal,
      });
      updateUser(updated);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to update onboarding profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const semestersList = [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 antialiased">
      
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary items-center justify-center text-white shadow-md">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-content-primary">
          Academic Profile & Curriculum Setup
        </h1>
        <p className="text-xs text-content-muted max-w-md mx-auto leading-relaxed">
          Configure your engineering degree, semester, and curriculum subjects to personalize your AI Tutor and doubt feeds.
        </p>
      </div>

      {/* Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Course / Branch */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1">
              Course / Degree Branch <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              required
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-main text-xs sm:text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          {/* Semester Selector */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1">
              Current Semester <span className="text-status-error">*</span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-main text-xs sm:text-sm font-semibold text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              {semestersList.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Subjects Selection */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1">
              Enrolled Curriculum Subjects
            </label>
            <p className="text-[11px] text-content-muted mb-2">
              Select the subjects you are studying this semester:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableSubjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.name);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubject(sub.name)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-xs'
                        : 'border-border bg-main text-content-muted hover:border-brand-primary/30 hover:text-content-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sub.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning Goal */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1">
              Primary Academic Learning Goal
            </label>
            <textarea
              rows={3}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="e.g. Master core algorithms and prepare for university semester examinations"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-main text-xs sm:text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs sm:text-sm font-bold hover:bg-brand-primary-hover shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Saving Preferences...' : 'Save & Enter Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

        </form>
      </motion.div>

    </div>
  );
}
