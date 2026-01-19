import { AppLayout } from '@/components/layout/AppLayout';
import { MOCK_SUPPLIERS } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, TrendingUp, ExternalLink, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuppliersPage() {
  const navigate = useNavigate();

  const getAccuracyBadge = (rate: number) => {
    if (rate >= 95) return <Badge variant="success">{rate}%</Badge>;
    if (rate >= 85) return <Badge variant="warning">{rate}%</Badge>;
    return <Badge variant="error">{rate}%</Badge>;
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your supplier relationships
        </p>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SUPPLIERS.map((supplier) => (
          <div
            key={supplier.id}
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} />
                <span>{supplier.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} />
                <span>{supplier.phone}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/suppliers/${supplier.id}`)}
            >
              View Details
              <ExternalLink size={14} />
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
