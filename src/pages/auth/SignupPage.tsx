import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UtensilsCrossed, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select your account type');
      return;
    }

    if (!email || !password || !companyName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await signup(email, password, role, companyName);
      navigate('/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground mb-8">
            Start verifying deliveries in minutes
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a...</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('restaurant')}
                  className={cn(
                    'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
                    role === 'restaurant'
                      ? 'border-primary bg-primary/5 shadow-glow'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="text-3xl mb-3">🍽️</div>
                  <div className="font-semibold text-foreground mb-1">Restaurant</div>
                  <div className="text-xs text-muted-foreground">
                    Verify deliveries and track accuracy
                  </div>
                  {role === 'restaurant' && (
                    <motion.div
                      layoutId="role-check"
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <ArrowRight size={12} className="text-primary-foreground" />
                    </motion.div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('supplier')}
                  className={cn(
                    'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
                    role === 'supplier'
                      ? 'border-primary bg-primary/5 shadow-glow'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="text-3xl mb-3">📦</div>
                  <div className="font-semibold text-foreground mb-1">Supplier</div>
                  <div className="text-xs text-muted-foreground">
                    Receive reports and resolve issues
                  </div>
                  {role === 'supplier' && (
                    <motion.div
                      layoutId="role-check"
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <ArrowRight size={12} className="text-primary-foreground" />
                    </motion.div>
                  )}
                </button>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company">
                {role === 'restaurant' ? 'Restaurant Name' : role === 'supplier' ? 'Company Name' : 'Company Name'}
              </Label>
              <Input
                id="company"
                placeholder={role === 'restaurant' ? 'e.g., Ravintola Savotta' : 'e.g., Kespro Oy'}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md text-center"
        >
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Never miss a missing item again
          </h2>
          <p className="text-muted-foreground">
            DeliVeri helps Finnish restaurants verify every delivery against orders, 
            catch discrepancies instantly, and recover lost revenue automatically.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
