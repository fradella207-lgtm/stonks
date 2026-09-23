/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MessageSquarePlus,
  Lightbulb,
  Bug,
  Sparkles,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, UserFeedback } from '../types.ts';
import { db } from '../services/firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

const STORAGE_KEY = 'stonks_user_feedback_v1';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user }) => {
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'improvement'>('suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Load previous local feedback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFeedbackList(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user, contactEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    const newFeedback: UserFeedback = {
      id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: feedbackType,
      title: title.trim(),
      description: description.trim(),
      priority,
      createdAt: new Date().toISOString(),
      userEmail: contactEmail.trim() || null,
      status: 'sent',
    };

    // Save locally
    const updatedList = [newFeedback, ...feedbackList];
    setFeedbackList(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    // Try Firestore if available
    try {
      if (db) {
        await addDoc(collection(db, 'feedback'), {
          ...newFeedback,
          userId: user?.uid || 'anonymous',
          timestamp: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('Feedback not synced to Firestore (saved locally):', err);
    }

    setIsSubmitting(false);
    setSubmittedSuccess(true);
    setTitle('');
    setDescription('');

    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('history');
    }, 1800);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'suggestion':
        return { label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 'bug':
        return { label: 'Bug Report', icon: Bug, color: 'text-red-500 bg-red-500/10 border-red-500/20' };
      default:
        return { label: 'Improvement', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-lg rounded-3xl border border-app bg-app-modal text-app-main p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-app-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-app-subtle border border-app flex items-center justify-center text-red-500">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-app-main tracking-tight font-mono-code">
                FEEDBACK & SUGGESTIONS
              </h2>
              <p className="text-xs text-app-muted">
                Help improve Stonks with your ideas or by reporting an issue
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-app-subtle hover:bg-app-hover text-app-muted hover:text-app-main transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-app-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer text-center ${
              activeTab === 'form'
                ? 'bg-app-main text-app-canvas shadow-xs'
                : 'bg-app-subtle text-app-muted hover:text-app-main'
            }`}
          >
            New Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-app-main text-app-canvas shadow-xs'
                : 'bg-app-subtle text-app-muted hover:text-app-main'
            }`}
          >
            <span>My Feedback</span>
            {feedbackList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold">
                {feedbackList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 py-3 pr-1 space-y-4">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type Selector */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase font-bold text-app-muted mb-1.5">
                  Type of Feedback
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('suggestion')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center text-center ${
                      feedbackType === 'suggestion'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-app-subtle border-app text-app-muted hover:text-app-main'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 mb-1 text-amber-500" />
                    <span className="text-xs font-mono-code">Idea / Feature</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center text-center ${
                      feedbackType === 'bug'
                        ? 'bg-red-500/15 border-red-500/50 text-red-600 dark:text-red-400 font-bold'
                        : 'bg-app-subtle border-app text-app-muted hover:text-app-main'
                    }`}
                  >
                    <Bug className="w-4 h-4 mb-1 text-red-500" />
                    <span className="text-xs font-mono-code">Bug Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('improvement')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center text-center ${
                      feedbackType === 'improvement'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'bg-app-subtle border-app text-app-muted hover:text-app-main'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1 text-emerald-500" />
                    <span className="text-xs font-mono-code">Enhancement</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase font-bold text-app-muted mb-1.5">
                  Summary Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Export report as PDF, Monthly budget notification..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-app-input border border-app text-app-main placeholder:text-app-muted text-xs font-mono-code focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase font-bold text-app-muted mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the feature you'd like or what unexpected behavior you encountered..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-app-input border border-app text-app-main placeholder:text-app-muted text-xs font-mono-code focus:outline-none focus:border-red-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Priority & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-code uppercase font-bold text-app-muted mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3.5 py-2 rounded-2xl bg-app-input border border-app text-app-main text-xs font-mono-code focus:outline-none"
                  >
                    <option value="low">Low • Future Idea</option>
                    <option value="medium">Medium • Recommended</option>
                    <option value="high">High • Blocking Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono-code uppercase font-bold text-app-muted mb-1.5">
                    Your Contact Email (optional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 rounded-2xl bg-app-input border border-app text-app-main placeholder:text-app-muted text-xs font-mono-code focus:outline-none"
                  />
                </div>
              </div>

              {/* Success Notification Banner */}
              <AnimatePresence>
                {submittedSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-mono-code flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Feedback submitted successfully! Thank you for helping us improve Stonks.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono-code font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {feedbackList.length === 0 ? (
                <div className="text-center py-8 text-app-muted text-xs font-mono-code space-y-2">
                  <MessageSquarePlus className="w-8 h-8 mx-auto opacity-40 text-app-muted" />
                  <p>You have not submitted any feedback from this device yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="text-red-500 hover:underline font-bold text-xs cursor-pointer"
                  >
                    Submit your first idea &rarr;
                  </button>
                </div>
              ) : (
                feedbackList.map((item) => {
                  const meta = getTypeLabel(item.type);
                  const Icon = meta.icon;
                  const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-app-subtle border border-app space-y-1.5 font-mono-code"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${meta.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{meta.label}</span>
                          </span>
                          <span className="text-[10px] text-app-muted">{dateStr}</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                          Submitted
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-app-main">{item.title}</h4>
                      <p className="text-[11px] text-app-sub leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
