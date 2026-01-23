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
    Loader2
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    useSupplierStats,
    useRecentSupplierDeliveries,
    useSupplierOpenIssues,
    Delivery
} from '@/hooks/useSupplierData';
import { format, formatDistanceToNow } from 'date-fns';

export default function SupplierDashboard() {
    const navigate = useNavigate();

    const { data: stats, isLoading: statsLoading } = useSupplierStats();
    const { data: recentDeliveries, isLoading: deliveriesLoading } = useRecentSupplierDeliveries(5);
    const { data: openIssues, isLoading: issuesLoading } = useSupplierOpenIssues();

    const isLoading = statsLoading || deliveriesLoading || issuesLoading;

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
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <ShoppingCart className="w-5 h-5 text-[#00d4aa]" />
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

                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
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
                        className="h-auto py-6 bg-[#00d4aa] hover:bg-[#00d4aa]/90 text-white"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        View All Deliveries
                        {(stats?.pendingDeliveries || 0) > 0 && (
                            <Badge className="ml-2 bg-white/20 text-white hover:bg-white/20">{stats?.pendingDeliveries}</Badge>
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        onClick={() => navigate('/supplier/deliveries')}
                        variant="outline"
                        className="h-auto py-6"
                    >
                        <Truck className="w-5 h-5 mr-2" />
                        Active Deliveries
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        onClick={() => navigate('/supplier/issues')}
                        variant="outline"
                        className="h-auto py-6"
                    >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Review Issues
                        {(stats?.openIssues || 0) > 0 && (
                            <Badge variant="destructive" className="ml-2">{stats?.openIssues}</Badge>
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Deliveries */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#00d4aa]" />
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

                    {/* Open Issues */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Open Issues
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
                            ) : openIssues && openIssues.length > 0 ? (
                                <div className="space-y-3">
                                    {openIssues.slice(0, 5).map((issue) => (
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
                                <div className="p-3 bg-[#00d4aa]/10 rounded-lg">
                                    <Users className="w-6 h-6 text-[#00d4aa]" />
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
