import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Map Clerk user to our User type
  // For now, we use publicMetadata for role/companyName, with defaults
  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: (clerkUser.publicMetadata?.role as UserRole) || 'restaurant',
        companyName: (clerkUser.publicMetadata?.companyName as string) || clerkUser.firstName || 'My Restaurant',
        createdAt: new Date(clerkUser.createdAt || Date.now()),
      }
    : null;

  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: !isLoaded, logout }}>
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
