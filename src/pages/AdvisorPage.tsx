import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Send, Bot, User, Sparkles, 
  AlertCircle, CheckCircle2, Lightbulb,
  MessageSquare, Brain, Target, Heart
} from 'lucide-react';
import { personalityTypes } from '../data/personalityTypes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Modality } from "@google/genai";
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function AdvisorPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    { 
      id: 'initial',
      role: 'model', 
      content: "I am the Yame Advisor. The female mind is a labyrinth, but every labyrinth has a thread. Describe your situation or the woman you've encountered. If you suspect her type, tell me. I will provide the strategic intelligence you need to navigate the chaos." 
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const playVoice = async (text: string, messageId: string) => {
    if (isSpeaking === messageId) {
      audioRef.current?.pause();
      setIsSpeaking(null);
      return;
    }

    setIsSpeaking(messageId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak in a mysterious, professional, and insightful male voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir is a deep, mysterious voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          audioRef.current.onended = () => setIsSpeaking(null);
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => setIsSpeaking(null);
        }
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(null);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      // Use a small timeout to ensure the DOM has updated with the new message
      // before calculating the scroll height
      const timeoutId = setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = { id: userMsgId, role: 'user', content: userMessage };
    
    setInput('');
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3.1-pro-preview";
      
      const systemInstruction = `You are the "Yame Advisor", an expert in the EPIMETHEUS personality profiling system for women. 
      Your goal is to provide strategic, high-level advice for men navigating dating and social dynamics.
      
      Context:
      - The system identifies 8 types: TDI (Playette), TJI (Social Butterfly), NDI (Hopeful Romantic), NJI (Cinderella), TDR (Private Dancer), TJR (Seductress), NDR (Connoisseur), NJR (Modern Woman).
      - Use the "Emotional Trigger Sequence" (ETS) for each type.
      - Focus on "What She Wants" and "What to Avoid".
      - Tone: Mysterious, professional, insightful, and slightly provocative. Not like a typical AI.
      - Avoid excessive bolding. Use natural punctuation.
      - If the user doesn't specify a type, try to infer it from their description of her behavior.
      
      Personality Data:
      ${JSON.stringify(personalityTypes.map(p => ({
        id: p.id,
        name: p.name,
        wants: p.whatSheWants,
        avoid: p.whatToAvoid,
        ets: p.ets,
        strategy: p.strategy,
        relationshipAdvice: p.relationshipAdvice,
        freakDynamics: p.freakDynamics
      })))}`;

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: systemInstruction,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessage({ message: userMessage });
      const assistantMessage = response.text;
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(),
        role: 'model', 
        content: assistantMessage || "I apologize, the oracle is silent at this moment." 
      }]);
    } catch (error) {
      console.error("Advisor Error:", error);
      setMessages(prev => [...prev, { 
        id: 'error-' + Date.now(),
        role: 'model', 
        content: "There was a disturbance in the connection. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl accent-gradient shadow-lg shadow-accent-primary/20 mb-4 glow-accent">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">The Oracle</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Strategic intelligence for the modern man. Consult the advisor for deep analysis of your social dynamics.
        </p>
      </div>

      <div className="glass-card flex flex-col h-[600px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            <span className="text-sm font-bold tracking-widest uppercase text-slate-400">Oracle Active</span>
          </div>
          <Sparkles className="w-4 h-4 text-accent-primary" />
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                msg.role === 'user' ? "bg-slate-800" : "accent-gradient"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed relative group/msg",
                msg.role === 'user' 
                  ? "bg-slate-800 text-slate-200 rounded-tr-none" 
                  : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none markdown-body"
              )}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                
                {msg.role === 'model' && (
                  <button
                    onClick={() => playVoice(msg.content, msg.id)}
                    className={cn(
                      "absolute -right-12 top-0 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-accent-primary transition-all opacity-0 group-hover/msg:opacity-100",
                      isSpeaking === msg.id && "opacity-100 text-accent-primary animate-pulse"
                    )}
                    title="Listen to Oracle"
                  >
                    {isSpeaking === msg.id ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-white/5">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your situation..."
              className="w-full bg-mystic-950 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-lg accent-gradient text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center uppercase tracking-widest">
            Strategic advice is for educational purposes only.
          </p>
        </div>
      </div>

      {/* Suggested Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Brain, title: "Identify Type", desc: "Describe her behavior to find her type." },
          { icon: Target, title: "Next Move", desc: "Get advice on your next interaction." },
          { icon: MessageSquare, title: "Text Analysis", desc: "Analyze a message she sent you." }
        ].map((topic, i) => (
          <button
            key={i}
            onClick={() => setInput(`I need help with: ${topic.title}. Here's the situation...`)}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
          >
            <topic.icon className="w-5 h-5 text-accent-primary mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-200">{topic.title}</h3>
            <p className="text-xs text-slate-500">{topic.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
