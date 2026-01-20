import { motion } from 'framer-motion';
import { Check, X, Circle, AlertTriangle, Calendar, Building2, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Delivery, DeliveryItem } from '@/types/delivery';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DraftDeliveryCardProps {
    delivery: Delivery;
    onDelete: (id: string) => void;
    onContinue: (id: string) => void;
    isDeleting?: boolean;
}

interface DeliveryStatusBreakdown {
    received: number;
    missing: number;
    pending: number;
    missingValue: number;
    totalItems: number;
    verifiedCount: number;
}

export function DraftDeliveryCard({
    delivery,
    onDelete,
    onContinue,
    isDeleting = false
}: DraftDeliveryCardProps) {

    const getStatusBreakdown = (items: DeliveryItem[] = []): DeliveryStatusBreakdown => {
        // Treat 'pending' status explicitly, and default to pending if status is missing/unknown but not received/missing
        const received = items.filter(i => i.status === 'received').length;
        const missing = items.filter(i => i.status === 'missing').length;
        // Count explicit pending or anything else not finalized
        const pending = items.filter(i => i.status === 'pending' || (i.status !== 'received' && i.status !== 'missing')).length;

        const missingValue = items
            .filter(i => i.status === 'missing')
            .reduce((sum, i) => sum + ((i.missing_quantity ?? i.quantity) * (i.price_per_unit ?? 0)), 0);

        return {
            received,
            missing,
            pending,
            missingValue,
            totalItems: items.length,
            verifiedCount: received + missing,
        };
    };

    const { received, missing, pending, missingValue, totalItems, verifiedCount } = getStatusBreakdown(delivery.items);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-lg">{delivery.supplier_name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(delivery.delivery_date), 'dd MMM yyyy')}
                        </span>
                        {delivery.order_number && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span>Order: {delivery.order_number}</span>
                            </>
                        )}
                    </div>
                </div>
                <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-secondary whitespace-nowrap">
                    Draft
                </Badge>
            </div>

            {/* Status Breakdown */}
            <div className="flex flex-wrap gap-4 text-sm font-medium mb-4">
                <div className={cn("flex items-center gap-1.5", received > 0 ? "text-green-600" : "text-muted-foreground/50")}>
                    <Check size={16} />
                    <span>{received} received</span>
                </div>
                <div className={cn("flex items-center gap-1.5", missing > 0 ? "text-destructive" : "text-muted-foreground/50")}>
                    <X size={16} />
                    <span>{missing} missing</span>
                </div>
                <div className={cn("flex items-center gap-1.5", pending > 0 ? "text-muted-foreground" : "text-muted-foreground/30")}>
                    <Circle size={14} className="fill-current opacity-50" />
                    <span>{pending} pending</span>
                </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-2 mb-6">
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                    {received > 0 && (
                        <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(received / totalItems) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    )}
                    {missing > 0 && (
                        <motion.div
                            className="h-full bg-destructive"
                            initial={{ width: 0 }}
                            animate={{ width: `${(missing / totalItems) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                        />
                    )}
                    {pending > 0 && (
                        <motion.div
                            className="h-full bg-muted-foreground/30"
                            initial={{ width: 0 }}
                            animate={{ width: `${(pending / totalItems) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                        />
                    )}
                </div>
                <p className="text-xs text-muted-foreground text-right">
                    {verifiedCount} of {totalItems} items verified
                </p>
            </div>

            {/* Missing Value Warning */}
            {missingValue > 0 && (
                <div className="mb-6 flex items-start gap-2 text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Discrepancy Detected</p>
                        <p className="text-sm opacity-90">€{missingValue.toFixed(2)} reported missing so far</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
                <Button
                    className="flex-1"
                    onClick={() => onContinue(delivery.id)}
                    disabled={isDeleting}
                >
                    <Edit size={16} className="mr-2" />
                    Continue
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(delivery.id)}
                    disabled={isDeleting}
                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </Button>
            </div>
        </motion.div>
    );
}
