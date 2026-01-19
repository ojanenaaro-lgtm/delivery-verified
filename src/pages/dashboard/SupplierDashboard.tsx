import { Package, AlertTriangle, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_REPORTS, MOCK_DELIVERIES } from '@/data/mockData';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function SupplierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Mock stats for supplier
  const totalDeliveries = 45;
  const pendingReports = MOCK_REPORTS.filter((r) => r.supplierStatus === 'pending_review').length;
  const resolutionRate = 98;
  const clientCount = 12;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="pending">Pending Review</Badge>;
      case 'acknowledged':
        return <Badge variant="success">Acknowledged</Badge>;
      case 'disputed':
        return <Badge variant="error">Disputed</Badge>;
      case 'resolved':
        return <Badge variant="verified">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
          label="Deliveries Made"
          variant="primary"
        />
        <StatCard
          icon={<AlertTriangle size={24} />}
          value={pendingReports}
          label="Reports to Review"
          variant="warning"
        />
        <StatCard
          icon={<CheckCircle2 size={24} />}
          value={`${resolutionRate}%`}
          label="Resolution Rate"
          variant="success"
        />
        <StatCard
          icon={<UtensilsCrossed size={24} />}
          value={clientCount}
          label="Active Restaurants"
        />
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Verification Reports
        </h2>
        
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-sm font-semibold text-foreground">Restaurant</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Order #</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Discrepancy</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-right p-4 text-sm font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_REPORTS.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-foreground">
                      {report.delivery.restaurantName}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      {report.delivery.orderNumber}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {format(report.submittedAt, 'dd.MM.yyyy')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium text-destructive">
                      €{report.discrepancyValue.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(report.supplierStatus)}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/reports/${report.id}`)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
