import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'restaurant' | 'supplier';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyName: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, companyName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'piedu@savotta.fi',
    role: 'restaurant',
    companyName: 'Ravintola Savotta',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    email: 'admin@kespro.fi',
    role: 'supplier',
    companyName: 'Kespro Oy',
    createdAt: new Date('2024-01-10'),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('deliveri_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const foundUser = MOCK_USERS.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('deliveri_user', JSON.stringify(foundUser));
    } else {
      // Create a demo user for any login attempt
      const demoUser: User = {
        id: Date.now().toString(),
        email,
        role: 'restaurant',
        companyName: 'Demo Restaurant',
        createdAt: new Date(),
      };
      setUser(demoUser);
      localStorage.setItem('deliveri_user', JSON.stringify(demoUser));
    }
    setIsLoading(false);
  };

  const signup = async (email: string, password: string, role: UserRole, companyName: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      companyName,
      createdAt: new Date(),
    };
    
    setUser(newUser);
    localStorage.setItem('deliveri_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('deliveri_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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
