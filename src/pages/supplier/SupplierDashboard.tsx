import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
    ShoppingCart,
    Truck,
    AlertTriangle,
    ArrowRight,
    Users,
    Clock
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleSwitcherDropdown } from '@/components/layout/RoleSwitcherDropdown';

interface SupplierStats {
    total_orders: number;
    pending_orders: number;
    deliveries_in_transit: number;
    open_issues: number;
    connected_restaurants: number;
    total_revenue: number;
}

export default function SupplierDashboard() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState<SupplierStats>({
        total_orders: 0,
        pending_orders: 0,
        deliveries_in_transit: 0,
        open_issues: 0,
        connected_restaurants: 0,
        total_revenue: 0
    });

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 500);
    }, []);

    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome back!
                        </h1>
                        <p className="text-muted-foreground">
                            Here's an overview of your supplier activity
                        </p>
                    </div>
                    <RoleSwitcherDropdown />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <ShoppingCart className="w-5 h-5 text-[#00d4aa]" />
                                <span className="text-xs text-muted-foreground">This Month</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.total_orders}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">Pending</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.pending_orders}</p>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting Action</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Truck className="w-5 h-5 text-[#009EE0]" />
                                <span className="text-xs text-muted-foreground">In Transit</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.deliveries_in_transit}</p>
                            <p className="text-xs text-muted-foreground mt-1">Active Deliveries</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span className="text-xs text-muted-foreground">Open</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.open_issues}</p>
                            <p className="text-xs text-muted-foreground mt-1">Issues to Resolve</p>
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
                        View Incoming Orders
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        onClick={() => navigate('/supplier/deliveries')}
                        variant="outline"
                        className="h-auto py-6"
                    >
                        <Truck className="w-5 h-5 mr-2" />
                        Manage Deliveries
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        onClick={() => navigate('/supplier/issues')}
                        variant="outline"
                        className="h-auto py-6"
                    >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Review Issues
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                {/* Connected Restaurants */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#00d4aa]" />
                            Connected Restaurants
                        </CardTitle>
                        <CardDescription>
                            Restaurants that receive your deliveries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.connected_restaurants === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No connected restaurants yet</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => navigate('/supplier/restaurants')}
                                >
                                    Manage Connections
                                </Button>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                {stats.connected_restaurants} restaurants connected
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainContent>
    );
}
