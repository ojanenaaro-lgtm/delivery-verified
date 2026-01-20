import { Package, Clock, Euro, Building2, Plus, HelpCircle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeliveryCard } from '@/components/dashboard/DeliveryCard';
import { DraftDeliveryCard } from '@/components/dashboard/DraftDeliveryCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
// import { MOCK_DELIVERIES, getPendingDeliveries, Delivery } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import MainContent from '@/components/layout/MainContent';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Delivery, DeliveryItem } from '@/types/delivery';
import { toast } from 'sonner';
import { Check, X, ChevronDown, ChevronUp, AlertCircle, Loader2, Trash, Edit, ArrowRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';



export default function RestaurantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingVerifications: 0,
    totalCompensation: 0,
    activeSuppliers: 0
  });

  const fetchDeliveries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          items:delivery_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Cast to Delivery type - ensuring status and items are correctly typed
        const typedData = data.map(d => ({
          ...d,
          // Ensure status is typed correctly if DB returns generic string
          status: d.status as Delivery['status']
        })) as Delivery[];

        setDeliveries(typedData);

        // Calculate stats
        const pendingCount = typedData.filter(d => d.status === 'pending_redelivery' || d.status === 'draft').length;
        const totalComp = typedData
          .filter(d => d.missing_value > 0)
          .reduce((sum, d) => sum + Number(d.missing_value), 0);
        const uniqueSuppliers = new Set(typedData.map(d => d.supplier_name)).size;

        setStats({
          totalDeliveries: typedData.length,
          pendingVerifications: pendingCount,
          totalCompensation: totalComp,
          activeSuppliers: uniqueSuppliers
        });
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [user]);

  const handleMarkResolved = async (deliveryId: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: 'resolved' })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('Delivery marked as resolved');
      fetchDeliveries(); // Refresh data
    } catch (err) {
      console.error('Error updating delivery:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteDraft = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('Draft deleted');
      fetchDeliveries();
    } catch (err) {
      console.error('Error deleting draft:', err);
      toast.error('Failed to delete draft');
    }
  };

  if (!user) return null;

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending_redelivery');
  const draftDeliveries = deliveries.filter(d => d.status === 'draft');

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {user.companyName}!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your deliveries today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem('force_show_onboarding', 'true');
                  localStorage.removeItem('deliveri_onboarding_completed');
                  navigate('/onboarding');
                }}
                size="icon"
                className="h-10 w-10"
                title="Onboarding"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => navigate('/extract-receipt')}
                className="h-14 px-8 text-lg shadow-md hover:shadow-lg transition-all bg-[#009EE0] hover:bg-[#009EE0]/90 text-white"
              >
                <Plus className="w-6 h-6 mr-2" />
                Upload Receipt
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Package size={24} />}
              value={stats.totalDeliveries}
              label="Total Deliveries"
              variant="primary"
            />
            <StatCard
              icon={<Clock size={24} />}
              value={stats.pendingVerifications}
              label="Pending Verifications"
              variant="warning"
            />
            <StatCard
              icon={<Euro size={24} />}
              value={`€${stats.totalCompensation.toFixed(2)}`}
              label="Total Compensation"
              variant="success"
            />
            <StatCard
              icon={<Building2 size={24} />}
              value={stats.activeSuppliers}
              label="Active Suppliers"
            />
          </div>


          {/* Draft Verifications */}
          {draftDeliveries.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Verify Recent Scans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draftDeliveries.map(draft => (
                  <DraftDeliveryCard
                    key={draft.id}
                    delivery={draft}
                    onContinue={(id) => navigate(`/verify-delivery/${id}`)}
                    onDelete={handleDeleteDraft}
                    isDeleting={deletingId === draft.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Verifications */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Awaiting Supplier Resolution
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingDeliveries.length > 0 ? (
              <div className="space-y-4">
                {pendingDeliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{delivery.supplier_name}</h3>
                          </div>
                          <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <Clock size={14} />
                            {format(new Date(delivery.delivery_date), 'dd MMM yyyy')} • Order: {delivery.order_number || 'N/A'}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Missing Value</p>
                            <p className="text-xl font-bold font-mono text-destructive">€{Number(delivery.missing_value).toFixed(2)}</p>
                          </div>
                          <Button
                            onClick={() => handleMarkResolved(delivery.id)}
                            variant="outline"
                            className="text-success hover:text-success hover:bg-success/10 border-success/20"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark Resolved
                          </Button>
                        </div>
                      </div>

                      {/* Missing Items Summary or List */}
                      <div className="mt-6 pt-4 border-t border-border">
                        <button
                          onClick={() => setExpandedDeliveryId(expandedDeliveryId === delivery.id ? null : delivery.id)}
                          className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
                        >
                          <AlertCircle size={16} />
                          {delivery.items?.filter(i => i.status === 'missing').length} Items Missing
                          {expandedDeliveryId === delivery.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {expandedDeliveryId === delivery.id && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-destructive/20">
                            {delivery.items?.filter(i => i.status === 'missing').map(item => (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-muted-foreground">
                                    {item.missing_quantity} {item.unit} missing from {item.quantity} {item.unit}
                                  </p>
                                </div>
                                <div className="font-mono font-medium">
                                  €{((item.missing_quantity || 0) * item.price_per_unit).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </MainContent>
    </AppLayout >
  );
}
