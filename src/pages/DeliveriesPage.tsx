import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Search, ChevronRight, Eye, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Delivery, DeliveryItem } from '@/types/delivery';

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session } = useSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('deliveries')
          .select(`
            *,
            items:delivery_items(*)
          `)
          .eq('user_id', user.id)
          .order('delivery_date', { ascending: false });

        if (error) throw error;

        if (data) {
          setDeliveries(data as Delivery[]);
        }
      } catch (err) {
        console.error('Error fetching deliveries:', err);
        toast.error('Failed to load deliveries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [user]);

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      (delivery.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delivery.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || delivery.supplier_name === supplierFilter;

    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground">Draft</Badge>;
      case 'complete':
        return <Badge variant="verified" className="bg-success/10 text-success border-success/20">Verified</Badge>;
      case 'pending_redelivery':
        return <Badge variant="error" className="bg-destructive/10 text-destructive border-destructive/20">Discrepancy</Badge>;
      case 'resolved':
        return <Badge variant="verified" className="bg-success text-success-foreground">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
              <p className="text-muted-foreground mt-1">
                Track and verify all your deliveries
              </p>
            </div>
            <Button onClick={() => navigate('/extract-receipt')}>
              <Plus size={18} />
              Upload Receipt
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by order # or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="complete">Verified</option>
              <option value="pending_redelivery">Discrepancy</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="all">All Suppliers</option>
              {Array.from(new Set(deliveries.map(d => d.supplier_name))).map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>

          {/* Canvas/Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Supplier</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Order #</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Items</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Discrepancy</th>
                      <th className="text-right p-4 text-sm font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <span className="text-sm text-foreground">
                            {format(new Date(delivery.delivery_date), 'dd.MM.yyyy')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-foreground">
                            {delivery.supplier_name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-muted-foreground">
                            {delivery.order_number || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {delivery.items?.length || 0} items
                          </span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(delivery.status)}
                        </td>
                        <td className="p-4">
                          {Number(delivery.missing_value) > 0 ? (
                            <span className="font-mono text-sm font-medium text-destructive">
                              €{Number(delivery.missing_value).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant={delivery.status === 'draft' ? 'default' : 'ghost'}
                            onClick={() => {
                              if (delivery.status === 'draft') {
                                navigate(`/verify-delivery/${delivery.id}`);
                              } else {
                                navigate(`/deliveries/${delivery.id}`);
                              }
                            }}
                          >
                            {delivery.status === 'draft' ? (
                              <>
                                Verify
                                <ChevronRight size={14} />
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                View
                                <ChevronRight size={14} />
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && filteredDeliveries.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No deliveries found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </MainContent>
    </AppLayout>
  );
}
