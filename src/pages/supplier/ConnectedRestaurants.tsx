import { useState, useMemo } from 'react';
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Loader2,
    AlertTriangle,
    Building2
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSupplierRestaurantsWithProfiles, useSupplierStats } from '@/hooks/useSupplierData';
import { format } from 'date-fns';

export default function ConnectedRestaurants() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: restaurants, isLoading, error } = useSupplierRestaurantsWithProfiles();
    const { data: stats } = useSupplierStats();

    const filteredRestaurants = useMemo(() => {
        if (!restaurants) return [];

        let result = [...restaurants];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (r) =>
                    r.restaurantId.toLowerCase().includes(query) ||
                    r.profile?.name?.toLowerCase().includes(query) ||
                    r.profile?.city?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [restaurants, searchQuery]);

    const totalStats = useMemo(() => {
        if (!restaurants) return { totalRestaurants: 0, totalOrders: 0, totalRevenue: 0, avgDiscrepancy: 0 };

        const totalOrders = restaurants.reduce((sum, r) => sum + r.totalDeliveries, 0);
        const totalIssues = restaurants.reduce((sum, r) => sum + r.issueCount, 0);

        return {
            totalRestaurants: restaurants.length,
            totalOrders,
            totalRevenue: restaurants.reduce((sum, r) => sum + r.totalValue, 0),
            avgDiscrepancy: totalOrders > 0 ? (totalIssues / totalOrders) * 100 : 0,
        };
    }, [restaurants]);

    if (error) {
        return (
            <MainContent>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-destructive">Error loading restaurants</p>
                    </div>
                </div>
            </MainContent>
        );
    }

    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Connected Restaurants</h1>
                    <p className="text-muted-foreground">Restaurants that have ordered from you</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#009EE0]/10 rounded-lg">
                                    <Users className="w-6 h-6 text-[#009EE0]" />
                                </div>
                                <div>
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-foreground">{totalStats.totalRestaurants}</p>
                                            <p className="text-sm text-muted-foreground">Active Restaurants</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <ShoppingCart className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-foreground">{totalStats.totalOrders}</p>
                                            <p className="text-sm text-muted-foreground">Total Orders</p>
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
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-foreground">
                                                €{totalStats.totalRevenue.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-foreground">
                                                {totalStats.avgDiscrepancy.toFixed(1)}%
                                            </p>
                                            <p className="text-sm text-muted-foreground">Avg Discrepancy Rate</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredRestaurants.map((restaurant) => (
                            <Card key={restaurant.restaurantId} className="hover:shadow-md transition-shadow overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-[#009EE0]" />
                                                {restaurant.profile?.name || `Restaurant ${restaurant.restaurantId.slice(0, 8)}`}
                                            </CardTitle>
                                            {restaurant.profile?.city && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {restaurant.profile.address && `${restaurant.profile.address}, `}
                                                    {restaurant.profile.city}
                                                    {restaurant.profile.postal_code && ` ${restaurant.profile.postal_code}`}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                restaurant.discrepancyRate < 5
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : restaurant.discrepancyRate < 15
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-red-100 text-red-700"
                                            }
                                        >
                                            {restaurant.discrepancyRate < 5 ? (
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3 mr-1" />
                                            )}
                                            {restaurant.discrepancyRate.toFixed(1)}% issues
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {/* Contact Info */}
                                    {(restaurant.profile?.contact_email || restaurant.profile?.contact_phone) && (
                                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                                            {restaurant.profile?.contact_email && (
                                                <a
                                                    href={`mailto:${restaurant.profile.contact_email}`}
                                                    className="flex items-center gap-1 hover:text-[#009EE0] transition-colors"
                                                >
                                                    <Mail className="w-3 h-3" />
                                                    {restaurant.profile.contact_email}
                                                </a>
                                            )}
                                            {restaurant.profile?.contact_phone && (
                                                <a
                                                    href={`tel:${restaurant.profile.contact_phone}`}
                                                    className="flex items-center gap-1 hover:text-[#009EE0] transition-colors"
                                                >
                                                    <Phone className="w-3 h-3" />
                                                    {restaurant.profile.contact_phone}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Last Order */}
                                    {restaurant.lastDeliveryDate && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                                            <Calendar className="w-3 h-3" />
                                            Last order: {format(new Date(restaurant.lastDeliveryDate), 'MMM d, yyyy')}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-foreground">{restaurant.totalDeliveries}</p>
                                            <p className="text-xs text-muted-foreground">Orders</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-foreground">
                                                €{restaurant.totalValue.toFixed(0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Revenue</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-red-600">{restaurant.issueCount}</p>
                                            <p className="text-xs text-muted-foreground">Issues</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No restaurants found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? 'Try adjusting your search'
                                    : 'Restaurant data will appear once you have orders'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainContent>
    );
}
