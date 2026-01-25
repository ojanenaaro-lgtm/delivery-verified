import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ChevronLeft,
    ChevronRight,
    Store,
    Truck,
    Check,
    Building2,
    Phone,
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, UserRole as AuthRole } from '@/contexts/AuthContext';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useUser } from '@clerk/clerk-react';

interface RoleSelectStepProps {
    onNext: () => void;
    onBack: () => void;
}

type UserRole = 'restaurant' | 'supplier' | null;

export default function RoleSelectStep({ onNext, onBack }: RoleSelectStepProps) {
    const { updateUserMetadata } = useAuth();
    const { user: clerkUser } = useUser();
    const supabase = useAuthenticatedSupabase();
    const [selectedRole, setSelectedRole] = useState<UserRole>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Restaurant form state
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantAddress, setRestaurantAddress] = useState('');
    const [restaurantPhone, setRestaurantPhone] = useState('');

    // Supplier form state
    const [companyName, setCompanyName] = useState('');

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (selectedRole === 'restaurant') {
                if (!restaurantName.trim()) {
                    toast.error('Please enter your restaurant name');
                    setIsSubmitting(false);
                    return;
                }
                // Save restaurant data to Clerk metadata
                await updateUserMetadata({
                    role: 'restaurant' as AuthRole,
                    companyName: restaurantName,
                });

                // Sync restaurant profile to Supabase for suppliers to see
                if (clerkUser?.id) {
                    const { error: dbError } = await supabase
                        .from('restaurants')
                        .upsert({
                            id: clerkUser.id,
                            name: restaurantName.trim(),
                            contact_email: clerkUser.primaryEmailAddress?.emailAddress || null,
                            contact_phone: restaurantPhone.trim() || null,
                            street_address: restaurantAddress.trim() || null,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: 'id'
                        });

                    if (dbError) {
                        console.error('Failed to sync restaurant to database:', dbError);
                        // Don't block onboarding, but log the error
                    }
                }

                toast.success('Welcome to DeliVeri!');
                onNext();
            } else if (selectedRole === 'supplier') {
                if (!companyName.trim()) {
                    toast.error('Please enter your company name');
                    setIsSubmitting(false);
                    return;
                }
                // Save supplier data to Clerk metadata
                await updateUserMetadata({
                    role: 'supplier' as AuthRole,
                    companyName: companyName,
                });

                // Sync supplier profile to Supabase
                if (clerkUser?.id) {
                    const { error: dbError } = await supabase
                        .from('suppliers')
                        .upsert({
                            id: clerkUser.id,
                            name: companyName.trim(),
                            contact_email: clerkUser.primaryEmailAddress?.emailAddress || null,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: 'id'
                        });

                    if (dbError) {
                        console.error('Failed to sync supplier to database:', dbError);
                        // Don't block onboarding, but log the error
                    }
                }

                toast.success('Welcome to DeliVeri!');
                onNext();
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-2"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                    How will you use DeliVeri?
                </h2>
                <p className="text-[#9294a0]">
                    Choose your role to personalize your experience
                </p>
            </motion.div>

            {/* Role selection cards */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
            >
                {/* Restaurant Card */}
                <button
                    onClick={() => setSelectedRole('restaurant')}
                    className={`group relative p-5 rounded-xl border-2 transition-all duration-300 text-left ${selectedRole === 'restaurant'
                        ? 'border-[#009EE0] bg-[#009EE0]/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                >
                    {selectedRole === 'restaurant' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#009EE0] flex items-center justify-center"
                        >
                            <Check className="w-4 h-4 text-white" />
                        </motion.div>
                    )}
                    <div
                        className={`mb-3 p-3 rounded-lg w-fit transition-colors ${selectedRole === 'restaurant' ? 'bg-[#009EE0]/20' : 'bg-white/5'
                            }`}
                    >
                        <Store
                            className={`w-6 h-6 ${selectedRole === 'restaurant' ? 'text-[#009EE0]' : 'text-[#9294a0]'
                                }`}
                        />
                    </div>
                    <h3
                        className={`font-semibold text-base mb-1 ${selectedRole === 'restaurant' ? 'text-[#009EE0]' : 'text-white'
                            }`}
                    >
                        Restaurant
                    </h3>
                    <p className="text-xs text-[#9294a0] leading-relaxed">
                        Track deliveries and verify orders
                    </p>
                </button>

                {/* Supplier Card */}
                <button
                    onClick={() => setSelectedRole('supplier')}
                    className={`group relative p-5 rounded-xl border-2 transition-all duration-300 text-left ${selectedRole === 'supplier'
                        ? 'border-[#00d4aa] bg-[#00d4aa]/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                >
                    {selectedRole === 'supplier' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#00d4aa] flex items-center justify-center"
                        >
                            <Check className="w-4 h-4 text-[#0a0a0f]" />
                        </motion.div>
                    )}
                    <div
                        className={`mb-3 p-3 rounded-lg w-fit transition-colors ${selectedRole === 'supplier' ? 'bg-[#00d4aa]/20' : 'bg-white/5'
                            }`}
                    >
                        <Truck
                            className={`w-6 h-6 ${selectedRole === 'supplier' ? 'text-[#00d4aa]' : 'text-[#9294a0]'
                                }`}
                        />
                    </div>
                    <h3
                        className={`font-semibold text-base mb-1 ${selectedRole === 'supplier' ? 'text-[#00d4aa]' : 'text-white'
                            }`}
                    >
                        Supplier
                    </h3>
                    <p className="text-xs text-[#9294a0] leading-relaxed">
                        Manage orders and deliveries
                    </p>
                </button>
            </motion.div>

            {/* Conditional form based on role */}
            {selectedRole === 'restaurant' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="restaurantName" className="text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#009EE0]" />
                            Restaurant Name *
                        </Label>
                        <Input
                            id="restaurantName"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Enter your restaurant name"
                            className="bg-white/5 border-white/10 text-white placeholder:text-[#55556a]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="restaurantAddress" className="text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#009EE0]" />
                            Address (optional)
                        </Label>
                        <Input
                            id="restaurantAddress"
                            value={restaurantAddress}
                            onChange={(e) => setRestaurantAddress(e.target.value)}
                            placeholder="Enter your address"
                            className="bg-white/5 border-white/10 text-white placeholder:text-[#55556a]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="restaurantPhone" className="text-white flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#009EE0]" />
                            Phone (optional)
                        </Label>
                        <Input
                            id="restaurantPhone"
                            value={restaurantPhone}
                            onChange={(e) => setRestaurantPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            className="bg-white/5 border-white/10 text-white placeholder:text-[#55556a]"
                        />
                    </div>
                </motion.div>
            )}

            {selectedRole === 'supplier' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#00d4aa]" />
                            Company Name *
                        </Label>
                        <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter your company name"
                            className="bg-white/5 border-white/10 text-white placeholder:text-[#55556a]"
                        />
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between pt-4"
            >
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="px-6 py-5 bg-white text-black hover:bg-gray-100 border-transparent hover:text-black"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedRole || isSubmitting}
                    className={`px-6 py-5 text-white transition-all duration-300 ${selectedRole === 'restaurant'
                        ? 'bg-gradient-to-r from-[#009EE0] to-[#00B5FF] hover:shadow-[0_0_30px_rgba(0,158,224,0.3)]'
                        : selectedRole === 'supplier'
                            ? 'bg-gradient-to-r from-[#00d4aa] to-[#00e6bb] hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]'
                            : 'bg-white/10'
                        }`}
                >
                    {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                    <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
            </motion.div>
        </div>
    );
}
