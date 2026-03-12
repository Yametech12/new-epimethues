import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Compass, Target, Menu, X, Shield, Map, GitCompare, BookA, Zap, Sun, Moon, User, Search, LogOut, LogIn, Fingerprint, PhoneCall, Crosshair, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import CommandCenter from './CommandCenter';
import FeedbackModal from './FeedbackModal';
import OnboardingModal from './OnboardingModal';

import Logo from './Logo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [scrolled, setScrolled] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signInWithGoogle, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Scroll listener for nav effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme toggle effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
    }
  }, [isDark]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navGroups = [
    {
      label: 'Core',
      items: [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Profiles', path: '/profiles', icon: User },
        { name: 'Encyclopedia', path: '/encyclopedia', icon: BookOpen },
        { name: 'Compare', path: '/compare', icon: GitCompare },
      ]
    },
    {
      label: 'Tools',
      items: [
        { name: 'Calibration', path: '/calibration', icon: Target },
        { name: 'Profiler', path: '/profiler', icon: Crosshair },
        { name: 'Advisor', path: '/advisor', icon: Shield },
        { name: 'Field Guide', path: '/field-guide', icon: Map },
      ]
    },
    {
      label: 'Reference',
      items: [
        { name: 'Guide', path: '/guide', icon: Compass },
        { name: 'Glossary', path: '/glossary', icon: BookA },
        { name: 'Quick Ref', path: '/quick-reference', icon: Zap },
        { name: 'Coaching', path: '/coaching', icon: PhoneCall },
      ]
    }
  ];

  const allNavItems = navGroups.flatMap(group => group.items);
  
  // Dropdown items filtering
  const getFilteredGroupItems = (group: typeof navGroups[0]) => {
    return group.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const hasSearchResults = searchQuery.length > 0;
  const filteredCoreItems = getFilteredGroupItems(navGroups[0]);
  const filteredToolsItems = getFilteredGroupItems(navGroups[1]);
  const filteredRefItems = getFilteredGroupItems(navGroups[2]);

  return (
    <div className="min-h-screen bg-mystic-950 text-slate-300 selection:bg-accent-primary/30 selection:text-accent-primary relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[padding,background-color,border-color,box-shadow] duration-500 border-b",
        scrolled 
          ? "bg-mystic-950/90 backdrop-blur-2xl border-white/10 py-1 shadow-2xl shadow-black/50" 
          : "bg-mystic-950/20 backdrop-blur-md border-transparent py-3"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group shrink-0">
                <Logo size="md" className="group-hover:scale-110 transition-transform glow-accent" />
                <span className="text-xl font-bold tracking-tight text-gradient">EPIMETHEUS</span>
              </Link>

              {/* Desktop Nav Items */}
              <div className="hidden lg:flex items-center space-x-1">
                {/* Core Items */}
                {filteredCoreItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                      location.pathname === item.path
                        ? "text-accent-primary bg-accent-primary/5"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      location.pathname === item.path ? "text-accent-primary" : "text-slate-500 group-hover:text-accent-primary"
                    )} />
                    <span>{item.name}</span>
                    {location.pathname === item.path && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent-primary rounded-full"
                      />
                    )}
                  </Link>
                ))}

                {/* Dropdowns */}
                {[
                  { label: 'Tools', items: filteredToolsItems },
                  { label: 'Reference', items: filteredRefItems }
                ].map((group) => {
                  if (hasSearchResults && group.items.length === 0) return null;
                  
                  return (
                    <div 
                      key={group.label} 
                      className="relative"
                      onMouseEnter={() => setActiveDropdown(group.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 group",
                          group.items.some(i => i.path === location.pathname)
                            ? "text-accent-primary bg-accent-primary/5"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span>{group.label}</span>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          activeDropdown === group.label ? "rotate-180" : ""
                        )} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === group.label && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-1 w-48 bg-mystic-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[60]"
                          >
                            {group.items.map((item) => (
                              <Link
                                key={item.name}
                                to={item.path}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                  location.pathname === item.path
                                    ? "text-accent-primary bg-accent-primary/10"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                              >
                                <item.icon className={cn(
                                  "w-4 h-4",
                                  location.pathname === item.path ? "text-accent-primary" : "text-slate-500 group-hover:text-accent-primary"
                                )} />
                                {item.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search system..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-40 focus:outline-none focus:border-accent-primary/50 focus:w-56 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className="h-6 w-px bg-white/10 mx-2" />

              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {user ? (
                <div className="flex items-center gap-3 pl-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-white leading-none whitespace-nowrap">{user.displayName}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
                    >
                      Logout
                    </button>
                  </div>
                  <img 
                    src={user.photoURL || undefined} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl accent-gradient text-white text-sm font-bold shadow-lg shadow-accent-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 h-[100dvh] w-screen z-[60] lg:hidden bg-mystic-950/95 backdrop-blur-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-white/5 shrink-0">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <Logo size="md" className="glow-accent" />
                  <span className="text-xl font-bold tracking-tight text-gradient">EPIMETHEUS</span>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 overscroll-contain">
                {/* Mobile Search */}
                <div className="relative group px-2">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search system..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-base focus:outline-none focus:border-accent-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {user && (
                  <div className="flex items-center gap-4 px-4 py-4 bg-white/5 rounded-2xl border border-white/10 mx-2">
                    <img 
                      src={user.photoURL || undefined} 
                      alt={user.displayName || 'User'} 
                      className="w-12 h-12 rounded-full border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{user.displayName}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      {isAdmin && <div className="text-[10px] text-accent-primary font-black uppercase tracking-widest mt-1">System Admin</div>}
                    </div>
                    <button 
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                {!user && (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-5 rounded-2xl accent-gradient text-white font-bold shadow-lg shadow-accent-primary/20"
                  >
                    <LogIn className="w-6 h-6" />
                    Sign In with Google
                  </button>
                )}

                <div className="space-y-8">
                  {navGroups.map((group) => {
                    const filteredItems = group.items.filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    
                    if (filteredItems.length === 0) return null;

                    return (
                      <div key={group.label} className="space-y-4">
                        <h3 className="px-4 text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">{group.label}</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {filteredItems.map((item) => (
                            <Link
                              key={item.name}
                              to={item.path}
                              onClick={() => setIsMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-medium transition-all border",
                                location.pathname === item.path
                                  ? "text-accent-primary bg-accent-primary/10 border-accent-primary/20"
                                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                location.pathname === item.path ? "bg-accent-primary/20 text-accent-primary" : "bg-white/5 text-slate-500"
                              )}>
                                <item.icon className="w-5 h-5" />
                              </div>
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {searchQuery && navGroups.every(g => !g.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))) && (
                    <div className="px-6 py-12 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-500 italic">No matches found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/5 shrink-0">
                <p className="text-center text-xs text-slate-600 font-bold uppercase tracking-widest">
                  © 2026 Yame Coaching
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-24 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-mystic-950 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="md" className="glow-accent" />
                <span className="text-xl font-bold tracking-tight text-gradient">EPIMETHEUS</span>
              </div>
              <p className="text-slate-500 text-sm max-w-md">
                The ultimate system for understanding female psychology and personality dynamics. 
                Based on the research of Vin DiCarlo & Brian Burke.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                {allNavItems.map(item => (
                  <Link key={item.name} to={item.path} className="text-xs text-slate-600 hover:text-accent-primary transition-colors">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-left md:text-right space-y-4">
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/10 hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Send Feedback
              </button>
              <div className="space-y-2">
                <p className="text-slate-400 text-sm font-medium">
                  © 2026 Yame Coaching.
                </p>
                <p className="text-slate-600 text-xs">
                  Crafted for mastery and understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <CommandCenter />
      
      {/* Floating Feedback Button - Repositioned higher to avoid CommandCenter overlap */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-28 right-8 p-4 rounded-full bg-mystic-900 border border-white/10 text-slate-400 shadow-xl hover:scale-110 hover:text-white hover:border-accent-primary/50 active:scale-95 transition-all z-40 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-mystic-900 border border-white/10 text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Send Feedback
        </span>
      </button>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <OnboardingModal />
    </div>
  );
}
