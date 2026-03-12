import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Trash2, Calendar, User, Mail, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Feedback {
  id: string;
  type: 'bug' | 'feature' | 'general' | 'praise' | 'suggestion';
  subject: string;
  message: string;
  email?: string;
  userId?: string;
  userName?: string;
  createdAt: Timestamp;
}

export default function FeedbackAdminPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    if (!isAdmin) {
      navigate('/');
      return;
    }

    setDataLoading(true);
    setError(null);

    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedbackList(list);
      setDataLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching feedback:", err);
      setError(`Permission Error: ${err.message || "You do not have permission to view this page."}`);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, authLoading, navigate, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteDoc(doc(db, 'feedback', id));
      } catch (err) {
        console.error("Error deleting feedback:", err);
        alert("Failed to delete feedback.");
      }
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Access Denied</h1>
        <p className="text-slate-400">{error || "This area is restricted to system administrators."}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={handleRetry}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
          >
            Retry Connection
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl accent-gradient text-white font-bold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">System Feedback</h1>
          <p className="text-slate-500 mt-2">Manage user reports, feature requests, and general feedback.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-400">
            Total Reports: <span className="text-white">{feedbackList.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {feedbackList.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-mystic-900/50 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-white/20 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.type === 'bug' ? 'bg-red-500/20 text-red-400' :
                      item.type === 'feature' ? 'bg-blue-500/20 text-blue-400' :
                      item.type === 'suggestion' ? 'bg-amber-500/20 text-amber-400' :
                      item.type === 'praise' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {item.type}
                    </span>
                    <h3 className="text-xl font-bold text-white">{item.subject}</h3>
                  </div>

                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-2xl border border-white/5">
                    {item.message}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-primary" />
                      {item.createdAt?.toDate().toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-accent-primary" />
                      {item.userName || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-accent-primary" />
                      {item.email || 'No Email Provided'}
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete Feedback"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {feedbackList.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest">No feedback reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
