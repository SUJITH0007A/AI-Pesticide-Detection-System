import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  // Read local session helper
  const getStoredSession = () => {
    try {
      const local = localStorage.getItem('fs_local_session');
      return local ? JSON.parse(local) : null;
    } catch (e) {
      console.warn('Failed to parse local session:', e);
      return null;
    }
  };

  const [session, setSession] = useState(getStoredSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fast check for session on startup
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session: supaSession } } = await supabase.auth.getSession();
          if (isMounted) {
            if (supaSession) {
              setSession(supaSession);
              localStorage.removeItem('fs_local_session');
            } else {
              const local = getStoredSession();
              if (local) setSession(local);
            }
          }
        } else {
          if (isMounted) {
            const local = getStoredSession();
            if (local) setSession(local);
          }
        }
      } catch (err) {
        console.warn('Auth initialization warning:', err);
        if (isMounted) {
          const local = getStoredSession();
          if (local) setSession(local);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes
    let subscription = null;
    if (isSupabaseConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, supaSession) => {
          if (!isMounted) return;
          if (supaSession) {
            setSession(supaSession);
            localStorage.removeItem('fs_local_session');
          } else {
            const local = getStoredSession();
            setSession(local || null);
          }
        });
        subscription = data?.subscription;
      } catch (e) {
        console.warn('Error subscribing to auth changes:', e);
      }
    }

    // Listen for storage events (e.g. cross-tab changes)
    const handleStorageChange = (e) => {
      if (e.key === 'fs_local_session') {
        const updated = getStoredSession();
        if (isMounted) setSession(updated);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loginWithPassword = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    localStorage.removeItem('fs_local_session');
    if (data?.session) {
      setSession(data.session);
    }
    return data;
  };

  const registerWithPassword = async (email, password, name) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/#/dashboard`
      }
    });
    if (error) throw error;

    if (data?.session) {
      localStorage.removeItem('fs_local_session');
      setSession(data.session);
    }
    return data;
  };

  const loginOffline = (userEmail = 'demo@freshscan.local', name = '') => {
    const cleanEmail = userEmail.trim() || 'demo@freshscan.local';
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const mockSession = {
      user: {
        id: 'local-user-id',
        email: cleanEmail,
        user_metadata: {
          full_name: cleanName
        }
      }
    };
    localStorage.setItem('fs_local_session', JSON.stringify(mockSession));
    setSession(mockSession);
    return mockSession;
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out notice:', e);
    } finally {
      localStorage.removeItem('fs_local_session');
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        loading,
        loginWithPassword,
        registerWithPassword,
        loginOffline,
        logout,
        isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
