import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { personalityTypes } from '../data/personalityTypes';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Zap, Shield, Flame, Target, BookOpen, User, Plus, Clock, MessageSquare } from 'lucide-react';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

type Assessment = {
  typeId: string;
  date: string;
  name: string;
};

export default function ProfilesPage() {
  const { user, isAdmin } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'calibrations'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedAssessments: Assessment[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const profile = personalityTypes.find(p => p.id === data.typeId);
          if (profile) {
            fetchedAssessments.push({
              typeId: data.typeId,
              date: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
              name: profile.name
            });
          }
        });
        
        // Sort by date descending
        const sorted = fetchedAssessments.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAssessments(sorted);
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.warn("Firestore is offline. Could not fetch assessments.");
        } else {
          handleFirestoreError(error, OperationType.LIST, 'calibrations');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();
  }, [user]);

  return (
    <div className="space-y-16">
      {/* Admin Dashboard Section */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border-accent-primary/30 bg-accent-primary/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-24 h-24 text-accent-primary" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-accent-primary font-black uppercase tracking-[0.2em] text-xs">
                <Shield className="w-4 h-4" />
                System Administration
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              <p className="text-slate-400 text-sm">Access system-wide analytics and user feedback.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/feedback"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-white font-bold shadow-lg shadow-accent-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                View User Feedback
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Profile Section */}
      <div className="glass-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[140%] bg-accent-primary/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 shrink-0">
          <ProfilePhotoUpload />
        </div>
        
        <div className="relative z-10 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold uppercase tracking-widest">
            Operative Profile
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {user?.displayName || 'Operative'}
          </h2>
          <p className="text-slate-400 text-sm">
            {user?.email}
          </p>
        </div>
        
        <div className="relative z-10 md:ml-auto flex gap-4">
          <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-2xl font-black text-accent-primary">{assessments.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Analyses</div>
          </div>
          <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-2xl font-black text-white">Active</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status</div>
          </div>
        </div>
      </div>

      {/* Assessment History Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Target Assessments</h2>
            <p className="text-slate-400 text-sm">Your history of analyzed profiles.</p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl accent-gradient text-white font-bold shadow-lg shadow-accent-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </Link>
        </div>

        {loading ? (
          <div className="glass-card p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((assessment, index) => (
              <Link
                key={index}
                to={`/encyclopedia?type=${assessment.typeId}`}
                className="glass-card p-6 flex flex-col gap-4 hover:border-accent-primary/50 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                    {assessment.typeId}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(assessment.date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-accent-primary transition-colors">
                    {assessment.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    View full profile <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Assessments Yet</h3>
              <p className="text-slate-400 text-sm mt-1">Run your first target assessment to start building your database.</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-4 pt-8 border-t border-white/5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm font-medium">
          <User className="w-4 h-4" />
          The 8 Archetypes
        </div>
        <h1 className="text-4xl md:text-6xl font-bold">Personality Profiles</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Explore the detailed blueprints of the eight core EPIMETHEUS personality types.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {personalityTypes.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col space-y-4 group hover:border-accent-primary/30 transition-all duration-500"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:scale-110 transition-transform">
                <span className="font-mono font-bold text-lg">{profile.id}</span>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                {profile.combination}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold group-hover:text-accent-primary transition-colors">{profile.name}</h3>
              <p className="text-xs text-accent-primary/70 font-medium italic">{profile.tagline}</p>
            </div>

            <p className="text-slate-400 text-sm line-clamp-3 flex-grow">
              {profile.overview}
            </p>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Zap className="w-3 h-3 text-accent-primary" />
                Key Traits
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.keyTraits.slice(0, 3).map((trait, j) => (
                  <span key={j} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <Link
              to={`/encyclopedia?type=${profile.id}`}
              className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-accent-primary hover:border-accent-primary transition-all group/btn"
            >
              Full Breakdown
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="glass-card p-8 md:p-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-accent-primary">
              <Target className="w-5 h-5" />
              The Time Line
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Determines how she invests her time and effort. <strong>Testers</strong> are hard to get but easy to keep, while <strong>Investors</strong> are easy to get but hard to keep.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-accent-primary">
              <Flame className="w-5 h-5" />
              The Sex Line
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Determines her approach to physical intimacy. <strong>Deniers</strong> need a reason TO have sex, while <strong>Justifiers</strong> need a reason NOT to.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-accent-primary">
              <Shield className="w-5 h-5" />
              The Relationship Line
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Determines her worldview and relationship values. <strong>Realists</strong> value practical stability, while <strong>Idealists</strong> value romantic connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
