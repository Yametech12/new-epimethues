import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Target, Compass, Brain, Map, BookOpen, Heart } from 'lucide-react';
import { personalityTypes } from '../data/personalityTypes';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-12 py-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm font-medium mb-4"
            >
              Where Hope Meets Connection
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              EPIMETHEUS
            </h1>
            <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium italic">
              "Open the box. Find the hope."
            </p>
          </div>

          <div className="max-w-3xl mx-auto text-left space-y-8 glass-card p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Heart className="w-32 h-32 text-accent-primary" />
            </div>
            <div className="space-y-4 relative z-10">
              <h2 className="text-2xl font-bold text-accent-primary flex items-center gap-2">
                <BookOpen className="w-6 h-6" /> The Story
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                In Greek mythology, Epimetheus was the one who opened his heart to Pandora—not despite the warnings, but because he understood something others didn't: <strong>Some things are worth the risk.</strong>
              </p>
              <p className="text-slate-300 leading-relaxed text-lg">
                When Pandora opened the box, the world was flooded with chaos, doubt, and tests. But at the very bottom, something remained: <strong>Hope.</strong>
              </p>
              <p className="text-slate-300 leading-relaxed text-lg italic">
                Epimetheus saw past the trials. He saw her. And he held onto what mattered most.
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
              <h2 className="text-2xl font-bold text-accent-primary flex items-center gap-2">
                <Target className="w-6 h-6" /> The Connection
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                She's not simple. Love isn't either. Epimetheus is the first dating app built on the EPIMETHEUS philosophy:
              </p>
              <ul className="space-y-4 mt-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-primary mt-2 shrink-0" />
                  <p className="text-slate-300"><strong className="text-white">Meet the Testers</strong> – Women who guard their hearts because they're worth guarding. Profiles reveal her "tests" upfront—so you know what you're walking into.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-primary mt-2 shrink-0" />
                  <p className="text-slate-300"><strong className="text-white">Attract the Investors</strong> – Once trust is built, she gives back tenfold. Matches deepen only when mutual effort is shown.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-primary mt-2 shrink-0" />
                  <p className="text-slate-300"><strong className="text-white">Find the Hope</strong> – Real connection is the reward for those who persist.</p>
                </li>
              </ul>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
              <h2 className="text-2xl font-bold text-accent-primary flex items-center gap-2">
                <Compass className="w-6 h-6" /> Why Epimetheus?
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                Because modern dating is a box. Some people open it and run. Some get stuck in the chaos. But the ones who stay? They find what's real.
              </p>
              <p className="text-accent-primary font-bold text-xl text-center pt-4">
                Epimetheus is for the ones who stay.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              to="/assessment"
              className="w-full sm:w-auto px-8 py-4 rounded-xl accent-gradient text-white font-bold shadow-xl shadow-accent-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              Start Target Assessment
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/profiles"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all text-center"
            >
              Explore Profiles
            </Link>
          </div>

          {/* Personality Profiles Section */}
          <div className="pt-24 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">The 8 Personality Archetypes</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Every woman fits into one of eight core profiles based on her approach to time, sex, and relationships.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {personalityTypes.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/encyclopedia?type=${profile.id}`}
                  className="glass-card p-6 text-left hover:border-accent-primary/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono font-bold text-accent-primary">{profile.id}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-white transition-colors">{profile.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{profile.tagline}</p>
                </Link>
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/profiles" className="text-accent-primary font-bold hover:underline inline-flex items-center gap-2">
                View detailed profile directory <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24 text-left">
            {[
              { title: 'AI Advisor', desc: 'Consult the Oracle for real-time strategic intelligence.', icon: Brain, link: '/advisor' },
              { title: 'Field Guide', desc: 'Quick-reference scenarios and tactical lines for any situation.', icon: Map, link: '/field-guide' },
              { title: 'Calibration', desc: 'Master the art of reading her type in 30 seconds or less.', icon: Target, link: '/calibration' },
            ].map((feature, i) => (
              <Link key={i} to={feature.link} className="glass-card p-6 space-y-4 mystic-border group overflow-hidden shimmer">
                <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold group-hover:text-accent-primary transition-colors">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
    </div>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
