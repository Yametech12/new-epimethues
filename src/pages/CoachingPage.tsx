import React from 'react';
import { motion } from 'motion/react';
import { Video, BookOpen, PhoneCall, ExternalLink, Star, ArrowRight } from 'lucide-react';

const resources = [
  {
    title: "The Epimetheus Masterclass",
    description: "A comprehensive 6-week video course diving deep into the 8 personality types, advanced calibration, and the complete Emotional Tension Sequence.",
    type: "video",
    icon: Video,
    link: "#",
    premium: true
  },
  {
    title: "Field Reports & Case Studies",
    description: "Real-world breakdowns of interactions, showing exactly how to identify types and apply the right strategies in the moment.",
    type: "article",
    icon: BookOpen,
    link: "#",
    premium: false
  },
  {
    title: "1-on-1 Calibration Coaching",
    description: "Book a private session to review your specific sticking points, analyze your text conversations, and build a custom dating strategy.",
    type: "coaching",
    icon: PhoneCall,
    link: "#",
    premium: true
  }
];

export default function CoachingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Coaching & Resources</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Take your understanding to the next level with advanced training, real-world case studies, and personalized coaching.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((resource, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 flex flex-col h-full relative overflow-hidden group hover:border-accent-primary/50 transition-colors"
          >
            {resource.premium && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider">
                <Star className="w-3 h-3" />
                Premium
              </div>
            )}
            
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-6 text-accent-primary">
              <resource.icon className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">{resource.title}</h3>
            <p className="text-slate-400 leading-relaxed flex-grow mb-8">
              {resource.description}
            </p>
            
            <a 
              href={resource.link}
              className="inline-flex items-center gap-2 text-accent-primary font-bold hover:text-accent-secondary transition-colors mt-auto"
            >
              Access Resource <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 flex flex-col h-full relative overflow-hidden group bg-gradient-to-br from-accent-primary/20 to-transparent border-accent-primary/30"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center mb-6 text-white shadow-lg shadow-accent-primary/20">
            <ExternalLink className="w-6 h-6" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Join the Inner Circle</h3>
          <p className="text-slate-300 leading-relaxed flex-grow mb-8">
            Get access to our private community of advanced practitioners. Share field reports, get feedback, and network with like-minded men.
          </p>
          
          <button className="w-full py-3 rounded-xl accent-gradient text-white font-bold shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Apply for Membership
          </button>
        </motion.div>
      </div>
    </div>
  );
}
