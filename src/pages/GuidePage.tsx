import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ChevronRight, Hash, Star, Zap, Target, Shield, Compass, CheckCircle2, XCircle, HelpCircle, Trophy } from 'lucide-react';
import { guideSections } from '../data/guideSections';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import GlossaryText from '../components/GlossaryText';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple quiz data mapped to section IDs
const sectionQuizzes: Record<string, { question: string, options: string[], answer: number, explanation: string }> = {
  'intro': {
    question: 'What is the ultimate goal of the EPIMETHEUS System?',
    options: ['Getting her phone number', 'Falling in love', 'Total Devotion', 'Having a successful first date'],
    answer: 2,
    explanation: 'The goal is Total Devotion—getting her to prioritize you above all else and support your journey.'
  },
  'the-box': {
    question: 'What does "The Box" represent in this system?',
    options: ['Her physical appearance', 'Her unique personality and core conflicts', 'The societal pressure she faces', 'Her past relationships'],
    answer: 1,
    explanation: 'The Box represents her unique combination of the Time, Sex, and Relationship lines.'
  },
  'the-key': {
    question: 'What is the "Key" used to unlock her Box?',
    options: ['Expensive gifts', 'The Emotional Trigger Sequence (ETS)', 'Ignoring her', 'Agreeing with everything she says'],
    answer: 1,
    explanation: 'The Key is the ETS—triggering Intrigue, Comfort, Arousal, and Devotion in the correct order for her specific type.'
  },
  'conflicts': {
    question: 'Which conflict defines the "Time Line"?',
    options: ['Denier vs. Justifier', 'Realist vs. Idealist', 'Tester vs. Investor', 'Logic vs. Emotion'],
    answer: 2,
    explanation: 'The Time Line is the conflict between testing multiple options (Tester) or investing deeply in one (Investor).'
  }
};

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState(guideSections[0].id);
  const activeSection = guideSections.find(s => s.id === activeTab) || guideSections[0];
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  
  // Progress tracking state
  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('epimetheus_guide_progress');
    return saved ? JSON.parse(saved) : [];
  });

  const currentQuiz = sectionQuizzes[activeTab];
  const progressPercentage = Math.round((completedSections.length / guideSections.length) * 100);

  // Save progress to local storage
  useEffect(() => {
    localStorage.setItem('epimetheus_guide_progress', JSON.stringify(completedSections));
  }, [completedSections]);

  const markSectionComplete = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer !== null) {
      setIsAnswerChecked(true);
      if (currentQuiz && selectedAnswer === currentQuiz.answer) {
        markSectionComplete(activeTab);
      }
    }
  };

  const resetQuiz = () => {
    setShowQuiz(false);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
  };

  // Reset quiz state when changing tabs
  React.useEffect(() => {
    resetQuiz();
  }, [activeTab]);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">The Strategy Guide</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Master the core principles of the EPIMETHEUS system. From initial approach to long-term devotion.
        </p>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent-primary" />
              Mastery Progress
            </span>
            <span className="text-sm font-bold text-accent-primary">{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full accent-gradient rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation */}
        <div className="lg:col-span-4 space-y-2">
          {guideSections.map((section) => {
            const isCompleted = completedSections.includes(section.id);
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-all group text-left",
                  activeTab === section.id
                    ? "bg-accent-primary/10 border border-accent-primary/20 text-accent-primary"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0",
                  activeTab === section.id ? "accent-gradient text-white" : "bg-white/5 text-slate-500 group-hover:text-slate-300"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Book className="w-5 h-5" />}
                </div>
                <span className="font-bold text-lg truncate">{section.title}</span>
                <ChevronRight className={cn(
                  "w-5 h-5 ml-auto transition-transform shrink-0",
                  activeTab === section.id ? "translate-x-1" : "opacity-0"
                )} />
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 md:p-12 space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold">{activeSection.title}</h2>
              <div className="h-1 w-20 accent-gradient rounded-full" />
            </div>

            <div className="prose prose-invert prose-accent max-w-none">
              {activeSection.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-3xl font-bold text-white mt-8 mb-4"><GlossaryText text={line.substring(2)} /></h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-2xl font-bold text-accent-primary mt-8 mb-4"><GlossaryText text={line.substring(3)} /></h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xl font-bold text-slate-200 mt-6 mb-3"><GlossaryText text={line.substring(4)} /></h3>;
                }
                if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                  return <p key={i} className="text-lg text-slate-300 leading-relaxed font-bold mt-6"><GlossaryText text={line} /></p>;
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={i} className="flex gap-3 items-start mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2.5 shrink-0" />
                      <p className="text-slate-400 leading-relaxed"><GlossaryText text={line.substring(2)} /></p>
                    </div>
                  );
                }
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="text-lg text-slate-400 leading-relaxed mt-4"><GlossaryText text={line} /></p>;
              })}
            </div>

            {/* Contextual Tips & Completion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-white/5">
              <div className="p-4 rounded-xl bg-accent-secondary/5 border border-accent-secondary/10 flex gap-4">
                <Zap className="w-5 h-5 text-accent-secondary shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-accent-secondary text-sm">Pro Tip</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Always prioritize calibration over technique. If she seems uncomfortable, back off.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/10 flex gap-4">
                <Star className="w-5 h-5 text-accent-primary shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-accent-primary text-sm">Key Concept</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">The "Us-Frame" is your most powerful tool for creating long-term devotion.</p>
                </div>
              </div>
            </div>
            
            {!currentQuiz && !completedSections.includes(activeTab) && (
              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => markSectionComplete(activeTab)}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Mark as Read
                </button>
              </div>
            )}
          </motion.div>

          {/* Interactive Knowledge Check */}
          {currentQuiz && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8 border-accent-primary/20"
            >
              {!showQuiz ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Knowledge Check</h3>
                      <p className="text-sm text-slate-400">Test your understanding of this section.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors"
                  >
                    Start Quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{currentQuiz.question}</h3>
                    <button onClick={resetQuiz} className="text-slate-500 hover:text-white">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {currentQuiz.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === currentQuiz.answer;
                      const showStatus = isAnswerChecked;
                      
                      let buttonClass = "w-full text-left p-4 rounded-xl border transition-all ";
                      
                      if (!showStatus) {
                        buttonClass += isSelected 
                          ? "bg-accent-primary/20 border-accent-primary text-white" 
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                      } else {
                        if (isCorrect) {
                          buttonClass += "bg-green-500/20 border-green-500 text-white";
                        } else if (isSelected && !isCorrect) {
                          buttonClass += "bg-red-500/20 border-red-500 text-white";
                        } else {
                          buttonClass += "bg-white/5 border-white/10 text-slate-500 opacity-50";
                        }
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => !isAnswerChecked && setSelectedAnswer(index)}
                          disabled={isAnswerChecked}
                          className={buttonClass}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {showStatus && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {showStatus && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {isAnswerChecked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <p className="text-sm text-slate-300">
                          <span className="font-bold text-accent-primary mr-2">Explanation:</span>
                          {currentQuiz.explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isAnswerChecked && (
                    <button
                      onClick={handleCheckAnswer}
                      disabled={selectedAnswer === null}
                      className="w-full py-3 rounded-xl accent-gradient text-white font-bold disabled:opacity-50 transition-opacity"
                    >
                      Check Answer
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
