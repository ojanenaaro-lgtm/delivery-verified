import { useState, useMemo } from 'react';
import {
    Truck,
    Search,
    Filter,
    Clock,
    CheckCircle,
    Loader2,
    Building2,
    Package,
    Calendar,
    ChevronDown,
    Send,
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    useSupplierOutgoingDeliveries,
    useOutgoingDeliveryDetails,
    useUpdateOutgoingDeliveryStatus,
    type OutgoingDeliveryStatus,
    type OutgoingDeliveryWithDetails,
} from '@/hooks/useOutgoingDeliveries';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function OutgoingDeliveries() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OutgoingDeliveryStatus | 'all'>('all');
    const [expandedDeliveries, setExpandedDeliveries] = useState<string[]>([]);

    // Fetch outgoing deliveries
    const { data: deliveries, isLoading, error } = useSupplierOutgoingDeliveries({
        status: statusFilter,
        search: searchQuery,
    });

    const updateStatus = useUpdateOutgoingDeliveryStatus();

    const toggleDelivery = (deliveryId: string) => {
        setExpandedDeliveries((prev) =>
            prev.includes(deliveryId)
                ? prev.filter((id) => id !== deliveryId)
                : [...prev, deliveryId]
        );
    };

    const getStatusBadge = (status: OutgoingDeliveryStatus) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'in_transit':
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        <Truck className="w-3 h-3 mr-1" />
                        In Transit
                    </Badge>
                );
            case 'delivered':
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Delivered
                    </Badge>
                );
            case 'confirmed':
                return (
                    <Badge variant="secondary" className="bg-[#009EE0]/10 text-[#009EE0] hover:bg-[#009EE0]/10">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmed
                    </Badge>
                );
            case 'disputed':
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                        Disputed
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleMarkInTransit = async (deliveryId: string) => {
        try {
            await updateStatus.mutateAsync({ deliveryId, status: 'in_transit' });
            toast.success('Delivery marked as in transit');
        } catch {
            toast.error('Failed to update delivery status');
        }
    };

    const handleMarkDelivered = async (deliveryId: string) => {
        try {
            await updateStatus.mutateAsync({
                deliveryId,
                status: 'delivered',
                actualDeliveryDate: new Date().toISOString(),
            });
            toast.success('Delivery marked as delivered');
        } catch {
            toast.error('Failed to update delivery status');
        }
    };

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
                    <p className="text-muted-foreground">
                        Track and manage scheduled redeliveries to restaurants
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by restaurant name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as OutgoingDeliveryStatus | 'all')}
                    >
                        <SelectTrigger className="w-full md:w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="disputed">Disputed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : deliveries && deliveries.length > 0 ? (
                    <div className="space-y-4">
                        {deliveries.map((delivery) => (
                            <DeliveryCard
                                key={delivery.id}
                                delivery={delivery}
                                isExpanded={expandedDeliveries.includes(delivery.id)}
                                onToggle={() => toggleDelivery(delivery.id)}
                                getStatusBadge={getStatusBadge}
                                onMarkInTransit={() => handleMarkInTransit(delivery.id)}
                                onMarkDelivered={() => handleMarkDelivered(delivery.id)}
                                isUpdating={updateStatus.isPending}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="shadow-sm">
                        <CardContent className="py-12 text-center">
                            <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                No outgoing deliveries
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'No deliveries match your filters. Try adjusting your search.'
                                    : 'When you schedule redeliveries for missing items, they\'ll appear here.'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainContent>
    );
}

// Delivery Card Component
interface DeliveryCardProps {
    delivery: OutgoingDeliveryWithDetails;
    isExpanded: boolean;
    onToggle: () => void;
    getStatusBadge: (status: OutgoingDeliveryStatus) => React.ReactNode;
    onMarkInTransit: () => void;
    onMarkDelivered: () => void;
    isUpdating: boolean;
}

function DeliveryCard({
    delivery,
    isExpanded,
    onToggle,
    getStatusBadge,
    onMarkInTransit,
    onMarkDelivered,
    isUpdating,
}: DeliveryCardProps) {
    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <Card
                className={cn(
                    "overflow-hidden border-l-4 transition-all",
                    delivery.status === 'pending'
                        ? "border-l-amber-500"
                        : delivery.status === 'in_transit'
                            ? "border-l-blue-500"
                            : delivery.status === 'delivered' || delivery.status === 'confirmed'
                                ? "border-l-green-500"
                                : "border-l-red-500"
                )}
            >
                <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div
                                    className={cn(
                                        "transition-transform duration-200 mt-1",
                                        isExpanded && "rotate-180"
                                    )}
                                >
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="font-semibold text-foreground">
                                            {delivery.restaurant?.name || 'Unknown Restaurant'}
                                        </span>
                                        {getStatusBadge(delivery.status)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {delivery.estimated_delivery_date
                                                ? format(new Date(delivery.estimated_delivery_date), 'MMM d, yyyy')
                                                : 'No date set'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {delivery.items_count} item{delivery.items_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="font-medium text-[#009EE0]">
                                            €{Number(delivery.total_value || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-9 sm:ml-0">
                                {/* Quick action buttons */}
                                {delivery.status === 'pending' && (
                                    <Button
                                        size="sm"
                                        className="bg-[#009EE0] hover:bg-[#0088C4]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkInTransit();
                                        }}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-1" />
                                                Send Out
                                            </>
                                        )}
                                    </Button>
                                )}
                                {delivery.status === 'in_transit' && (
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkDelivered();
                                        }}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Mark Delivered
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <DeliveryDetails deliveryId={delivery.id} />
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

// Delivery Details Component
function DeliveryDetails({ deliveryId }: { deliveryId: string }) {
    const { data, isLoading } = useOutgoingDeliveryDetails(deliveryId);

    if (isLoading) {
        return (
            <CardContent className="pt-0 pb-4 border-t border-border">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </CardContent>
        );
    }

    if (!data) {
        return (
            <CardContent className="pt-0 pb-4 border-t border-border">
                <div className="py-4 text-center text-muted-foreground">
                    Failed to load delivery details
                </div>
            </CardContent>
        );
    }

    return (
        <CardContent className="pt-0 pb-4 border-t border-border">
            <div className="mt-4 space-y-4">
                {/* Restaurant Info */}
                {data.restaurant && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Destination
                        </h4>
                        <p className="text-sm text-muted-foreground">{data.restaurant.name}</p>
                        {data.restaurant.contact_email && (
                            <p className="text-sm text-muted-foreground">{data.restaurant.contact_email}</p>
                        )}
                    </div>
                )}

                {/* Items */}
                {data.items && data.items.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Items ({data.items.length})
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium">Item</th>
                                        <th className="text-right px-4 py-2 font-medium">Qty</th>
                                        <th className="text-right px-4 py-2 font-medium">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item) => (
                                        <tr key={item.id} className="border-t border-border">
                                            <td className="px-4 py-2">{item.item_name}</td>
                                            <td className="text-right px-4 py-2">
                                                {item.quantity} {item.unit || ''}
                                            </td>
                                            <td className="text-right px-4 py-2">
                                                €{Number(item.total_price || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[#009EE0]/5">
                                    <tr className="border-t border-border">
                                        <td colSpan={2} className="px-4 py-2 font-semibold">Total</td>
                                        <td className="text-right px-4 py-2 font-bold text-[#009EE0]">
                                            €{Number(data.total_value || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {data.notes && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
                    </div>
                )}

                {/* Timestamps */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                    <span>Created: {format(new Date(data.created_at), 'MMM d, yyyy h:mm a')}</span>
                    {data.actual_delivery_date && (
                        <span>Delivered: {format(new Date(data.actual_delivery_date), 'MMM d, yyyy h:mm a')}</span>
                    )}
                </div>
            </div>
        </CardContent>
    );
}
