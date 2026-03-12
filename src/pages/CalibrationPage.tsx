import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Send, Loader2, AlertCircle, Sparkles, 
  MessageSquare, UserCheck, Brain, Info, 
  CheckCircle2, Zap, Shield, HandMetal, Flame, Heart,
  History, PlayCircle, ChevronRight, ArrowRight, RotateCcw, Fingerprint,
  Clock, Filter, ArrowUpDown, CheckSquare, Square, ListTodo
} from 'lucide-react';
import { LogoIcon } from '../components/Logo';
import { personalityTypes } from '../data/personalityTypes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  category: 'communication' | 'physical' | 'logistics' | 'psychology';
}

interface AnalysisResult {
  primaryType: string;
  confidence: number;
  secondaryType: string | null;
  reasoning: string;
  indicators: string[];
  tasks: Task[];
  coldReader: string;
  howSheGetsWhatSheWants: string;
  whatToAvoid: string[];
  relationshipAdvice: {
    vision: string;
    investment: string;
    potential: string;
  };
  freakDynamics: {
    kink: string;
    threesomes: string;
    worship: string;
  };
  darkMindBreakdown: string;
  behavioralBlueprint: string;
}

interface AnalysisHistory extends AnalysisResult {
  id: string;
  date: string;
  scenarioSummary: string;
}

const practiceScenarios = [
  {
    id: 1,
    text: "She's wearing a modest but elegant dress. When you talk to her, she's polite but keeps her answers short and looks around the room a lot. She doesn't seem impressed when you compliment her outfit.",
    correctType: "TDI",
    explanation: "Modest dress and looking around (Observer) points to Denier. Unaffected by compliments and short attention span points to Tester. The elegant/modest combo often aligns with Idealist."
  },
  {
    id: 2,
    text: "She's the life of the party, talking to everyone. She has a visible tattoo and playfully punches your arm when you tease her. She gets bored quickly if the conversation gets too deep.",
    correctType: "TJI",
    explanation: "High energy, short attention span (Tester). Tattoos and aggressive touch (Justifier). Focus on fun over deep connection (Idealist)."
  },
  {
    id: 3,
    text: "She asks you a lot of questions about your career and goals. She's dressed very practically and insists on splitting the bill. She seems a bit guarded when you try to flirt.",
    correctType: "NDR",
    explanation: "Focus on goals/career and splitting bill (Realist). Guarded about flirting (Denier). Asking deep questions and focusing on you (Investor)."
  }
];

export default function CalibrationPage() {
  const [mode, setMode] = React.useState<'ai' | 'manual' | 'history' | 'practice'>('ai');
  
  // AI Oracle State
  const [structuredInput, setStructuredInput] = React.useState({
    eyeContact: '',
    conversationTopic: '',
    bodyLanguage: '',
    clothingStyle: '',
    additionalNotes: ''
  });

  const clearForm = () => {
    setStructuredInput({
      eyeContact: '',
      conversationTopic: '',
      bodyLanguage: '',
      clothingStyle: '',
      additionalNotes: ''
    });
    setAnalysis(null);
    setError(null);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const analysisRef = React.useRef<HTMLDivElement>(null);

  // Task Filtering & Sorting State
  const [taskFilter, setTaskFilter] = React.useState<'all' | 'completed' | 'pending'>('all');
  const [taskSort, setTaskSort] = React.useState<'priority' | 'dueDate' | 'category'>('priority');
  const [taskCategory, setTaskCategory] = React.useState<'all' | 'communication' | 'physical' | 'logistics' | 'psychology'>('all');

  const [taskSearch, setTaskSearch] = React.useState('');

  const filteredTasks = React.useMemo(() => {
    if (!analysis) return [];
    const tasks = analysis.tasks || [];
    return tasks.filter(task => {
      const statusMatch = taskFilter === 'all' || 
                        (taskFilter === 'completed' && task.completed) || 
                        (taskFilter === 'pending' && !task.completed);
      const categoryMatch = taskCategory === 'all' || task.category === taskCategory;
      const searchMatch = task.text.toLowerCase().includes(taskSearch.toLowerCase());
      return statusMatch && categoryMatch && searchMatch;
    }).sort((a, b) => {
      if (taskSort === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      if (taskSort === 'category') {
        return a.category.localeCompare(b.category);
      }
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [analysis, taskFilter, taskSort, taskCategory]);

  const toggleTask = async (taskId: string) => {
    if (!analysis) return;
    
    const updatedTasks = analysis.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    const updatedAnalysis = { ...analysis, tasks: updatedTasks };
    setAnalysis(updatedAnalysis);
    
    // Update history
    setHistory(prev => prev.map(item => {
      if (item.tasks.some(t => t.id === taskId)) {
        return { ...item, tasks: updatedTasks };
      }
      return item;
    }));

    // Update Firestore if user is logged in
    if (user) {
      const historyItem = history.find(h => h.tasks.some(t => t.id === taskId));
      if (historyItem && historyItem.id) {
        try {
          const docRef = doc(db, 'oracle_analyses', historyItem.id);
          await updateDoc(docRef, {
            'analysis.tasks': updatedTasks
          });
        } catch (err) {
          console.error("Failed to update task in Firestore:", err);
        }
      }
    }
  };

  const handleSaveImage = async () => {
    if (!analysisRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(analysisRef.current, {
        backgroundColor: '#0a0508',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `epimetheus-analysis-${analysis?.primaryType}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };
  
  // History State
  const { user } = useAuth();
  const [history, setHistory] = React.useState<AnalysisHistory[]>([]);

  React.useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'oracle_analyses'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedHistory: AnalysisHistory[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedHistory.push({
            ...data.analysis,
            id: doc.id,
            date: data.timestamp?.toDate().toLocaleDateString() || new Date().toLocaleDateString(),
            scenarioSummary: data.scenarioSummary
          });
        });
        
        // Sort by date descending
        const sorted = fetchedHistory.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setHistory(sorted);
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.warn("Firestore is offline. Could not fetch history.");
          // Fallback to local storage if offline
          const saved = localStorage.getItem('oracleHistory');
          if (saved) setHistory(JSON.parse(saved));
        } else {
          handleFirestoreError(error, OperationType.LIST, 'oracle_analyses');
        }
      }
    }
    fetchHistory();
  }, [user]);

  // Practice State
  const [currentScenarioIdx, setCurrentScenarioIdx] = React.useState(0);
  const [selectedType, setSelectedType] = React.useState('');
  const [showPracticeResult, setShowPracticeResult] = React.useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = React.useState(false);
  const [dynamicScenario, setDynamicScenario] = React.useState<{text: string, correctType: string, explanation: string} | null>(null);

  const generateDynamicScenario = async () => {
    setIsGeneratingScenario(true);
    setShowPracticeResult(false);
    setSelectedType('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API key is missing. Please add your Gemini API key to the Settings menu before publishing.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model: model,
        contents: "Generate a realistic social scenario for a woman that fits one of the 8 EPIMETHEUS types (TDI, TJI, TDR, TJR, NDI, NJI, NDR, NJR). Provide the scenario text, the correct type, and a brief explanation of why it fits that type based on the 3 axes (Time, Sex, Relationship).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              correctType: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["text", "correctType", "explanation"]
          }
        }
      });
      const result = JSON.parse(response.text || '{}');
      setDynamicScenario(result);
    } catch (err) {
      console.error("Failed to generate scenario:", err);
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('oracleHistory', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async () => {
    const hasInput = Object.values(structuredInput).some(val => typeof val === 'string' && val.trim() !== '');
    if (!hasInput) {
      setError("Please provide at least some details about the scenario.");
      return;
    }
    
    setIsLoading(true);
    setIsScanning(true);
    setError(null);

    const fullScenario = `
      Eye Contact: ${structuredInput.eyeContact || 'Not specified'}
      Conversation Topic: ${structuredInput.conversationTopic || 'Not specified'}
      Body Language: ${structuredInput.bodyLanguage || 'Not specified'}
      Clothing Style: ${structuredInput.clothingStyle || 'Not specified'}
      Additional Notes: ${structuredInput.additionalNotes || 'None'}
    `;

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API key is missing. Please add your Gemini API key to the Settings menu before publishing.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are the EPIMETHEUS Oracle, a master of female psychology and behavioral profiling. Your task is to analyze social scenarios using the EPIMETHEUS system by Yame Coaching.

      THE 8 TYPES & CORE DATA:
      - TDI (The Playette): Tester, Denier, Idealist. Cold Read: "You have a cool exterior but a deeply sensitive heart that few see."
      - TJI (The Social Butterfly): Tester, Justifier, Idealist. Cold Read: "You're the life of the party, but you use that energy to keep people at a distance."
      - TDR (The Private Dancer): Tester, Denier, Realist. Cold Read: "You're used to being the boss, but you secretly want someone you can finally relax around."
      - TJR (The Seductress): Tester, Justifier, Realist. Cold Read: "You use your sexuality as a weapon, but you're waiting for someone who can actually disarm you."
      - NDI (The Hopeful Romantic): Investor, Denier, Idealist. Cold Read: "You're looking for 'The One' and you size up every man as a long-term partner immediately."
      - NJI (The Cinderella): Investor, Justifier, Idealist. Cold Read: "You're a head-turner who knows it, but you're a victim of repeated heartbreak waiting for a prince."
      - NDR (The Connoisseur): Investor, Denier, Realist. Cold Read: "You have incredibly high standards because you're tired of people who don't meet your level of expertise."
      - NJR (The Modern Woman): Investor, Justifier, Realist. Cold Read: "You're independent and level-headed, looking for an equal partner, not a savior."

      ANALYSIS REQUIREMENTS:
      1. "coldReader": Provide a 2-3 sentence profound, eerie, and deeply resonant "mind-reading" statement tailored to the specific scenario and type.
      2. "howSheGetsWhatSheWants": Detail her specific manipulation, influence, or defense tactics. Be blunt and insightful.
      3. "tasks": Generate 5-7 actionable steps. Each must have a unique ID, priority (low/medium/high), a specific due date (YYYY-MM-DD), and a category (communication/physical/logistics/psychology).
      4. "darkMindBreakdown": A deep, psychological dive into her fears, motivations, and shadow self.
      5. "behavioralBlueprint": A 4-step tactical plan for the user to follow.

      TONE: Mysterious, authoritative, and clinical yet evocative. Avoid AI clichés.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: 'user', parts: [{ text: `Scenario Details:\n${fullScenario}` }] }],
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryType: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              secondaryType: { type: Type.STRING, nullable: true },
              reasoning: { type: Type.STRING },
              indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
              coldReader: { type: Type.STRING },
              howSheGetsWhatSheWants: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                    dueDate: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN },
                    category: { type: Type.STRING, enum: ['communication', 'physical', 'logistics', 'psychology'] }
                  },
                  required: ["id", "text", "priority", "dueDate", "completed", "category"]
                }
              },
              whatToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
              relationshipAdvice: {
                type: Type.OBJECT,
                properties: {
                  vision: { type: Type.STRING },
                  investment: { type: Type.STRING },
                  potential: { type: Type.STRING }
                },
                required: ["vision", "investment", "potential"]
              },
              freakDynamics: {
                type: Type.OBJECT,
                properties: {
                  kink: { type: Type.STRING },
                  threesomes: { type: Type.STRING },
                  worship: { type: Type.STRING }
                },
                required: ["kink", "threesomes", "worship"]
              },
              darkMindBreakdown: { type: Type.STRING },
              behavioralBlueprint: { type: Type.STRING }
            },
            required: ["primaryType", "confidence", "reasoning", "indicators", "coldReader", "howSheGetsWhatSheWants", "tasks", "whatToAvoid", "relationshipAdvice", "freakDynamics", "darkMindBreakdown", "behavioralBlueprint"]
          }
        }
      });

      const data = JSON.parse(result.text || '{}');
      setAnalysis(data);
      
      const scenarioSummary = structuredInput.additionalNotes.slice(0, 50) || structuredInput.clothingStyle || 'Guided Analysis';
      
      const newHistoryItem: AnalysisHistory = {
        ...data,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        scenarioSummary
      };
      
      setHistory([newHistoryItem, ...history]);
      
      if (user) {
        try {
          await addDoc(collection(db, 'oracle_analyses'), {
            userId: user.uid,
            analysis: data,
            scenarioSummary,
            timestamp: serverTimestamp()
          });
        } catch (dbErr) {
          if (dbErr instanceof Error && dbErr.message.includes('offline')) {
            console.warn("Firestore is offline. Could not save analysis to cloud.");
          } else {
            console.error("Failed to save analysis to Firestore:", dbErr);
            // Don't throw here, we still want to show the result to the user
          }
        }
      }
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('The Oracle is currently unavailable. Please check your API key or try again later.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsScanning(false);
    }
  };

  const manualClues = [
    {
      axis: 'Time Line',
      options: [
        { label: 'Tester (T)', clues: ['Shorter attention span', 'Multitasking/Texting', 'Unaffected by compliments', 'Surrounded by male friends', 'Changes topics rapidly'] },
        { label: 'Investor (N)', clues: ['Takes compliments seriously', 'Needs focused attention', 'Responds with deep eye contact', 'Asks about your future/goals'] }
      ]
    },
    {
      axis: 'Sex Line',
      options: [
        { label: 'Denier (D)', clues: ['Careful with health/safety', 'Religious/Conservative background', 'Shy about sex talk', 'Consistent with upbringing', 'Avoids aggressive touch'] },
        { label: 'Justifier (J)', clues: ['Has tattoos', 'Takes risks with safety', 'Talks about sex openly', 'Comfortable with aggressive touch', 'Rebels against upbringing'] }
      ]
    },
    {
      axis: 'Relationship Line',
      options: [
        { label: 'Realist (R)', clues: ['Career/Studies priority', 'Believes women are equals', 'Takes care of others', 'Flakes because of work', 'Had weaker male figures'] },
        { label: 'Idealist (I)', clues: ['Affluent/Spoiled upbringing', 'Plans wedding early', 'Expects to be pampered', 'Flakes to hang out with guys', 'Vivid imagination'] }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Scanning Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-mystic-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {/* Background scan lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)', backgroundSize: '100% 4px' }} />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer rotating rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-accent-primary/30 border-t-accent-primary border-r-accent-primary shadow-[0_0_30px_rgba(255,75,107,0.3)]"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-2 border-dashed border-accent-secondary/40 border-b-accent-secondary border-l-accent-secondary"
                />
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-8 rounded-full border border-white/10 bg-accent-primary/5 backdrop-blur-sm"
                />
                
                {/* Center Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.7, 1, 0.7],
                    filter: ['drop-shadow(0 0 15px rgba(255,75,107,0.3))', 'drop-shadow(0 0 30px rgba(255,75,107,0.9))', 'drop-shadow(0 0 15px rgba(255,75,107,0.3))']
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-20"
                >
                  <Brain className="w-24 h-24 text-accent-primary" strokeWidth={1.5} />
                </motion.div>
                
                {/* Scanning Line */}
                <motion.div
                  animate={{ 
                    top: ['-20%', '120%', '-20%'],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-[-10%] right-[-10%] h-1 bg-white shadow-[0_0_30px_rgba(255,255,255,1),0_0_15px_rgba(255,75,107,1)] z-30 opacity-90"
                />
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-16 text-center space-y-6 px-4"
              >
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-primary to-accent-secondary tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(255,75,107,0.5)]">
                  Extracting Profile
                </h3>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['8px', '24px', '8px'] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                        className="w-1.5 rounded-full bg-accent-primary shadow-[0_0_10px_rgba(255,75,107,0.8)]"
                      />
                    ))}
                  </div>
                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-accent-primary/80 text-xs sm:text-sm font-mono tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] uppercase mt-4 text-center"
                  >
                    Synthesizing Behavioral Matrix...
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Calibration Lab
        </div>
        <h1 className="text-4xl md:text-6xl font-bold">The Oracle</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Advanced personality analysis and type calibration. Use the AI Oracle, practice your skills, or review past analyses.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setMode('ai')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all border flex items-center gap-2",
            mode === 'ai' ? "accent-gradient text-white border-transparent" : "bg-white/5 text-slate-400 border-white/10"
          )}
        >
          <Brain className="w-4 h-4" /> AI Oracle
        </button>
        <button
          onClick={() => setMode('manual')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all border flex items-center gap-2",
            mode === 'manual' ? "accent-gradient text-white border-transparent" : "bg-white/5 text-slate-400 border-white/10"
          )}
        >
          <UserCheck className="w-4 h-4" /> Manual
        </button>
        <button
          onClick={() => setMode('practice')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all border flex items-center gap-2",
            mode === 'practice' ? "accent-gradient text-white border-transparent" : "bg-white/5 text-slate-400 border-white/10"
          )}
        >
          <PlayCircle className="w-4 h-4" /> Practice
        </button>
        <button
          onClick={() => setMode('history')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all border flex items-center gap-2",
            mode === 'history' ? "accent-gradient text-white border-transparent" : "bg-white/5 text-slate-400 border-white/10"
          )}
        >
          <History className="w-4 h-4" /> History
        </button>
      </div>

      {mode === 'ai' && (
        <div className="space-y-8">
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-primary" />
                Scenario Parameters
              </h3>
              <button 
                onClick={clearForm}
                className="text-xs font-bold text-slate-500 hover:text-accent-primary transition-colors uppercase tracking-widest"
              >
                Clear Form
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Eye Contact
                </label>
                <select 
                  value={structuredInput.eyeContact}
                  onChange={(e) => setStructuredInput({...structuredInput, eyeContact: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  <option value="Intense / Holding gaze" className="bg-slate-900">Intense / Holding gaze</option>
                  <option value="Shy / Looking down" className="bg-slate-900">Shy / Looking down</option>
                  <option value="Avoiding / Looking around room" className="bg-slate-900">Avoiding / Looking around room</option>
                  <option value="Normal / Conversational" className="bg-slate-900">Normal / Conversational</option>
                  <option value="Rapid blinking / Nervous" className="bg-slate-900">Rapid blinking / Nervous</option>
                  <option value="Squinting / Skeptical" className="bg-slate-900">Squinting / Skeptical</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Conversation Topic
                </label>
                <select 
                  value={structuredInput.conversationTopic}
                  onChange={(e) => setStructuredInput({...structuredInput, conversationTopic: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  <option value="Work / Career / Goals" className="bg-slate-900">Work / Career / Goals</option>
                  <option value="Family / Friends / Relationships" className="bg-slate-900">Family / Friends / Relationships</option>
                  <option value="Hobbies / Fun / Travel" className="bg-slate-900">Hobbies / Fun / Travel</option>
                  <option value="Deep / Philosophical" className="bg-slate-900">Deep / Philosophical</option>
                  <option value="Small Talk / Surface Level" className="bg-slate-900">Small Talk / Surface Level</option>
                  <option value="Complaining / Negative" className="bg-slate-900">Complaining / Negative</option>
                  <option value="Boasting / Self-centered" className="bg-slate-900">Boasting / Self-centered</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  Body Language
                </label>
                <select 
                  value={structuredInput.bodyLanguage}
                  onChange={(e) => setStructuredInput({...structuredInput, bodyLanguage: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  <option value="Open / Relaxed / Leaning in" className="bg-slate-900">Open / Relaxed / Leaning in</option>
                  <option value="Closed / Guarded / Arms crossed" className="bg-slate-900">Closed / Guarded / Arms crossed</option>
                  <option value="Fidgety / Distracted / Restless" className="bg-slate-900">Fidgety / Distracted / Restless</option>
                  <option value="Touchy / Flirty / Playful" className="bg-slate-900">Touchy / Flirty / Playful</option>
                  <option value="Mirroring your movements" className="bg-slate-900">Mirroring your movements</option>
                  <option value="Rigid / Professional / Stiff" className="bg-slate-900">Rigid / Professional / Stiff</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Clothing Style
                </label>
                <select 
                  value={structuredInput.clothingStyle}
                  onChange={(e) => setStructuredInput({...structuredInput, clothingStyle: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  <option value="Modest / Conservative" className="bg-slate-900">Modest / Conservative</option>
                  <option value="Trendy / Fashionable" className="bg-slate-900">Trendy / Fashionable</option>
                  <option value="Classy / Elegant" className="bg-slate-900">Classy / Elegant</option>
                  <option value="Casual / Practical / Tomboy" className="bg-slate-900">Casual / Practical / Tomboy</option>
                  <option value="Revealing / Sexy / Edgy" className="bg-slate-900">Revealing / Sexy / Edgy</option>
                  <option value="Artistic / Eccentric / Unique" className="bg-slate-900">Artistic / Eccentric / Unique</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Additional Notes (Optional)</label>
              <textarea
                value={structuredInput.additionalNotes}
                onChange={(e) => setStructuredInput({...structuredInput, additionalNotes: e.target.value})}
                placeholder="Any other specific behaviors, quotes, or context..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full py-4 rounded-xl accent-gradient text-white font-bold shadow-xl shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting Behavioral Matrix...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Extract Profile
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-4"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              {error}
            </motion.div>
          )}

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-wrap justify-between items-center gap-4">
                <button
                  onClick={clearForm}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Analysis
                </button>
                <button
                  onClick={handleSaveImage}
                  disabled={isCapturing}
                  className="px-4 py-2 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold hover:bg-accent-primary/20 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isCapturing ? 'Capturing...' : 'Save Analysis as Image'}
                </button>
              </div>

              <div ref={analysisRef} className="space-y-8 p-6 sm:p-8 bg-mystic-950 rounded-3xl border border-white/5 shadow-2xl">
                <div className="text-center pb-6 border-b border-white/10">
                  <h2 className="text-2xl font-black tracking-tight text-gradient uppercase">EPIMETHEUS ORACLE</h2>
                  <p className="text-slate-500 text-sm mt-2">Analysis Report • {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-8 text-center space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Type</h4>
                    <div className="text-5xl font-black text-accent-primary italic">{analysis.primaryType}</div>
                  </div>
                  <div className="glass-card p-8 text-center space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confidence</h4>
                    <div className="text-5xl font-black text-white italic">{analysis.confidence}%</div>
                  </div>
                  <div className="glass-card p-8 text-center space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secondary Type</h4>
                    <div className="text-5xl font-black text-slate-500 italic">{analysis.secondaryType || 'N/A'}</div>
                  </div>
                </div>

              <div className="glass-card p-8 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Info className="w-6 h-6 text-accent-primary" />
                  Oracle's Reasoning
                </h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  {analysis.reasoning}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 space-y-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3 text-accent-primary">
                    <LogoIcon className="w-6 h-6" />
                    Cold Reader
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-accent-primary/60 mb-2 block">AI Generated Insight</span>
                      <p className="text-lg text-slate-300 leading-relaxed italic border-l-2 border-accent-primary pl-4">
                        "{analysis.coldReader}"
                      </p>
                    </div>
                    
                    {(() => {
                      const typeData = personalityTypes.find(t => t.id === analysis.primaryType);
                      if (typeData?.coldReads) {
                        return (
                          <div className="pt-4 border-t border-white/5">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3 block">Standard Type Reads</span>
                            <div className="space-y-2">
                              {typeData.coldReads.slice(0, 2).map((read, i) => (
                                <p key={i} className="text-sm text-slate-400 italic">
                                  "{read}"
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="glass-card p-8 space-y-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3 text-amber-400">
                    <Zap className="w-6 h-6" />
                    How She Gets What She Wants
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {analysis.howSheGetsWhatSheWants}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 space-y-4">
                  <h4 className="text-xl font-bold flex items-center gap-3">
                    <Target className="w-5 h-5 text-accent-primary" />
                    Key Indicators Found
                  </h4>
                  <ul className="space-y-3">
                    {analysis.indicators.map((indicator, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400">
                        <CheckCircle2 className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h4 className="text-xl font-bold flex items-center gap-3">
                      <ListTodo className="w-5 h-5 text-accent-primary" />
                      Actionable Tasks
                    </h4>
                    
                    {analysis.tasks && analysis.tasks.length > 0 && (
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(analysis.tasks.filter(t => t.completed).length / analysis.tasks.length) * 100}%` }}
                          className="h-full bg-accent-primary shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                        <input 
                          type="text"
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          placeholder="Search tasks..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-primary placeholder:text-slate-600"
                        />
                      </div>

                      <select 
                        value={taskFilter}
                        onChange={(e) => setTaskFilter(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                      >
                        <option value="all" className="bg-slate-900">All Status</option>
                        <option value="pending" className="bg-slate-900">Pending</option>
                        <option value="completed" className="bg-slate-900">Completed</option>
                      </select>

                      <select 
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                      >
                        <option value="all" className="bg-slate-900">All Categories</option>
                        <option value="communication" className="bg-slate-900">Communication</option>
                        <option value="physical" className="bg-slate-900">Physical</option>
                        <option value="logistics" className="bg-slate-900">Logistics</option>
                        <option value="psychology" className="bg-slate-900">Psychology</option>
                      </select>

                      <button
                        onClick={() => setTaskSort(taskSort === 'priority' ? 'dueDate' : 'priority')}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2 hover:bg-white/10 transition-colors"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        {taskSort === 'priority' ? 'Sort by Priority' : 'Sort by Due Date'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm italic">
                        No tasks match your current filters.
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <div 
                          key={task.id}
                          className={cn(
                            "group flex items-start gap-4 p-4 rounded-xl border transition-all",
                            task.completed 
                              ? "bg-emerald-500/5 border-emerald-500/10 opacity-60" 
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 shrink-0 transition-transform active:scale-90"
                          >
                            {task.completed ? (
                              <CheckSquare className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500 group-hover:text-accent-primary" />
                            )}
                          </button>
                          
                          <div className="flex-1 space-y-1">
                            <p className={cn(
                              "text-sm font-medium transition-all",
                              task.completed ? "text-slate-500 line-through" : "text-slate-200"
                            )}>
                              {task.text}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider font-bold">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full border",
                                task.priority === 'high' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                task.priority === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              )}>
                                {task.priority}
                              </span>
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                              <span className="text-slate-500">
                                {task.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="glass-card p-8 space-y-4">
                  <h4 className="text-xl font-bold flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    What to Avoid
                  </h4>
                  <ul className="space-y-3">
                    {analysis.whatToAvoid.map((avoid, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400">
                        <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        {avoid}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="glass-card p-8 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-accent-primary">
                  <Shield className="w-6 h-6" />
                  Relationship Strategy: Total Devotion
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vision</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.relationshipAdvice.vision}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Investment</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.relationshipAdvice.investment}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Potential</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.relationshipAdvice.potential}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-purple-400">
                  <HandMetal className="w-6 h-6" />
                  Freak Dynamics: Bring Out the Freak
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kink & Novelty</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.freakDynamics.kink}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Threesomes</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.freakDynamics.threesomes}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Worship</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.freakDynamics.worship}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-red-400">
                  <Brain className="w-6 h-6" />
                  Dark Mind Breakdown
                </h3>
                <p className="text-lg text-slate-300 leading-relaxed">
                  {analysis.darkMindBreakdown}
                </p>
              </div>

              <div className="glass-card p-8 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-accent-primary">
                  <Target className="w-6 h-6" />
                  Behavioral Blueprint
                </h3>
                <div className="space-y-4">
                  {analysis.behavioralBlueprint.split(/\d+\.\s+/).filter(Boolean).map((step, i) => {
                    const parts = step.split(/:\s*/);
                    if (parts.length >= 2) {
                      const title = parts[0].replace(/\*\*/g, '').trim();
                      const content = parts.slice(1).join(': ').trim();
                      return (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <h4 className="font-bold text-accent-primary mb-2">{title}</h4>
                          <p className="text-slate-300">{content}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-slate-300">{step.trim()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {manualClues.map((axis) => (
              <div key={axis.axis} className="space-y-6">
                <h3 className="text-xl font-bold text-accent-primary border-b border-white/10 pb-2">{axis.axis}</h3>
                {axis.options.map((option) => (
                  <div key={option.label} className="glass-card p-6 space-y-4">
                    <h4 className="font-bold text-lg text-white">{option.label}</h4>
                    <ul className="space-y-2">
                      {option.clues.map((clue, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-400 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 shrink-0" />
                          {clue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="glass-card p-8 bg-accent-primary/5 border-accent-primary/20">
            <h3 className="text-xl font-bold mb-4">How to Mind Read</h3>
            <p className="text-slate-400 leading-relaxed">
              Identify one dominant trait from each axis. Combine the letters to find her 3-letter type. 
              For example, if she is a Tester, a Denier, and a Realist, her type is TDR (The Private Dancer).
              Use the Encyclopedia to look up the specific strategy for that type.
            </p>
          </div>
        </div>
      )}

      {mode === 'history' && (
        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-4">
              <History className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-xl font-bold text-white">No History Yet</h3>
              <p className="text-slate-400">Use the AI Oracle to analyze scenarios and they will be saved here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => {
                setAnalysis(item);
                setMode('ai');
              }}>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-accent-primary italic">{item.primaryType}</span>
                    <span className="text-sm text-slate-500">{item.date}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-2">{item.scenarioSummary}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-500 uppercase">Confidence</div>
                    <div className="text-xl font-bold text-white">{item.confidence}%</div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {mode === 'practice' && (
        <div className="space-y-8">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setDynamicScenario(null);
                setCurrentScenarioIdx(0);
                setShowPracticeResult(false);
                setSelectedType('');
              }}
              className={cn(
                "px-6 py-2 rounded-full font-bold transition-all border",
                !dynamicScenario ? "accent-gradient text-white border-transparent" : "bg-white/5 text-slate-400 border-white/10"
              )}
            >
              Static Scenarios
            </button>
            <button
              onClick={generateDynamicScenario}
              disabled={isGeneratingScenario}
              className={cn(
                "px-6 py-2 rounded-full font-bold transition-all border flex items-center gap-2",
                dynamicScenario ? "accent-gradient text-white border-transparent" : "bg-white/5 text-slate-400 border-white/10"
              )}
            >
              {isGeneratingScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Dynamic Scenario
            </button>
          </div>

          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Target className="w-6 h-6 text-accent-primary" />
                {dynamicScenario ? 'AI Generated Scenario' : `Scenario ${currentScenarioIdx + 1} of ${practiceScenarios.length}`}
              </h3>
              {!dynamicScenario && (
                <div className="text-slate-400 font-mono">
                  {currentScenarioIdx + 1} / {practiceScenarios.length}
                </div>
              )}
            </div>

            <p className="text-xl text-slate-300 leading-relaxed italic">
              "{dynamicScenario ? dynamicScenario.text : practiceScenarios[currentScenarioIdx].text}"
            </p>

            {!showPracticeResult ? (
              <div className="space-y-6">
                <h4 className="font-bold text-slate-400 uppercase tracking-widest text-sm">Select her type:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {personalityTypes.map(pt => (
                    <button
                      key={pt.id}
                      onClick={() => setSelectedType(pt.id)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all font-bold",
                        selectedType === pt.id 
                          ? "bg-accent-primary/20 border-accent-primary text-accent-primary" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {pt.id}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowPracticeResult(true)}
                  disabled={!selectedType}
                  className="w-full py-4 rounded-xl accent-gradient text-white font-bold disabled:opacity-50 transition-all"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {(() => {
                  const correctType = dynamicScenario ? dynamicScenario.correctType : practiceScenarios[currentScenarioIdx].correctType;
                  const explanation = dynamicScenario ? dynamicScenario.explanation : practiceScenarios[currentScenarioIdx].explanation;
                  const isCorrect = selectedType === correctType;

                  return (
                    <>
                      <div className={cn(
                        "p-6 rounded-2xl border flex items-start gap-4",
                        isCorrect
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      )}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-bold text-lg mb-2">
                            {isCorrect ? "Correct!" : `Incorrect. The correct type is ${correctType}.`}
                          </h4>
                          <p className="text-sm opacity-80 leading-relaxed">
                            {explanation}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        {dynamicScenario ? (
                          <button
                            onClick={generateDynamicScenario}
                            className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            New AI Scenario
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (currentScenarioIdx < practiceScenarios.length - 1) {
                                setCurrentScenarioIdx(prev => prev + 1);
                                setSelectedType('');
                                setShowPracticeResult(false);
                              } else {
                                setCurrentScenarioIdx(0);
                                setSelectedType('');
                                setShowPracticeResult(false);
                              }
                            }}
                            className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                          >
                            {currentScenarioIdx < practiceScenarios.length - 1 ? (
                              <>Next Scenario <ArrowRight className="w-4 h-4" /></>
                            ) : (
                              <>Restart Practice <RotateCcw className="w-4 h-4" /></>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

