import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { motion } from 'motion/react';
import { Fingerprint, Mail, Lock, User, ArrowRight, Chrome, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const getErrorMessage = (err: any) => {
    if (!err || !err.code) return err?.message || 'An unexpected error occurred. Please try again.';
    
    switch (err.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. If you haven\'t created an account in this project yet, please click "Register" below first.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable "Email/Password".';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/configuration-not-found':
        return 'Google Sign-In is not enabled. Please enable it in the Firebase Console.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Please allow popups for this site.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled.';
      default:
        return err.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (isReset) {
        await resetPassword(email);
        setSuccess('Password reset email sent! Please check your inbox.');
        // Don't switch back immediately so they can read the message
      } else if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        if (!name) throw new Error('Name is required');
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      // Don't show an error if the user just closed the popup
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mystic-950 flex items-center justify-center p-4 relative overflow-y-auto">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-mystic-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Logo size="xl" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gradient mb-2">EPIMETHEUS</h1>
            <p className="text-slate-400 text-sm">
              {isReset 
                ? 'Reset your operative password' 
                : isLogin 
                  ? 'Welcome back to the system' 
                  : 'Create your operative account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isReset && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent-primary group-focus-within:scale-110 transition-all" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent-primary group-focus-within:scale-110 transition-all" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {!isReset && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  {isLogin && (
                    <button 
                      type="button"
                      className="text-[10px] font-bold text-accent-primary/60 hover:text-accent-primary transition-colors uppercase tracking-widest"
                      onClick={() => {
                        setIsReset(true);
                        setError('');
                        setSuccess('');
                      }}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent-primary group-focus-within:scale-110 transition-all" />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1">
                    {error}
                    {(error.includes('already registered') || error.includes('created an account')) && (
                      <button 
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="block mt-1 text-xs font-bold text-accent-primary hover:underline uppercase tracking-widest"
                      >
                        Switch to {isLogin ? 'Register' : 'Sign In'}
                      </button>
                    )}
                  </div>
                </div>
                {(error.includes('Sign-in method') || error.includes('created an account')) && (
                  <div className="p-3 rounded-xl bg-accent-primary/5 border border-accent-primary/10 text-slate-400 text-[10px] leading-relaxed">
                    <span className="text-accent-primary font-bold uppercase tracking-widest block mb-1">Admin Tip</span>
                    If you are the project owner, ensure "Email/Password" is enabled in your Firebase Console under Authentication &gt; Sign-in method.
                  </div>
                )}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full accent-gradient text-white font-bold py-4 rounded-2xl shadow-lg shadow-accent-primary/20 hover:scale-[1.02] hover:shadow-accent-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 group"
            >
              {loading ? 'Processing...' : (isReset ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Register')}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {!isReset && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-mystic-900 px-4 text-slate-500 font-bold tracking-widest">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                <Chrome className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {loading ? 'Connecting...' : 'Google Account'}
              </button>
            </>
          )}

          <div className="mt-8 text-center space-y-4">
            <button
              onClick={() => {
                if (isReset) {
                  setIsReset(false);
                  setIsLogin(true);
                } else {
                  setIsLogin(!isLogin);
                }
                setError('');
                setSuccess('');
              }}
              disabled={loading}
              className="text-sm text-slate-400 hover:text-accent-primary transition-colors disabled:opacity-50"
            >
              {isReset 
                ? "Back to Sign In" 
                : isLogin 
                  ? "Don't have an account? Register" 
                  : "Already have an account? Sign In"}
            </button>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                Secure Operative Access
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
