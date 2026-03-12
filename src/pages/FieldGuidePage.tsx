import React from 'react';
import { motion } from 'motion/react';
import { 
  Map, Target, Zap, AlertCircle, 
  CheckCircle2, Flame, MessageSquare, 
  ChevronRight, Search, Filter,
  BookOpen, Compass, Shield, Users, Plus, X, Copy
} from 'lucide-react';
import { personalityTypes } from '../data/personalityTypes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FieldReport {
  id: number;
  author: string;
  type: string;
  scenario: string;
  action: string;
  result: string;
  likes: number;
  date: string;
}

const INITIAL_REPORTS: FieldReport[] = [
  {
    id: 1,
    author: "Anonymous_Wolf",
    type: "The Private Dancer",
    scenario: "Met at a high-end lounge. She was very guarded initially.",
    action: "Used the 'Us-Frame' early on. Ignored her initial coldness and focused on building a shared reality.",
    result: "She opened up completely within 20 minutes. We ended up talking for hours.",
    likes: 24,
    date: "2 days ago"
  },
  {
    id: 2,
    author: "NightRider",
    type: "The Social Butterfly",
    scenario: "Daygame at a coffee shop. She was clearly in a rush.",
    action: "Direct approach, high energy. Acknowledged she was busy but said I had to say hi. Kept it under 2 minutes.",
    result: "Got her number. Texted her later that night and set up a date for Thursday.",
    likes: 18,
    date: "1 week ago"
  },
  {
    id: 3,
    author: "CalibratedMind",
    type: "The Modern Woman",
    scenario: "Networking event. Lots of career talk.",
    action: "Shifted the conversation from facts (what she does) to feelings (why she does it). Used inner process language.",
    result: "She said I was the most interesting person she met all night. Instant connection.",
    likes: 42,
    date: "3 weeks ago"
  }
];

export default function FieldGuidePage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'scenarios' | 'reports'>('scenarios');
  
  // Reports State with Persistence
  const [reports, setReports] = React.useState<FieldReport[]>(() => {
    const saved = localStorage.getItem('fieldReports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [reportSearch, setReportSearch] = React.useState('');
  const [reportSort, setReportSort] = React.useState<'newest' | 'popular'>('newest');
  const [reportFilter, setReportFilter] = React.useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('fieldReports', JSON.stringify(reports));
  }, [reports]);

  // Form State
  const [newReport, setNewReport] = React.useState({
    author: '',
    type: '',
    scenario: '',
    action: '',
    result: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report: FieldReport = {
      id: Date.now(),
      author: newReport.author || 'Anonymous',
      type: newReport.type || 'Unknown',
      scenario: newReport.scenario,
      action: newReport.action,
      result: newReport.result,
      likes: 0,
      date: new Date().toLocaleDateString()
    };

    setReports([report, ...reports]);
    setIsModalOpen(false);
    setNewReport({
      author: '',
      type: '',
      scenario: '',
      action: '',
      result: ''
    });
  };

  const handleLike = (id: number) => {
    setReports(prev => prev.map(r => 
      r.id === id ? { ...r, likes: r.likes + 1 } : r
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here if we had a toast system
  };

  const filteredScenarios = personalityTypes
    .filter(type => !selectedType || type.id === selectedType)
    .flatMap(type => [
      { type: type.id, typeName: type.name, stage: 'Ignition', scenario: type.strategy.ignitionScenario, example: type.strategy.ignitionExample },
      { type: type.id, typeName: type.name, stage: 'Momentum', scenario: type.strategy.momentumScenario, example: type.strategy.momentumExample },
      { type: type.id, typeName: type.name, stage: 'Connection', scenario: type.strategy.connectionScenario, example: type.strategy.connectionExample },
      { type: type.id, typeName: type.name, stage: 'Bonding', scenario: type.strategy.bondingScenario, example: type.strategy.bondingExample },
      { type: type.id, typeName: type.name, stage: 'Physicality', scenario: type.physicality.bodyLanguageScenario, example: type.physicality.bodyLanguageExample },
      { type: type.id, typeName: type.name, stage: 'Touch', scenario: type.physicality.touchScenario, example: type.physicality.touchExample },
      { type: type.id, typeName: type.name, stage: 'Sex', scenario: type.physicality.sexScenario, example: type.physicality.sexExample },
    ])
    .filter(s => 
      s.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.typeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredReports = reports
    .filter(r => {
      const matchesSearch = 
        r.scenario.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.action.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.author.toLowerCase().includes(reportSearch.toLowerCase());
      const matchesType = !reportFilter || r.type === reportFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (reportSort === 'popular') return b.likes - a.likes;
      return b.id - a.id;
    });

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl accent-gradient shadow-lg shadow-accent-primary/20 mb-4 glow-accent">
          <Map className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">The Field Guide</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Quick-reference scenarios, tactical lines, and real-world field reports.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
            activeTab === 'scenarios' ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" : "bg-white/5 text-slate-400 hover:bg-white/10"
          )}
        >
          <BookOpen className="w-5 h-5" />
          Scenario Library
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
            activeTab === 'reports' ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" : "bg-white/5 text-slate-400 hover:bg-white/10"
          )}
        >
          <Users className="w-5 h-5" />
          Field Reports
        </button>
      </div>

      {activeTab === 'scenarios' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search scenarios, stages, or types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedType(null)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  !selectedType ? "bg-accent-primary text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                )}
              >
                All Types
              </button>
              {personalityTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                    selectedType === type.id ? "bg-accent-primary text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {type.id}
                </button>
              ))}
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScenarios.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 space-y-4 group hover:border-accent-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest">
                      {s.type}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {s.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">{s.typeName}</span>
                    <button 
                      onClick={() => copyToClipboard(s.example)}
                      className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-accent-primary hover:bg-white/10 transition-all"
                      title="Copy example line"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {s.scenario}
                  </p>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 italic text-accent-primary/80 text-sm">
                    "{s.example}"
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Tips Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-accent-primary">
                <Zap className="w-5 h-5" />
                Quick Wins
              </h3>
              <div className="space-y-2">
                {personalityTypes.slice(0, 4).map(type => (
                  <div key={type.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-bold text-accent-primary uppercase block mb-1">{type.name}</span>
                    <p className="text-xs text-slate-400">{type.quickWins[0]}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                Critical Avoids
              </h3>
              <div className="space-y-2">
                {personalityTypes.slice(4, 8).map(type => (
                  <div key={type.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-bold text-red-500 uppercase block mb-1">{type.name}</span>
                    <p className="text-xs text-slate-400">{type.whatToAvoid[0]}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-accent-secondary">
                <Shield className="w-5 h-5" />
                Cold Reads
              </h3>
              <div className="space-y-2">
                {personalityTypes.slice(2, 6).map(type => (
                  <div key={type.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-bold text-accent-secondary uppercase block mb-1">{type.name}</span>
                    <p className="text-xs text-slate-400 italic">"{type.coldReads[0]}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Tactical Lines Section */}
          <section className="glass-card p-8 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-accent-primary">
              <MessageSquare className="w-6 h-6" />
              Tactical Lines & Openers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-300">The Approach</h3>
                <div className="space-y-3">
                  {[
                    { label: "Direct", line: "I saw you from across the room and I knew I had to come say hi. I'm [Name].", note: "Best for Justifiers/Idealists" },
                    { label: "Situational", line: "I can't believe how crowded this place is. Do you know if the music is always this loud?", note: "Best for Deniers/Realists" },
                    { label: "Opinion", line: "My friend and I are having a debate. Do you think it's possible to be 'just friends' with an ex?", note: "Best for Testers" }
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1 group/line relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-accent-primary uppercase">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 italic">{item.note}</span>
                          <button 
                            onClick={() => copyToClipboard(item.line)}
                            className="opacity-0 group-hover/line:opacity-100 p-1 rounded bg-white/5 text-slate-500 hover:text-accent-primary transition-all"
                            title="Copy line"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">"{item.line}"</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-300">The Hook (Intrigue)</h3>
                <div className="space-y-3">
                  {[
                    { label: "Cold Read", line: "You look like the kind of girl who's always the 'responsible' one in her group of friends.", note: "Builds instant rapport" },
                    { label: "Neg", line: "That's a really interesting necklace. It's almost too much, but you somehow pull it off.", note: "Disarms high-status women" },
                    { label: "Challenge", line: "I bet you have a secret talent that no one would ever guess just by looking at you.", note: "Encourages investment" }
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1 group/line relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-accent-primary uppercase">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 italic">{item.note}</span>
                          <button 
                            onClick={() => copyToClipboard(item.line)}
                            className="opacity-0 group-hover/line:opacity-100 p-1 rounded bg-white/5 text-slate-500 hover:text-accent-primary transition-all"
                            title="Copy line"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">"{item.line}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Terminology Section */}
          <section className="glass-card p-8 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-accent-primary">
              <Filter className="w-6 h-6" />
              Key Terminology
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { term: "ETS", def: "Emotional Trigger Sequence - the order of emotions she responds to." },
                { term: "Inner Process", def: "Talking about thoughts/feelings rather than just facts." },
                { term: "Us-Frame", def: "Using 'we' and 'us' to create a sense of shared destiny." },
                { term: "Cold Read", def: "A statement that makes her feel understood on a deep level." },
                { term: "Neg", def: "A playful way to lower her social value and show confidence." },
                { term: "Compliance", def: "Getting her to do small things to build investment." },
                { term: "Vision", def: "Your long-term goals and the path you are on in life." },
                { term: "The Hook", def: "The point where she becomes genuinely interested." },
                { term: "Calibration", def: "Adjusting behavior based on her reactions and type." }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="font-bold text-accent-primary text-sm uppercase tracking-widest">{item.term}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.def}</p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}

      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-accent-primary">
              <Users className="w-6 h-6" />
              Community Field Reports
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search reports..."
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors w-48"
                />
              </div>
              <select 
                value={reportSort}
                onChange={e => setReportSort(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors"
              >
                <option value="newest" className="bg-mystic-950">Newest</option>
                <option value="popular" className="bg-mystic-950">Most Liked</option>
              </select>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/80 transition-colors font-bold text-sm shadow-lg shadow-accent-primary/20"
              >
                <Plus className="w-4 h-4" />
                Submit Report
              </button>
            </div>
          </div>

          {/* Report Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setReportFilter(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all uppercase tracking-widest",
                !reportFilter ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30" : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"
              )}
            >
              All Types
            </button>
            {personalityTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setReportFilter(type.name)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all uppercase tracking-widest",
                  reportFilter === type.name ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30" : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"
                )}
              >
                {type.id}
              </button>
            ))}
          </div>

          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredReports.map((report) => (
                <div key={report.id} className="glass-card p-6 space-y-4 relative group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{report.author}</span>
                        <span className="text-xs text-slate-500">• {report.date}</span>
                      </div>
                      <div className="inline-block px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest">
                        Target: {report.type}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleLike(report.id)}
                      className="flex items-center gap-1 text-slate-400 bg-white/5 px-3 py-1 rounded-full text-sm hover:bg-accent-primary/10 hover:text-accent-primary transition-all group/like"
                    >
                      <Flame className="w-4 h-4 text-orange-500 group-hover/like:scale-125 transition-transform" />
                      {report.likes}
                    </button>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scenario</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{report.scenario}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Action Taken</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{report.action}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Result</h4>
                      <p className="text-accent-primary/90 text-sm leading-relaxed italic">{report.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                <Users className="w-10 h-10 text-slate-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">No Field Reports Yet</h3>
                <p className="text-slate-400 max-w-md mx-auto text-lg">
                  The community is still gathering intel. Be the first to share your field experience and help others calibrate.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-accent-primary text-white font-bold hover:bg-accent-primary/80 transition-all shadow-lg shadow-accent-primary/20"
              >
                Submit First Report
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Submit Field Report</h2>
                <p className="text-slate-400">Share your experience to help the community grow.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your Alias</label>
                    <input 
                      type="text"
                      placeholder="Anonymous"
                      value={newReport.author}
                      onChange={e => setNewReport({...newReport, author: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Target Type</label>
                    <select 
                      required
                      value={newReport.type}
                      onChange={e => setNewReport({...newReport, type: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors appearance-none"
                    >
                      <option value="" disabled className="bg-mystic-950">Select personality type</option>
                      {personalityTypes.map(type => (
                        <option key={type.id} value={type.name} className="bg-mystic-950">{type.name} ({type.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Scenario</label>
                  <textarea 
                    required
                    placeholder="Describe the setting and the initial interaction..."
                    value={newReport.scenario}
                    onChange={e => setNewReport({...newReport, scenario: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Action Taken</label>
                  <textarea 
                    required
                    placeholder="What specific techniques or calibration did you use?"
                    value={newReport.action}
                    onChange={e => setNewReport({...newReport, action: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Result</label>
                  <textarea 
                    required
                    placeholder="What was the outcome of the interaction?"
                    value={newReport.result}
                    onChange={e => setNewReport({...newReport, result: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-accent-primary/50 transition-colors min-h-[100px] resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 rounded-xl bg-accent-primary text-white font-bold hover:bg-accent-primary/80 transition-all shadow-lg shadow-accent-primary/20"
                >
                  Post Report
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
