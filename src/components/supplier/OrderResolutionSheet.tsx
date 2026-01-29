import { useState, useMemo, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import {
    Truck,
    Package,
    AlertTriangle,
    Check,
    ArrowRight,
    Calendar,
    Loader2,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateOutgoingDelivery } from '@/hooks/useOutgoingDeliveries';
import { useResolveReport, useSupplierReportDetails } from '@/hooks/useSupplierReports';
import { useCreateNotification } from '@/hooks/useNotifications';
import type { MissingItemsReportWithRestaurant, MissingItemsReportItem } from '@/hooks/useSupplierReports';
import { toast } from 'sonner';

interface OrderResolutionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: MissingItemsReportWithRestaurant | null;
}

interface ItemSelection {
    id: string;
    selected: boolean;
    quantity: number;
    originalItem: MissingItemsReportItem;
}

type Step = 'review' | 'select' | 'confirm';

export function OrderResolutionSheet({
    open,
    onOpenChange,
    report: initialReport,
}: OrderResolutionSheetProps) {
    const [step, setStep] = useState<Step>('review');
    const [itemSelections, setItemSelections] = useState<Map<string, ItemSelection>>(new Map());
    const [notes, setNotes] = useState('');
    const [estimatedDate, setEstimatedDate] = useState(
        format(addDays(new Date(), 1), 'yyyy-MM-dd')
    );

    // Fetch full report details including items
    const { data: reportDetails, isLoading: loadingDetails } = useSupplierReportDetails(
        open && initialReport?.id ? initialReport.id : undefined
    );

    // Use fetched details or fall back to initial report
    const report = reportDetails || initialReport;

    const createOutgoingDelivery = useCreateOutgoingDelivery();
    const resolveReport = useResolveReport();
    const createNotification = useCreateNotification();

    // Initialize item selections when report items are loaded
    useEffect(() => {
        if (open && report?.items && report.items.length > 0) {
            const selections = new Map<string, ItemSelection>();
            report.items.forEach(item => {
                selections.set(item.id, {
                    id: item.id,
                    selected: true,
                    quantity: item.missing_quantity,
                    originalItem: item,
                });
            });
            setItemSelections(selections);
        }
    }, [open, report?.id, report?.items?.length]);

    // Calculate totals
    const selectedItems = useMemo(() => {
        return Array.from(itemSelections.values()).filter(item => item.selected);
    }, [itemSelections]);

    const totalValue = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            const price = item.originalItem.price_per_unit || 0;
            return sum + (price * item.quantity);
        }, 0);
    }, [selectedItems]);

    const toggleItem = (itemId: string) => {
        setItemSelections(prev => {
            const newSelections = new Map(prev);
            const current = newSelections.get(itemId);
            if (current) {
                newSelections.set(itemId, { ...current, selected: !current.selected });
            }
            return newSelections;
        });
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        setItemSelections(prev => {
            const newSelections = new Map(prev);
            const current = newSelections.get(itemId);
            if (current) {
                const maxQty = current.originalItem.missing_quantity;
                const validQty = Math.max(1, Math.min(quantity, maxQty));
                newSelections.set(itemId, { ...current, quantity: validQty });
            }
            return newSelections;
        });
    };

    const handleSubmit = async () => {
        if (!report || selectedItems.length === 0) return;

        try {
            // Create the outgoing delivery
            const newDelivery = await createOutgoingDelivery.mutateAsync({
                restaurantId: report.restaurant_id,
                originalDeliveryId: report.delivery_id || undefined,
                originalReportId: report.id,
                items: selectedItems.map(item => ({
                    item_name: item.originalItem.item_name,
                    quantity: item.quantity,
                    unit: item.originalItem.unit || undefined,
                    price_per_unit: item.originalItem.price_per_unit || undefined,
                    original_item_id: item.originalItem.id,
                })),
                notes: notes || undefined,
                estimatedDeliveryDate: estimatedDate,
            });

            // Create notification for the restaurant
            await createNotification.mutateAsync({
                user_id: report.restaurant_id,
                type: 'outgoing_delivery_created',
                title: 'Incoming Shipment Scheduled',
                message: `${selectedItems.length} items are being sent to you. Expected delivery: ${format(new Date(estimatedDate), 'MMM d, yyyy')}`,
                link_type: 'outgoing_delivery',
                link_id: newDelivery.id,
                metadata: {
                    items_count: selectedItems.length,
                    total_value: totalValue,
                    estimated_date: estimatedDate,
                },
            });

            // Mark the report as resolved
            await resolveReport.mutateAsync({
                reportId: report.id,
                resolutionType: 'redelivery_scheduled',
                note: `Outgoing delivery scheduled for ${format(new Date(estimatedDate), 'MMM d, yyyy')}`,
            });

            toast.success('Outgoing delivery created', {
                description: `${selectedItems.length} items scheduled for delivery to ${report.restaurant?.name || 'restaurant'}`,
            });

            // Reset and close
            handleClose();
        } catch (error) {
            console.error('Error creating outgoing delivery:', error);
            toast.error('Failed to create outgoing delivery', {
                description: 'Please try again or contact support.',
            });
        }
    };

    const handleClose = () => {
        setStep('review');
        setNotes('');
        setEstimatedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
        setItemSelections(new Map());
        onOpenChange(false);
    };

    const isSubmitting = createOutgoingDelivery.isPending || resolveReport.isPending || createNotification.isPending;

    if (!initialReport) return null;

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#009EE0]" />
                        Send Missing Items
                    </SheetTitle>
                    <SheetDescription>
                        Create an outgoing delivery to resolve the missing items report
                    </SheetDescription>
                </SheetHeader>

                {/* Loading State */}
                {loadingDetails && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#009EE0]" />
                    </div>
                )}

                {!loadingDetails && report && (
                    <>
                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-2 my-6">
                            {['review', 'select', 'confirm'].map((s, i) => (
                                <div key={s} className="flex items-center">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                            step === s
                                                ? "bg-[#009EE0] text-white"
                                                : i < ['review', 'select', 'confirm'].indexOf(step)
                                                    ? "bg-green-500 text-white"
                                                    : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {i < ['review', 'select', 'confirm'].indexOf(step) ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    {i < 2 && (
                                        <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 space-y-6">
                            {/* Step 1: Review Report */}
                            {step === 'review' && (
                                <>
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-amber-800">Missing Items Report</h4>
                                                <p className="text-sm text-amber-700 mt-1">
                                                    {report.restaurant?.name || 'A restaurant'} reported {report.items_count || 0} missing
                                                    items valued at €{Number(report.total_missing_value || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Summary */}
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Reported Missing Items
                                        </h4>
                                        {report.items && report.items.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead>Item</TableHead>
                                                            <TableHead className="text-right">Missing</TableHead>
                                                            <TableHead className="text-right">Value</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {report.items.map(item => (
                                                            <TableRow key={item.id}>
                                                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {item.missing_quantity} {item.unit || ''}
                                                                </TableCell>
                                                                <TableCell className="text-right text-red-600">
                                                                    €{Number(item.total_missing_value || 0).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                    <TableFooter>
                                                        <TableRow className="bg-red-50">
                                                            <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                                                            <TableCell className="text-right font-bold text-red-600">
                                                                €{Number(report.total_missing_value || 0).toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableFooter>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                                                No specific items listed in this report
                                            </div>
                                        )}
                                    </div>

                                    <SheetFooter className="gap-2">
                                        <Button variant="outline" onClick={handleClose}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => setStep('select')}
                                            className="bg-[#009EE0] hover:bg-[#0088C4]"
                                            disabled={!report.items || report.items.length === 0}
                                        >
                                            Select Items to Send
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </SheetFooter>
                                </>
                            )}

                            {/* Step 2: Select Items */}
                            {step === 'select' && (
                                <>
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-3">
                                            Select items and quantities to include in the outgoing delivery
                                        </h4>
                                        <div className="space-y-3">
                                            {Array.from(itemSelections.values()).map(item => (
                                                <div
                                                    key={item.id}
                                                    className={cn(
                                                        "p-4 border rounded-lg transition-colors",
                                                        item.selected ? "border-[#009EE0] bg-[#009EE0]/5" : "border-border"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={item.selected}
                                                            onCheckedChange={() => toggleItem(item.id)}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <label
                                                                htmlFor={item.id}
                                                                className="font-medium text-foreground cursor-pointer"
                                                            >
                                                                {item.originalItem.item_name}
                                                            </label>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <div className="text-sm text-muted-foreground">
                                                                    Missing: {item.originalItem.missing_quantity} {item.originalItem.unit || ''}
                                                                </div>
                                                                {item.selected && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Label htmlFor={`qty-${item.id}`} className="text-sm">
                                                                            Send:
                                                                        </Label>
                                                                        <Input
                                                                            id={`qty-${item.id}`}
                                                                            type="number"
                                                                            min={1}
                                                                            max={item.originalItem.missing_quantity}
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                            className="w-20 h-8"
                                                                        />
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {item.originalItem.unit || 'units'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.selected && (
                                                            <Badge variant="secondary" className="bg-[#009EE0]/10 text-[#009EE0]">
                                                                €{((item.originalItem.price_per_unit || 0) * item.quantity).toFixed(2)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Selected Summary */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                {selectedItems.length} of {report.items?.length || 0} items selected
                                            </span>
                                            <span className="font-semibold text-[#009EE0]">
                                                €{totalValue.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <SheetFooter className="gap-2">
                                        <Button variant="outline" onClick={() => setStep('review')}>
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setStep('confirm')}
                                            disabled={selectedItems.length === 0}
                                            className="bg-[#009EE0] hover:bg-[#0088C4]"
                                        >
                                            Continue
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </SheetFooter>
                                </>
                            )}

                            {/* Step 3: Confirm & Schedule */}
                            {step === 'confirm' && (
                                <>
                                    <div className="space-y-4">
                                        {/* Delivery Details */}
                                        <div className="space-y-3">
                                            <Label htmlFor="delivery-date" className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Estimated Delivery Date
                                            </Label>
                                            <Input
                                                id="delivery-date"
                                                type="date"
                                                value={estimatedDate}
                                                min={format(new Date(), 'yyyy-MM-dd')}
                                                onChange={(e) => setEstimatedDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="notes">Notes (Optional)</Label>
                                            <Textarea
                                                id="notes"
                                                placeholder="Add any notes for this delivery..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        {/* Summary */}
                                        <div className="p-4 bg-[#009EE0]/5 border border-[#009EE0]/20 rounded-lg">
                                            <h4 className="font-medium text-foreground mb-3">Delivery Summary</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Destination:</span>
                                                    <span className="font-medium">{report.restaurant?.name || 'Restaurant'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Items:</span>
                                                    <span className="font-medium">{selectedItems.length} items</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Est. Delivery:</span>
                                                    <span className="font-medium">
                                                        {format(new Date(estimatedDate), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-[#009EE0]/20">
                                                    <span className="font-medium">Total Value:</span>
                                                    <span className="font-bold text-[#009EE0]">€{totalValue.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items being sent */}
                                        <div>
                                            <h4 className="text-sm font-medium text-foreground mb-2">Items to be sent:</h4>
                                            <ul className="text-sm space-y-1">
                                                {selectedItems.map(item => (
                                                    <li key={item.id} className="flex justify-between text-muted-foreground">
                                                        <span>{item.originalItem.item_name}</span>
                                                        <span>{item.quantity} {item.originalItem.unit || ''}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <SheetFooter className="gap-2">
                                        <Button variant="outline" onClick={() => setStep('select')} disabled={isSubmitting}>
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="bg-[#009EE0] hover:bg-[#0088C4]"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Truck className="w-4 h-4 mr-2" />
                                                    Create Outgoing Delivery
                                                </>
                                            )}
                                        </Button>
                                    </SheetFooter>
                                </>
                            )}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
