import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOfflineOption, setShowOfflineOption] = useState(false);
  const navigate = useNavigate();
  const { loginWithPassword, loginOffline, isSupabaseConfigured } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowOfflineOption(false);

    try {
      if (!isSupabaseConfigured) {
        setError('Supabase is not configured. Please use Offline Demo Mode to test the application.');
        setShowOfflineOption(true);
        return;
      }

      await loginWithPassword(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const isNetworkError = err.message === 'Failed to fetch' || err.message?.includes('fetch');
      if (!isSupabaseConfigured || isNetworkError) {
        setError('Supabase connection failed. Would you like to run in Offline/Demo Mode?');
        setShowOfflineOption(true);
      } else {
        setError(`${err.message || 'An error occurred during sign in.'} You can still log in using Offline/Demo Mode.`);
        setShowOfflineOption(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    loginOffline(email);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-primary/10 via-background to-primary/5 p-4 relative overflow-hidden">
      {/* Decorative blurred background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 lg:w-96 lg:h-96 bg-primary-fixed-dim/15 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 lg:w-96 lg:h-96 bg-primary-container/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-[460px] mx-auto bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-[0_24px_90px_rgba(0,0,0,0.12)] rounded-[32px] p-8 sm:p-10 flex flex-col gap-6 relative z-10 animate-fade-in">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-[26px]">biotech</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">FreshScan</h1>
          <p className="text-on-surface-variant text-body-md text-center">AI Pesticide & Quality Detection</p>
        </div>

        <div className="flex flex-col gap-1 text-center">
          <h2 className="font-title-lg text-title-lg font-bold text-on-surface">Welcome Back</h2>
          <p className="text-on-surface-variant text-body-md">Sign in to check your produce safety</p>
        </div>

        {/* Error Alert Panel */}
        {error && (
          <div className="p-4 bg-tertiary-container/10 text-tertiary border border-tertiary/20 rounded-xl flex flex-col gap-2 text-body-md">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
            {showOfflineOption && (
              <button
                type="button"
                onClick={handleOfflineMode}
                className="mt-2 w-full py-2 bg-secondary text-on-secondary rounded-lg font-semibold text-body-md shadow-sm active:scale-[0.98] hover:bg-secondary/90 transition-all"
              >
                Use Local Demo Mode
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email Input Group */}
          <div className="flex flex-col gap-1.5">
            <label className="text-on-surface font-semibold text-body-md">Email</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant/60 text-[20px]">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest/90 border border-outline-variant/60 rounded-xl font-body-md text-on-surface placeholder:text-on-surface-variant/40 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password Input Group */}
          <div className="flex flex-col gap-1.5">
            <label className="text-on-surface font-semibold text-body-md">Password</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant/60 text-[20px]">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest/90 border border-outline-variant/60 rounded-xl font-body-md text-on-surface placeholder:text-on-surface-variant/40 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-primary text-on-primary hover:bg-primary/95 font-semibold rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>

        {/* Demo Mode Direct Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleOfflineMode}
            className="text-primary font-semibold text-body-md hover:underline active:scale-95 transition-transform"
          >
            Explore App in Offline Demo Mode
          </button>
        </div>

        {/* Footer Link */}
        <p className="text-center font-body-md text-on-surface-variant mt-2 border-t border-outline-variant/30 pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
