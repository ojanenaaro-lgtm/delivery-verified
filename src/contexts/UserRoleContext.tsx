import React, { createContext, useContext, useState, useEffect } from 'react';

type ViewMode = 'restaurant' | 'supplier';

interface UserRoleContextType {
    activeRole: ViewMode;
    switchRole: (role: ViewMode) => void;
    hasRestaurantRole: boolean;
    hasSupplierRole: boolean;
    loading: boolean;
    isOnboarded: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const STORAGE_KEY = 'deliveri-active-role';

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
    const [activeRole, setActiveRole] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'restaurant' || stored === 'supplier') {
                return stored;
            }
        }
        return 'restaurant'; // Default to restaurant
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, activeRole);
        console.log('[UserRoleContext] Active role set to:', activeRole);
    }, [activeRole]);

    const switchRole = (role: ViewMode) => {
        console.log('[UserRoleContext] Switching to:', role);
        setActiveRole(role);
    };

    return (
        <UserRoleContext.Provider
            value={{
                activeRole,
                switchRole,
                // Always allow both roles (can be restricted later based on user data)
                hasRestaurantRole: true,
                hasSupplierRole: true,
                loading: false,
                isOnboarded: true,
            }}
        >
            {children}
        </UserRoleContext.Provider>
    );
}

export function useUserRole() {
    const context = useContext(UserRoleContext);
    if (!context) {
        throw new Error('useUserRole must be used within UserRoleProvider');
    }
    return context;
}
