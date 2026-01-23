import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Delivery } from '@/types/delivery';
import { useAuth } from '@clerk/clerk-react';

interface SupplierStats {
  name: string;
  totalDeliveries: number;
  completeDeliveries: number;
  totalValue: number;
  discrepancyValue: number;
  accuracyRate: number;
}

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
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
          .select('*')
          .eq('user_id', userId);

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

  // Calculate supplier stats from deliveries
  const suppliers = useMemo((): SupplierStats[] => {
    const supplierMap: Record<string, SupplierStats> = {};

    deliveries.forEach(d => {
      if (!supplierMap[d.supplier_name]) {
        supplierMap[d.supplier_name] = {
          name: d.supplier_name,
          totalDeliveries: 0,
          completeDeliveries: 0,
          totalValue: 0,
          discrepancyValue: 0,
          accuracyRate: 0,
        };
      }

      const supplier = supplierMap[d.supplier_name];
      supplier.totalDeliveries++;
      supplier.totalValue += Number(d.total_value || 0);
      supplier.discrepancyValue += Number(d.missing_value || 0);

      if (d.status === 'complete') {
        supplier.completeDeliveries++;
      }
    });

    // Calculate accuracy rates
    return Object.values(supplierMap).map(supplier => ({
      ...supplier,
      accuracyRate: supplier.totalDeliveries > 0
        ? Math.round((supplier.completeDeliveries / supplier.totalDeliveries) * 100)
        : 0,
    }));
  }, [deliveries]);

  const getAccuracyBadge = (rate: number) => {
    if (rate >= 95) return <Badge variant="success">{rate}%</Badge>;
    if (rate >= 85) return <Badge variant="warning">{rate}%</Badge>;
    return <Badge variant="destructive">{rate}%</Badge>;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <MainContent>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MainContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground mt-1">
              View supplier performance based on your deliveries
            </p>
          </div>

          {suppliers.length === 0 ? (
            <div className="bg-muted/10 border border-dashed border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground font-medium text-lg">No suppliers yet.</p>
              <p className="text-muted-foreground text-sm mt-2">Upload receipts to see your supplier statistics.</p>
              <Button
                onClick={() => navigate('/extract-receipt')}
                className="bg-[#009DE0] hover:bg-[#009DE0]/90 text-white mt-4"
              >
                Upload Receipt
              </Button>
            </div>
          ) : (
            /* Suppliers Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.name}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{supplier.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp size={14} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Accuracy:</span>
                        {getAccuracyBadge(supplier.accuracyRate)}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Deliveries</span>
                      <span className="font-medium text-foreground">{supplier.totalDeliveries}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Value</span>
                      <span className="font-medium text-foreground">€{supplier.totalValue.toFixed(2)}</span>
                    </div>
                    {supplier.discrepancyValue > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Discrepancies</span>
                        <span className="font-medium text-destructive">€{supplier.discrepancyValue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/deliveries?supplier=${encodeURIComponent(supplier.name)}`)}
                  >
                    View Deliveries
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainContent>
    </AppLayout>
  );
}
