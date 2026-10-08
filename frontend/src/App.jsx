import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Result from './pages/Result';
import Report from './pages/Report';
import History from './pages/History';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function App() {
  const initialSession = (() => {
    const localSessionStr = localStorage.getItem('fs_local_session');
    if (!localSessionStr) return null;
    try {
      return JSON.parse(localSessionStr);
    } catch (e) {
      console.error("Error parsing local session", e);
      return null;
    }
  })();
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(() => (initialSession || !isSupabaseConfigured ? false : true));

  useEffect(() => {
    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    if (!isSupabaseConfigured) {
      setLoading(false);
      clearTimeout(fallbackTimer);
      return;
    }

    // Get current session from Supabase
    supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
      if (isMounted && supaSession) {
        setSession(supaSession);
      }
      if (isMounted) setLoading(false);
      clearTimeout(fallbackTimer);
    }).catch((err) => {
      console.warn("Supabase auth session fetch failed:", err);
      if (isMounted) setLoading(false);
      clearTimeout(fallbackTimer);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (!isMounted) return;
      if (supaSession) {
        setSession(supaSession);
      } else {
        const localSessionStr = localStorage.getItem('fs_local_session');
        if (localSessionStr) {
          try {
            setSession(JSON.parse(localSessionStr));
          } catch {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center bg-background min-h-screen text-on-surface font-title-lg">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!session ? <Register /> : <Navigate to="/dashboard" />} 
        />

        {/* Protected Routes Wrapped in Layout */}
        <Route element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/result" element={<Result />} />
          <Route path="/report" element={<Report />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile session={session} />} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
