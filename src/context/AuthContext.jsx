import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const pendingRedirectRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          pendingRedirectRef.current = false;
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
          
          if (pendingRedirectRef.current) {
            pendingRedirectRef.current = false;
            navigate('/dashboard');
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    signInWithPassword: async (email, password) => {
      pendingRedirectRef.current = true;
      return supabase.auth.signInWithPassword({ email, password });
    },
    signOut: () => supabase.auth.signOut(),
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
