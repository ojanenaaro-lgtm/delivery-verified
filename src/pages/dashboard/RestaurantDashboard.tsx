import { useState } from 'react';
import { Package, Clock, Euro, Building2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeliveryCard } from '@/components/dashboard/DeliveryCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { MOCK_DELIVERIES, getPendingDeliveries, Delivery } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'financial'>('deliveries');

  if (!user) return null;

  const pendingDeliveries = getPendingDeliveries(user.id);
  const totalDeliveries = MOCK_DELIVERIES.filter((d) => d.restaurantId === user.id).length;
  const recoveredAmount = MOCK_DELIVERIES
    .filter((d) => d.restaurantId === user.id && d.discrepancyValue > 0)
    .reduce((sum, d) => sum + d.discrepancyValue, 0);
  const supplierCount = new Set(MOCK_DELIVERIES.map((d) => d.supplierId)).size;

  const handleVerify = (delivery: Delivery) => {
    navigate(`/deliveries/${delivery.id}/verify`);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.companyName}!
          </p>
        </div>
        <Button onClick={() => navigate('/upload-receipt')}>
          <Plus size={18} />
          Upload Receipt
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mb-8">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'deliveries'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Deliveries
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'financial'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Financial Overview
        </button>
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
          icon={<Clock size={24} />}
          value={pendingDeliveries.length}
          label="Pending Verifications"
          variant="warning"
        />
        <StatCard
          icon={<Euro size={24} />}
          value={`€${recoveredAmount.toFixed(2)}`}
          label="Total Compensation"
          variant="success"
        />
        <StatCard
          icon={<Building2 size={24} />}
          value={supplierCount}
          label="Active Suppliers"
        />
      </div>

      {/* Pending Verifications */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Pending Verifications
        </h2>
        
        {pendingDeliveries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onVerify={handleVerify}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </AppLayout>
  );
}
