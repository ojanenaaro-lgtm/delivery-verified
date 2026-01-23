import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    Truck,
    AlertTriangle,
    ArrowRight,
    Users,
    Clock,
    DollarSign,
    Package,
    Loader2,
    Bell,
    Wifi,
    WifiOff
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    useSupplierStats,
    useRecentSupplierDeliveries,
    useSupplierOpenIssues,
    useRealtimeDiscrepancyAlerts,
    Delivery
} from '@/hooks/useSupplierData';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SupplierDashboard() {
    const navigate = useNavigate();

    const { data: stats, isLoading: statsLoading } = useSupplierStats();
    const { data: recentDeliveries, isLoading: deliveriesLoading } = useRecentSupplierDeliveries(5);
    const { data: openIssues, isLoading: issuesLoading } = useSupplierOpenIssues();

    // Real-time subscription for live updates
    const {
        isConnected,
        newReportsCount,
        recentReports,
        lastEvent,
        clearAlerts
    } = useRealtimeDiscrepancyAlerts();

    const isLoading = statsLoading || deliveriesLoading || issuesLoading;

    // Show toast notification when new report arrives
    useEffect(() => {
        if (lastEvent && lastEvent.type === 'INSERT') {
            const missingValue = Number(lastEvent.delivery.missing_value || 0);
            if (missingValue > 0 || lastEvent.delivery.status === 'pending_redelivery') {
                toast.error(
                    `New discrepancy report: €${missingValue.toFixed(2)} missing`,
                    {
                        description: `Order ${lastEvent.delivery.order_number || 'Unknown'} - ${format(new Date(lastEvent.delivery.delivery_date), 'MMM d')}`,
                        action: {
                            label: 'View',
                            onClick: () => navigate('/supplier/issues'),
                        },
                        duration: 8000,
                    }
                );
            } else {
                toast.success(
                    'New delivery received',
                    {
                        description: `Order ${lastEvent.delivery.order_number || 'Unknown'} - €${Number(lastEvent.delivery.total_value || 0).toFixed(2)}`,
                        duration: 5000,
                    }
                );
            }
        } else if (lastEvent && lastEvent.type === 'UPDATE') {
            const missingValue = Number(lastEvent.delivery.missing_value || 0);
            if (missingValue > 0) {
                toast.warning(
                    `Delivery updated with discrepancy`,
                    {
                        description: `Order ${lastEvent.delivery.order_number || 'Unknown'} - €${missingValue.toFixed(2)} missing`,
                        action: {
                            label: 'View',
                            onClick: () => navigate('/supplier/issues'),
                        },
                        duration: 6000,
                    }
                );
            }
        }
    }, [lastEvent, navigate]);

    const getStatusBadge = (status: Delivery['status']) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>;
            case 'complete':
                return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Complete</Badge>;
            case 'pending_redelivery':
                return <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">Issue Reported</Badge>;
            case 'resolved':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Resolved</Badge>;
        }
    };

    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Supplier Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Here's an overview of your supplier activity
                        </p>
                    </div>
                    {/* Real-time Status Indicator */}
                    <div className="flex items-center gap-4">
                        {newReportsCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="relative border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    navigate('/supplier/issues');
                                    clearAlerts();
                                }}
                            >
                                <Bell className="w-4 h-4 mr-2 animate-pulse" />
                                {newReportsCount} new report{newReportsCount > 1 ? 's' : ''}
                            </Button>
                        )}
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                                isConnected
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                            )}
                        >
                            {isConnected ? (
                                <>
                                    <Wifi className="w-3 h-3" />
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Live
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3 h-3" />
                                    Connecting...
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <ShoppingCart className="w-5 h-5 text-[#009EE0]" />
                                <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                            {statsLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-foreground">{stats?.totalDeliveries || 0}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Total Deliveries</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">Pending</span>
                            </div>
                            {statsLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-foreground">{stats?.pendingDeliveries || 0}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Draft Orders</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Truck className="w-5 h-5 text-[#009EE0]" />
                                <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                            {statsLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-foreground">{stats?.activeDeliveries || 0}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Active Deliveries</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={cn(
                        "border-border transition-all",
                        newReportsCount > 0 && "ring-2 ring-red-500 ring-offset-2"
                    )}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <AlertTriangle className={cn(
                                    "w-5 h-5 text-red-500",
                                    newReportsCount > 0 && "animate-pulse"
                                )} />
                                <span className="text-xs text-muted-foreground">Open</span>
                            </div>
                            {statsLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-foreground">{stats?.openIssues || 0}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Issues to Resolve</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Button
                        onClick={() => navigate('/supplier/orders')}
                        className="h-auto py-6 bg-[#009EE0] hover:bg-[#009EE0]/90 text-white"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        View All Deliveries
                        {(stats?.pendingDeliveries || 0) > 0 && (
                            <Badge className="ml-2 bg-white/20 text-white hover:bg-white/20">{stats?.pendingDeliveries}</Badge>
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        onClick={() => navigate('/supplier/restaurants')}
                        variant="outline"
                        className="h-auto py-6"
                    >
                        <Users className="w-5 h-5 mr-2" />
                        Connected Restaurants
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        onClick={() => {
                            navigate('/supplier/issues');
                            clearAlerts();
                        }}
                        variant="outline"
                        className={cn(
                            "h-auto py-6",
                            newReportsCount > 0 && "border-red-200 bg-red-50 hover:bg-red-100"
                        )}
                    >
                        <AlertTriangle className={cn(
                            "w-5 h-5 mr-2",
                            newReportsCount > 0 && "text-red-500"
                        )} />
                        Review Issues
                        {((stats?.openIssues || 0) > 0 || newReportsCount > 0) && (
                            <Badge variant="destructive" className="ml-2">
                                {newReportsCount > 0 ? `${newReportsCount} new` : stats?.openIssues}
                            </Badge>
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Deliveries */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#009EE0]" />
                                Recent Deliveries
                            </CardTitle>
                            <CardDescription>
                                Latest deliveries from restaurants
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {deliveriesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : recentDeliveries && recentDeliveries.length > 0 ? (
                                <div className="space-y-3">
                                    {recentDeliveries.map((delivery) => (
                                        <div
                                            key={delivery.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                                            onClick={() => navigate('/supplier/orders')}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-foreground truncate">
                                                        {delivery.order_number || 'No order #'}
                                                    </span>
                                                    {getStatusBadge(delivery.status)}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span>{format(new Date(delivery.delivery_date), 'MMM d, yyyy')}</span>
                                                    <span>•</span>
                                                    <span>€{Number(delivery.total_value || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                                {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No deliveries yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Open Issues - Now with real-time updates */}
                    <Card className={cn(
                        "transition-all",
                        newReportsCount > 0 && "ring-2 ring-red-200"
                    )}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className={cn(
                                    "w-5 h-5 text-red-500",
                                    newReportsCount > 0 && "animate-pulse"
                                )} />
                                Open Issues
                                {newReportsCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 animate-pulse">
                                        {newReportsCount} new
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Discrepancies reported by restaurants
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {issuesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (openIssues && openIssues.length > 0) || recentReports.length > 0 ? (
                                <div className="space-y-3">
                                    {/* Show new real-time reports first with highlight */}
                                    {recentReports.map((report) => (
                                        <div
                                            key={`new-${report.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors animate-pulse"
                                            onClick={() => {
                                                navigate('/supplier/issues');
                                                clearAlerts();
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="destructive" className="text-xs">NEW</Badge>
                                                    <span className="font-medium text-foreground truncate">
                                                        {report.order_number || 'No order #'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="text-red-600 font-medium">
                                                        -€{Number(report.missing_value || 0).toFixed(2)} missing
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-red-600 font-medium whitespace-nowrap ml-4">
                                                Just now
                                            </span>
                                        </div>
                                    ))}
                                    {/* Show existing open issues */}
                                    {openIssues?.slice(0, 5 - recentReports.length).map((issue) => (
                                        <div
                                            key={issue.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                                            onClick={() => navigate('/supplier/issues')}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-foreground truncate">
                                                        {issue.order_number || 'No order #'}
                                                    </span>
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                                                        Pending
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="text-red-600 font-medium">
                                                        -€{Number(issue.missing_value || 0).toFixed(2)} missing
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                                {format(new Date(issue.delivery_date), 'MMM d')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No open issues</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#009EE0]/10 rounded-lg">
                                    <Users className="w-6 h-6 text-[#009EE0]" />
                                </div>
                                <div>
                                    {statsLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-foreground">{stats?.uniqueRestaurants || 0}</p>
                                            <p className="text-sm text-muted-foreground">Unique Restaurants</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    {statsLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-foreground">€{(stats?.totalRevenue || 0).toFixed(2)}</p>
                                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainContent>
    );
}
