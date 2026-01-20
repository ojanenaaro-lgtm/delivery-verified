import { useState, useMemo } from 'react';
import { Package, Plus, Search, ChevronRight, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { MOCK_DELIVERIES, getPendingDeliveries, Delivery, MOCK_SUPPLIERS } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import MainContent from '@/components/layout/MainContent';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for collapsible suppliers
  // Default open: first 2 suppliers in the list
  const [expandedSuppliers, setExpandedSuppliers] = useState<string[]>([]);

  const pendingDeliveries = useMemo(() => {
    if (!user) return [];
    return getPendingDeliveries(user.id);
  }, [user]);

  // Group recent (completed) deliveries by supplier
  const recentDeliveries = useMemo(() => {
    if (!user) return {};
    const completed = MOCK_DELIVERIES.filter(d => d.restaurantId === user.id && d.status !== 'pending');
    const grouped: Record<string, Delivery[]> = {};

    completed.forEach(d => {
      if (!grouped[d.supplierId]) {
        grouped[d.supplierId] = [];
      }
      grouped[d.supplierId].push(d);
    });

    // Sort deliveries by date desc
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
    });

    return grouped;
  }, [user]);

  // Initialize expanded state once on load
  useMemo(() => {
    const suppliers = Object.keys(recentDeliveries);
    if (expandedSuppliers.length === 0 && suppliers.length > 0) {
      setExpandedSuppliers(suppliers.slice(0, 2));
    }
  }, [recentDeliveries, expandedSuppliers.length]);

  if (!user) return null;

  const toggleSupplier = (supplierId: string) => {
    setExpandedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const formatDeliveryDate = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  const getSupplierName = (id: string) => {
    return MOCK_SUPPLIERS.find(s => s.id === id)?.name || 'Unknown Supplier';
  };

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-6xl mx-auto pb-20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Welcome back, {user.companyName}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your deliveries today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Right Column (Desktop) / Top (Mobile) - Upload Card */}
            <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:sticky lg:top-6 mb-8 lg:mb-0">
              <button
                onClick={() => navigate('/extract-receipt')}
                className="w-full text-left group relative overflow-hidden bg-[#009DE0] hover:bg-[#009DE0]/90 transition-all duration-300 rounded-2xl p-6 shadow-lg shadow-[#009DE0]/20 hover:shadow-xl hover:shadow-[#009DE0]/30 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                  <Package size={120} />
                </div>

                <div className="relative z-10 flex flex-col h-full min-h-[160px] justify-between">
                  <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-sm mb-4">
                    <Plus className="w-8 h-8 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Upload Receipt
                    </h3>
                    <p className="text-blue-50 font-medium leading-relaxed">
                      Scan a new delivery receipt to start verification
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Left Column (Desktop) - Main Content */}
            <div className="lg:col-span-2 lg:row-start-1 space-y-10">

              {/* Pending Verifications Section */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  Pending Verifications
                  {pendingDeliveries.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                      {pendingDeliveries.length}
                    </span>
                  )}
                </h2>

                {pendingDeliveries.length > 0 ? (
                  <div className="space-y-3">
                    {pendingDeliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        onClick={() => navigate(`/deliveries/${delivery.id}/verify`)}
                        className="group bg-card border border-border rounded-xl p-5 hover:border-[#009DE0]/50 hover:shadow-sm transition-all cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted/50 rounded-lg text-muted-foreground">
                              <Package size={18} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{delivery.supplierName}</h3>
                              <p className="text-xs text-muted-foreground font-mono">{delivery.orderNumber}</p>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {isToday(new Date(delivery.deliveryDate)) ? 'Today' : format(new Date(delivery.deliveryDate), 'MMM d')}
                            {', '}
                            {format(new Date(delivery.deliveryDate), 'HH:mm')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pl-12">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{delivery.items.length} items</span>
                            <span>•</span>
                            <span>€{delivery.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                          </div>
                          <span className="text-sm font-medium text-[#009DE0] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Verify <ChevronRight size={16} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/10 border border-dashed border-border rounded-xl p-8 text-center">
                    <p className="text-muted-foreground font-medium">All caught up! No pending verifications.</p>
                  </div>
                )}
              </div>

              {/* Recent Deliveries Section */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">Recent Deliveries</h2>

                <div className="space-y-6">
                  {Object.keys(recentDeliveries).map(supplierId => {
                    const deliveries = recentDeliveries[supplierId];
                    const isExpanded = expandedSuppliers.includes(supplierId);

                    return (
                      <div key={supplierId} className="bg-card border border-border rounded-xl overflow-hidden">
                        {/* Supplier Header */}
                        <button
                          onClick={() => toggleSupplier(supplierId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")}>
                              <ChevronRight size={18} />
                            </div>
                            <span className="font-semibold text-foreground">{getSupplierName(supplierId)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{deliveries.length} deliveries</span>
                        </button>

                        {/* Deliveries List */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="border-t border-border">
                                {deliveries.map(delivery => (
                                  <div
                                    key={delivery.id}
                                    onClick={() => navigate(`/deliveries/${delivery.id}`)}
                                    className="flex items-center justify-between p-4 pl-12 border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm font-medium text-foreground w-20 text-right">
                                        {formatDeliveryDate(delivery.deliveryDate)}
                                      </span>
                                      <div className="h-4 w-px bg-border sm:block hidden" />
                                      <span className="text-sm text-muted-foreground w-20 sm:block hidden">
                                        {delivery.items.length} items
                                      </span>
                                      <span className="text-sm text-muted-foreground w-24">
                                        €{delivery.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {delivery.status === 'discrepancy_reported' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                          <AlertTriangle size={12} />
                                          {delivery.discrepancyValue > 0
                                            ? `Missing €${delivery.discrepancyValue.toFixed(2)}`
                                            : 'Issues Reported'}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                          <CheckCircle size={12} />
                                          Complete
                                        </span>
                                      )}
                                      <ChevronRight size={14} className="text-muted-foreground/50 ml-2" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainContent>
    </AppLayout>
  );
}
