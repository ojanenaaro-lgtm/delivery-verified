import { Package, Clock, Euro, Building2, Plus, HelpCircle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeliveryCard } from '@/components/dashboard/DeliveryCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { MOCK_DELIVERIES, getPendingDeliveries, Delivery } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import MainContent from '@/components/layout/MainContent';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        </div>
      </MainContent>
    </AppLayout>
  );
}
