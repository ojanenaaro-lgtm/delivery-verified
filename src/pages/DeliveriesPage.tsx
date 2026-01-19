import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Search, Filter, ChevronRight, Eye } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UploadReceiptModal } from '@/components/modals/UploadReceiptModal';
import { MOCK_DELIVERIES, MOCK_SUPPLIERS, DeliveryItem } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  const filteredDeliveries = MOCK_DELIVERIES.filter((delivery) => {
    const matchesSearch = 
      delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || delivery.supplierId === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="pending">Pending</Badge>;
      case 'verified':
        return <Badge variant="verified">Verified</Badge>;
      case 'discrepancy_reported':
        return <Badge variant="error">Discrepancy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleUploadComplete = (items: DeliveryItem[], supplierId: string, orderNumber: string) => {
    toast.success('Verification complete!', {
      description: 'The report has been sent to the supplier.',
    });
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
          <p className="text-muted-foreground mt-1">
            Track and verify all your deliveries
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
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
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="discrepancy_reported">Discrepancy</option>
        </select>
        
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
        >
          <option value="all">All Suppliers</option>
          {MOCK_SUPPLIERS.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
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
                      {format(delivery.deliveryDate, 'dd.MM.yyyy')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-foreground">
                      {delivery.supplierName}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      {delivery.orderNumber}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {delivery.items.length} items
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(delivery.status)}
                  </td>
                  <td className="p-4">
                    {delivery.discrepancyValue > 0 ? (
                      <span className="font-mono text-sm font-medium text-destructive">
                        €{delivery.discrepancyValue.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant={delivery.status === 'pending' ? 'default' : 'ghost'}
                      onClick={() => navigate(`/deliveries/${delivery.id}`)}
                    >
                      {delivery.status === 'pending' ? (
                        <>
                          Verify
                          <ChevronRight size={14} />
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          View
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDeliveries.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No deliveries found matching your criteria.</p>
          </div>
        )}
      </div>

      <UploadReceiptModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onComplete={handleUploadComplete}
      />
    </AppLayout>
  );
}
