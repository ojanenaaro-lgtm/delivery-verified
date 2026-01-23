import { useState, useMemo } from 'react';
import {
    Truck,
    Search,
    Filter,
    Package,
    MapPin,
    Clock,
    CheckCircle,
    Loader2
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSupplierDeliveriesByStatus, Delivery } from '@/hooks/useSupplierData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function OutgoingDeliveries() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Get active deliveries (complete and pending_redelivery)
    const { data: deliveries, isLoading, error } = useSupplierDeliveriesByStatus(['complete', 'pending_redelivery']);

    const filteredDeliveries = useMemo(() => {
        if (!deliveries) return [];

        let result = [...deliveries];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (d) =>
                    (d.order_number?.toLowerCase() || '').includes(query) ||
                    d.user_id.toLowerCase().includes(query)
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter((d) => d.status === statusFilter);
        }

        // Sort by delivery date
        result.sort((a, b) =>
            new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime()
        );

        return result;
    }, [deliveries, searchQuery, statusFilter]);

    const getStatusStep = (status: Delivery['status']) => {
        switch (status) {
            case 'complete':
                return 3;
            case 'pending_redelivery':
                return 2;
            default:
                return 1;
        }
    };

    const steps = [
        { label: 'Processing', icon: Package },
        { label: 'Issue Reported', icon: Clock },
        { label: 'Delivered', icon: CheckCircle },
    ];

    if (error) {
        return (
            <MainContent>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-destructive">Error loading deliveries</p>
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
                    <h1 className="text-3xl font-bold text-foreground mb-2">Outgoing Deliveries</h1>
                    <p className="text-muted-foreground">Track your deliveries to restaurants</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by order number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Active</SelectItem>
                            <SelectItem value="complete">Delivered</SelectItem>
                            <SelectItem value="pending_redelivery">Issue Reported</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredDeliveries.length > 0 ? (
                    <div className="space-y-4">
                        {filteredDeliveries.map((delivery) => {
                            const currentStep = getStatusStep(delivery.status);

                            return (
                                <Card key={delivery.id} className="overflow-hidden">
                                    <CardContent className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="font-semibold text-lg text-foreground mb-1">
                                                    {delivery.order_number || 'No order number'}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span>{format(new Date(delivery.delivery_date), 'MMM d, yyyy')}</span>
                                                    <span>•</span>
                                                    <span className="font-medium">€{Number(delivery.total_value || 0).toFixed(2)}</span>
                                                    {Number(delivery.missing_value || 0) > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-red-600">-€{Number(delivery.missing_value).toFixed(2)} missing</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    delivery.status === 'complete' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                    delivery.status === 'pending_redelivery' && "bg-red-50 text-red-700 border-red-200"
                                                )}
                                            >
                                                {delivery.status === 'complete' ? 'Delivered' : 'Issue Reported'}
                                            </Badge>
                                        </div>

                                        {/* Status Indicator */}
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-full",
                                                delivery.status === 'complete'
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "bg-red-100 text-red-600"
                                            )}>
                                                {delivery.status === 'complete' ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Clock className="w-4 h-4" />
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {delivery.status === 'complete'
                                                    ? 'Delivery completed successfully'
                                                    : 'Issue reported - awaiting resolution'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No deliveries found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Completed deliveries will appear here'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainContent>
    );
}
