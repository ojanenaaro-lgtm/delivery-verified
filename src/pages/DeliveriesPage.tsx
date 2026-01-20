import { useState, useMemo } from 'react';
import { format, isToday, isYesterday, subDays, startOfWeek, isAfter } from 'date-fns';
import { Plus, Search, ChevronRight, Eye, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_DELIVERIES, MOCK_SUPPLIERS, Delivery } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeliveriesPage() {
  const navigate = useNavigate();
  // const { user } = useAuth(); // Assuming auth context is not needed for Mocks or was removed in stash? Stash didn't use it.

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [expandedSuppliers, setExpandedSuppliers] = useState<string[]>([]);

  // Filter Logic
  const filteredDeliveries = useMemo(() => {
    return MOCK_DELIVERIES.filter((delivery) => {
      // Search
      const matchesSearch =
        delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

      // Status Filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && delivery.status === 'pending') ||
        (statusFilter === 'complete' && delivery.status === 'verified') ||
        (statusFilter === 'discrepancy' && delivery.status === 'discrepancy_reported');

      // Time Filter
      let matchesTime = true;
      const d = new Date(delivery.deliveryDate);
      const now = new Date();
      if (timeFilter === 'week') {
        matchesTime = isAfter(d, startOfWeek(now));
      } else if (timeFilter === 'month') {
        matchesTime = isAfter(d, subDays(now, 30));
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [searchQuery, statusFilter, timeFilter]);

  // Group by Supplier
  const groupedDeliveries = useMemo(() => {
    const grouped: Record<string, Delivery[]> = {};
    filteredDeliveries.forEach(d => {
      if (!grouped[d.supplierId]) {
        grouped[d.supplierId] = [];
      }
      grouped[d.supplierId].push(d);
    });

    // Sort contents by date
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
    });

    return grouped;
  }, [filteredDeliveries]);

  // Set initial expanded state
  useMemo(() => {
    // Expand all if filtering, otherwise just first few
    if (searchQuery || statusFilter !== 'all' || timeFilter !== 'all') {
      setExpandedSuppliers(Object.keys(groupedDeliveries));
    } else if (expandedSuppliers.length === 0) {
      setExpandedSuppliers(Object.keys(groupedDeliveries).slice(0, 3));
    }
  }, [groupedDeliveries, searchQuery, statusFilter, timeFilter, expandedSuppliers.length]);


  const toggleSupplier = (supplierId: string) => {
    setExpandedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const getSupplierName = (id: string) => {
    return MOCK_SUPPLIERS.find(s => s.id === id)?.name || 'Unknown Supplier';
  };

  const formatDeliveryDate = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
  };

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-4xl mx-auto pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
              <p className="text-muted-foreground mt-1">
                Track and verify all your deliveries
              </p>
            </div>
            <Button
              onClick={() => navigate('/extract-receipt')}
              className="bg-[#009DE0] hover:bg-[#009DE0]/90 text-white"
            >
              <Plus size={18} className="mr-2" />
              Upload
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by order # or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="h-11 px-4 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-[#009DE0]/20 font-medium"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">Last 30 Days</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-4 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-[#009DE0]/20 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="complete">Complete</option>
                <option value="discrepancy">Discrepancy</option>
              </select>
            </div>
          </div>

          {/* Grouped List */}
          <div className="space-y-6">
            {Object.keys(groupedDeliveries).length > 0 ? (
              Object.keys(groupedDeliveries).map(supplierId => {
                const deliveries = groupedDeliveries[supplierId];
                const isExpanded = expandedSuppliers.includes(supplierId);

                return (
                  <div key={supplierId} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {/* Supplier Header */}
                    <button
                      onClick={() => toggleSupplier(supplierId)}
                      className="w-full flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")}>
                          <ChevronRight size={20} />
                        </div>
                        <span className="font-semibold text-foreground text-lg">{getSupplierName(supplierId)}</span>
                      </div>
                      <span className="text-sm font-medium px-3 py-1 bg-muted rounded-full text-muted-foreground">
                        {deliveries.length} deliveries
                      </span>
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
                                onClick={() => navigate(delivery.status === 'pending' ? `/deliveries/${delivery.id}/verify` : `/deliveries/${delivery.id}`)}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-4 mb-2 sm:mb-0">
                                  <div className="min-w-[100px]">
                                    <p className="font-medium text-foreground">
                                      {formatDeliveryDate(delivery.deliveryDate)}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {delivery.orderNumber}
                                    </p>
                                  </div>
                                  <div className="h-10 w-px bg-border hidden sm:block mx-2" />
                                  <div className="flex flex-col justify-center">
                                    <p className="text-sm text-foreground">
                                      {delivery.items.length} items
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      €{delivery.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 gap-4">
                                  {delivery.status === 'pending' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Pending Verification
                                    </span>
                                  ) : delivery.status === 'discrepancy_reported' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      <AlertTriangle size={12} />
                                      {delivery.discrepancyValue > 0
                                        ? `-€${delivery.discrepancyValue.toFixed(2)}`
                                        : 'Discrepancy'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                      <CheckCircle size={12} />
                                      Complete
                                    </span>
                                  )}

                                  {delivery.status === 'pending' ? (
                                    <Button size="sm" variant="ghost" className="text-[#009DE0] hover:text-[#009DE0] hover:bg-[#009DE0]/10">
                                      Verify <ChevronRight size={16} className="ml-1" />
                                    </Button>
                                  ) : (
                                    <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center">
                <p className="text-muted-foreground text-lg">No deliveries found matching your filters.</p>
                <Button
                  variant="link"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTimeFilter('all'); }}
                  className="text-[#009DE0] mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </MainContent>
    </AppLayout>
  );
}
