import { useState } from 'react';
import {
    Truck,
    Package,
    Check,
    Clock,
    ChevronDown,
    Loader2,
    AlertTriangle,
    Building2,
    X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useRestaurantIncomingDeliveries,
    useUpdateOutgoingDeliveryStatus,
    useOutgoingDeliveryDetails,
    type OutgoingDeliveryWithDetails,
    type OutgoingDeliveryStatus,
} from '@/hooks/useOutgoingDeliveries';
import { useCreateNotification } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IncomingShipmentsSectionProps {
    className?: string;
}

// Status badge configuration (same colors as supplier view)
const statusConfig: Record<OutgoingDeliveryStatus, { label: string; className: string }> = {
    pending: { label: 'Preparing', className: 'bg-amber-100 text-amber-700' },
    in_transit: { label: 'In Transit', className: 'bg-[#009EE0]/10 text-[#009EE0]' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
    disputed: { label: 'Disputed', className: 'bg-red-100 text-red-700' },
};

// Status messages for view-only statuses
const statusMessages: Record<string, string> = {
    pending: 'Supplier is preparing this shipment',
    in_transit: 'Shipment is on its way to you',
    confirmed: 'You have confirmed receipt of this shipment',
    disputed: 'This shipment has been disputed',
};

export function IncomingShipmentsSection({ className }: IncomingShipmentsSectionProps) {
    const [expandedDeliveries, setExpandedDeliveries] = useState<string[]>([]);
    const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
    const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState('');

    // Fetch incoming deliveries
    const { data: deliveries, isLoading, error } = useRestaurantIncomingDeliveries();

    // Mutations
    const updateStatus = useUpdateOutgoingDeliveryStatus();
    const createNotification = useCreateNotification();

    const toggleDelivery = (deliveryId: string) => {
        setExpandedDeliveries((prev) =>
            prev.includes(deliveryId)
                ? prev.filter((id) => id !== deliveryId)
                : [...prev, deliveryId]
        );
    };

    const handleConfirmReceipt = async (deliveryId: string, supplierId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateStatus.mutateAsync({
                deliveryId,
                status: 'confirmed',
            });
            // Create notification for supplier
            await createNotification.mutateAsync({
                user_id: supplierId,
                type: 'delivery_confirmed',
                title: 'Delivery Confirmed',
                message: 'Restaurant confirmed receipt of your delivery',
                link_type: 'outgoing_delivery',
                link_id: deliveryId,
                metadata: { isRestaurant: false },
            });
            toast.success('Receipt confirmed');
        } catch {
            toast.error('Failed to confirm receipt');
        }
    };

    const handleOpenDisputeDialog = (deliveryId: string, supplierId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDeliveryId(deliveryId);
        setSelectedSupplierId(supplierId);
        setDisputeReason('');
        setDisputeDialogOpen(true);
    };

    const handleReportIssue = async () => {
        if (!selectedDeliveryId || !selectedSupplierId) return;

        try {
            await updateStatus.mutateAsync({
                deliveryId: selectedDeliveryId,
                status: 'disputed',
                notes: disputeReason,
            });
            // Create notification for supplier
            await createNotification.mutateAsync({
                user_id: selectedSupplierId,
                type: 'delivery_disputed',
                title: 'Delivery Disputed',
                message: disputeReason || 'Restaurant reported an issue with the delivery',
                link_type: 'outgoing_delivery',
                link_id: selectedDeliveryId,
                metadata: { isRestaurant: false, disputeReason },
            });
            toast.success('Issue reported to supplier');
            setDisputeDialogOpen(false);
            setSelectedDeliveryId(null);
            setSelectedSupplierId(null);
            setDisputeReason('');
        } catch {
            toast.error('Failed to report issue');
        }
    };

    if (error) {
        return (
            <Card className={cn("shadow-sm", className)}>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Truck className="w-5 h-5" />
                        Incoming Shipments
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Items being sent by suppliers</p>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-destructive">Error loading incoming shipments</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={cn("shadow-sm", className)}>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Truck className="w-5 h-5" />
                        Incoming Shipments
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Items being sent by suppliers</p>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : deliveries && deliveries.length > 0 ? (
                        <div className="space-y-4">
                            {deliveries.map((delivery) => (
                                <IncomingShipmentCard
                                    key={delivery.id}
                                    delivery={delivery}
                                    isExpanded={expandedDeliveries.includes(delivery.id)}
                                    onToggle={() => toggleDelivery(delivery.id)}
                                    onConfirmReceipt={(e) =>
                                        handleConfirmReceipt(delivery.id, delivery.supplier_id, e)
                                    }
                                    onReportIssue={(e) =>
                                        handleOpenDisputeDialog(delivery.id, delivery.supplier_id, e)
                                    }
                                    isUpdating={updateStatus.isPending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                No incoming shipments
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                When suppliers send items, they'll appear here
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Report Issue Dialog */}
            <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report Issue</DialogTitle>
                        <DialogDescription>
                            Describe the issue with this delivery. The supplier will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dispute-reason">Issue Description</Label>
                            <Textarea
                                id="dispute-reason"
                                placeholder="Describe what's wrong with the delivery (e.g., missing items, damaged goods, wrong quantities)..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReportIssue}
                            disabled={updateStatus.isPending || createNotification.isPending || !disputeReason.trim()}
                            variant="destructive"
                        >
                            {updateStatus.isPending || createNotification.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 mr-2" />
                            )}
                            Report Issue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Incoming Shipment Card Component
interface IncomingShipmentCardProps {
    delivery: OutgoingDeliveryWithDetails;
    isExpanded: boolean;
    onToggle: () => void;
    onConfirmReceipt: (e: React.MouseEvent) => void;
    onReportIssue: (e: React.MouseEvent) => void;
    isUpdating: boolean;
}

function IncomingShipmentCard({
    delivery,
    isExpanded,
    onToggle,
    onConfirmReceipt,
    onReportIssue,
    isUpdating,
}: IncomingShipmentCardProps) {
    const status = statusConfig[delivery.status];
    const supplierName = delivery.supplier?.name || 'Unknown Supplier';

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <Card
                className={cn(
                    'overflow-hidden border-l-4 transition-all',
                    delivery.status === 'pending' && 'border-l-amber-500',
                    delivery.status === 'in_transit' && 'border-l-[#009EE0]',
                    delivery.status === 'delivered' && 'border-l-green-500',
                    delivery.status === 'confirmed' && 'border-l-green-500',
                    delivery.status === 'disputed' && 'border-l-red-500'
                )}
            >
                <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div
                                    className={cn(
                                        'transition-transform duration-200 mt-1',
                                        isExpanded && 'rotate-180'
                                    )}
                                >
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="flex items-center gap-1 font-semibold text-foreground">
                                            <Building2 className="w-4 h-4" />
                                            {supplierName}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={cn('hover:bg-opacity-100', status.className)}
                                        >
                                            {delivery.status === 'confirmed' && (
                                                <Check className="w-3 h-3 mr-1" />
                                            )}
                                            {delivery.status === 'pending' && (
                                                <Clock className="w-3 h-3 mr-1" />
                                            )}
                                            {delivery.status === 'disputed' && (
                                                <X className="w-3 h-3 mr-1" />
                                            )}
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {delivery.items_count} item{delivery.items_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {'\u20AC'}
                                            {Number(delivery.total_value || 0).toFixed(2)}
                                        </span>
                                        <span>{format(new Date(delivery.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-9 sm:ml-0">
                                {/* Action buttons based on status */}
                                {delivery.status === 'delivered' ? (
                                    <>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={onConfirmReceipt}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Confirm Receipt
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={onReportIssue}
                                            disabled={isUpdating}
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            Report Issue
                                        </Button>
                                    </>
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">
                                        {statusMessages[delivery.status] || ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <ShipmentDetails deliveryId={delivery.id} />
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

// Shipment Details Component (fetches items when expanded)
interface ShipmentDetailsProps {
    deliveryId: string;
}

function ShipmentDetails({ deliveryId }: ShipmentDetailsProps) {
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

    if (!data || !data.items || data.items.length === 0) {
        return (
            <CardContent className="pt-0 pb-4 border-t border-border">
                <div className="py-4 text-center text-muted-foreground">No items in this shipment</div>
            </CardContent>
        );
    }

    return (
        <CardContent className="pt-0 pb-4 border-t border-border">
            <div className="mt-4">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Shipment Items
                </h4>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Item Name</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.item_name}</TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity} {item.unit || ''}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.price_per_unit
                                            ? `\u20AC${Number(item.price_per_unit).toFixed(2)}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {item.total_price
                                            ? `\u20AC${Number(item.total_price).toFixed(2)}`
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Notes section */}
                {data.notes && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
                    </div>
                )}

                {/* Supplier contact info */}
                {data.supplier && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Supplier
                        </h4>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2 font-medium">{data.supplier.name}</span>
                        </div>
                    </div>
                )}
            </div>
        </CardContent>
    );
}
