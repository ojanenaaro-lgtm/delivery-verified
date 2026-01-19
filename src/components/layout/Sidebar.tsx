import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import {
    Home,
    Package,
    BarChart3,
    Building2,
    DollarSign,
    Settings,
    Chrome,
    ShoppingCart,
    Truck,
    AlertTriangle,
    Users,
    ClipboardList,
    Store,
    Menu
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuItem {
    icon: React.ComponentType<any>;
    label: string;
    path: string;
}

// Sidebar content component (shared between desktop and mobile)
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const { activeRole } = useUserRole();

    // Restaurant navigation items
    const restaurantMenuItems: MenuItem[] = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Deliveries', path: '/deliveries' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: Building2, label: 'Suppliers', path: '/suppliers' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    // Supplier navigation items - COMPLETELY DIFFERENT
    const supplierMenuItems: MenuItem[] = [
        { icon: Home, label: 'Dashboard', path: '/supplier/dashboard' },
        { icon: ShoppingCart, label: 'Incoming Orders', path: '/supplier/orders' },
        { icon: Truck, label: 'Outgoing Deliveries', path: '/supplier/deliveries' },
        { icon: AlertTriangle, label: 'Delivery Issues', path: '/supplier/issues' },
        { icon: ClipboardList, label: 'Product Catalog', path: '/supplier/products' },
        { icon: Users, label: 'Connected Restaurants', path: '/supplier/restaurants' },
        { icon: BarChart3, label: 'Analytics', path: '/supplier/analytics' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    // Choose menu based on active role
    const menuItems = activeRole === 'supplier' ? supplierMenuItems : restaurantMenuItems;

    const isActive = (path: string) => {
        if (path === '/dashboard' || path === '/supplier/dashboard') {
            return location.pathname === path || location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const getRoleDisplayName = () => {
        if (activeRole === 'restaurant') return 'Restaurant';
        if (activeRole === 'supplier') return 'Supplier';
        return null;
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        onNavigate?.(); // Close mobile drawer after navigation
    };

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
            {/* App Header */}
            <div className="p-6 border-b border-border/10">
                <Logo size="md" showSubtitle={true} />

                {/* Role Badge */}
                {activeRole && (
                    <div className="mt-4 flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`text-xs ${activeRole === 'restaurant'
                                ? 'border-[#009EE0]/30 text-[#009EE0] bg-[#009EE0]/10'
                                : 'border-[#00d4aa]/30 text-[#00d4aa] bg-[#00d4aa]/10'
                                }`}
                        >
                            {activeRole === 'restaurant' ? (
                                <Store className="w-3 h-3 mr-1" />
                            ) : (
                                <Truck className="w-3 h-3 mr-1" />
                            )}
                            {getRoleDisplayName()}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    // Use Wolt Blue for restaurant, Teal for supplier
                    const activeColor = activeRole === 'restaurant' ? '#009EE0' : '#00d4aa';

                    return (
                        <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] font-heading
                ${active
                                    ? `bg-[${activeColor}]/10 text-[${activeColor}] border-l-2 border-[${activeColor}] ml-[-2px] pl-[18px]`
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
              `}
                            style={active ? {
                                backgroundColor: `${activeColor}10`,
                                color: activeColor,
                                borderLeftColor: activeColor,
                            } : undefined}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? '' : 'text-muted-foreground'}`}
                                style={active ? { color: activeColor } : undefined} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-border/10">
                <div className="flex items-center gap-3">
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: 'w-10 h-10',
                            }
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.emailAddresses?.[0]?.emailAddress}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mobile Menu Button (for TopBar)
export function MobileMenuButton() {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    if (!isMobile) return null;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

// Desktop Sidebar
export default function Sidebar() {
    const isMobile = useIsMobile();

    if (isMobile) return null;

    return (
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <SidebarContent />
        </aside>
    );
}
