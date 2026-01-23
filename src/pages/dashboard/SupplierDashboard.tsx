import { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle2, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Delivery } from '@/types/delivery';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { userId } = useClerkAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch deliveries from Supabase
  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('deliveries')
          .select(`
            *,
            items:delivery_items(*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDeliveries(data as Delivery[]);
      } catch (err) {
        console.error('Error fetching deliveries:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [userId]);

  if (!user) return null;

  // Calculate stats from real data
  const totalDeliveries = deliveries.length;
  const pendingReports = deliveries.filter(d => d.status === 'pending_redelivery').length;
  const completeDeliveries = deliveries.filter(d => d.status === 'complete').length;
  const resolutionRate = totalDeliveries > 0 ? Math.round((completeDeliveries / totalDeliveries) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'complete':
        return <Badge variant="success">Complete</Badge>;
      case 'pending_redelivery':
        return <Badge variant="destructive">Discrepancy</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.companyName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Package size={24} />}
          value={totalDeliveries}
          label="Total Deliveries"
          variant="primary"
        />
        <StatCard
          icon={<AlertTriangle size={24} />}
          value={pendingReports}
          label="With Discrepancies"
          variant="warning"
        />
        <StatCard
          icon={<CheckCircle2 size={24} />}
          value={`${resolutionRate}%`}
          label="Completion Rate"
          variant="success"
        />
        <StatCard
          icon={<UtensilsCrossed size={24} />}
          value={completeDeliveries}
          label="Complete Deliveries"
        />
      </div>

      {/* Recent Deliveries */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Deliveries
        </h2>

        {deliveries.length === 0 ? (
          <div className="bg-muted/10 border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground font-medium">No deliveries yet.</p>
            <p className="text-muted-foreground text-sm mt-2">Upload receipts to see your delivery history.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Supplier</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Order #</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Value</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 10).map((delivery) => (
                  <tr key={delivery.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
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
                        {format(new Date(delivery.delivery_date), 'dd.MM.yyyy')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium text-foreground">
                        €{Number(delivery.total_value || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(delivery.status)}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/deliveries/${delivery.id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
