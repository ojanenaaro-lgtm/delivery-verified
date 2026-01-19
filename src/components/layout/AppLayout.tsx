import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserButton } from '@clerk/clerk-react';
import {
  Home,
  Package,
  BarChart3,
  Building2,
  Settings,
  ClipboardList,
  UtensilsCrossed,
  TrendingUp,
  Utensils,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const restaurantNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
  { label: 'Deliveries', href: '/deliveries', icon: <Package size={20} /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Suppliers', href: '/suppliers', icon: <Building2 size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

const supplierNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
  { label: 'Verification Reports', href: '/reports', icon: <ClipboardList size={20} /> },
  { label: 'Restaurant Clients', href: '/clients', icon: <UtensilsCrossed size={20} /> },
  { label: 'Performance', href: '/performance', icon: <TrendingUp size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleViewOnboarding = () => {
    localStorage.setItem('force_show_onboarding', 'true');
    localStorage.removeItem('deliveri_onboarding_completed');
    navigate('/onboarding');
  };

  if (!user) return null;


  const navItems = user.role === 'restaurant' ? restaurantNavItems : supplierNavItems;
  const roleLabel = user.role === 'restaurant' ? 'RESTAURANT' : 'SUPPLIER';

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-background-secondary border-r border-border flex flex-col transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 pt-8">
          <Logo showSubtitle />
        </div>

        {/* Role Indicator Card */}
        <div className="px-4 pb-4">
          <div className="bg-background-elevated rounded-xl p-4 border border-border">
            {user.role === 'restaurant' ? (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Utensils className="w-6 h-6 text-primary" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="text-xs font-semibold text-muted-foreground tracking-wider">
              {roleLabel}
            </div>
            <div className="text-sm font-medium text-foreground mt-0.5 truncate">
              {user.companyName}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={handleViewOnboarding}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <HelpCircle size={20} />
            Onboarding
          </button>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-foreground">
                {user.email}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.companyName}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
