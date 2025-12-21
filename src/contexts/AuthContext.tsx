import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (voterId: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('voting_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (voterId: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('voter_id', voterId)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        return { success: false, message: 'Login failed. Please try again.' };
      }

      if (!data) {
        return { success: false, message: 'Invalid Voter ID or Password' };
      }

      const userData: User = {
        id: data.id,
        voter_id: data.voter_id,
        full_name: data.full_name,
        role: data.role,
        has_voted: data.has_voted,
      };

      setUser(userData);
      localStorage.setItem('voting_user', JSON.stringify(userData));
      return { success: true, message: 'Login successful' };
    } catch (err) {
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('voting_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
