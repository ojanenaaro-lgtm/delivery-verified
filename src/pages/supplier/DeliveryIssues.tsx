import { useState, useMemo } from 'react';
import {
    AlertTriangle,
    Search,
    Filter,
    ChevronDown,
    Check,
    X,
    MessageSquare,
    Package,
    Calendar,
    Loader2
} from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useSupplierIssues, useSupplierDeliveryWithItems, useUpdateDeliveryStatus, Delivery } from '@/hooks/useSupplierData';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DeliveryIssues() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

    const { data: issues, isLoading, error } = useSupplierIssues();
    const updateStatus = useUpdateDeliveryStatus();

    const filteredIssues = useMemo(() => {
        if (!issues) return [];

        let result = [...issues];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (i) =>
                    (i.order_number?.toLowerCase() || '').includes(query) ||
                    i.user_id.toLowerCase().includes(query)
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter((i) => i.status === statusFilter);
        }

        // Sort by date (newest first)
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return result;
    }, [issues, searchQuery, statusFilter]);

    const toggleIssue = (issueId: string) => {
        setExpandedIssues((prev) =>
            prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
        );
    };

    const getStatusBadge = (status: Delivery['status']) => {
        switch (status) {
            case 'pending_redelivery':
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Pending Resolution
                    </Badge>
                );
            case 'resolved':
                return (
                    <Badge variant="secondary" className="bg-[#009EE0]/10 text-[#009EE0] hover:bg-[#009EE0]/10">
                        <Check className="w-3 h-3 mr-1" />
                        Resolved
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {status}
                    </Badge>
                );
        }
    };

    const handleResolve = async (issueId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateStatus.mutateAsync({ deliveryId: issueId, status: 'resolved' });
            toast.success('Issue marked as resolved');
        } catch (err) {
            toast.error('Failed to resolve issue');
        }
    };

    if (error) {
        return (
            <MainContent>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-destructive">Error loading issues</p>
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
                    <h1 className="text-3xl font-bold text-foreground mb-2">Delivery Issues</h1>
                    <p className="text-muted-foreground">Manage discrepancies reported by restaurants</p>
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
                            <SelectItem value="all">All Issues</SelectItem>
                            <SelectItem value="pending_redelivery">Pending Resolution</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredIssues.length > 0 ? (
                    <div className="space-y-4">
                        {filteredIssues.map((issue) => {
                            const isExpanded = expandedIssues.includes(issue.id);

                            return (
                                <Collapsible key={issue.id} open={isExpanded} onOpenChange={() => toggleIssue(issue.id)}>
                                    <Card className={cn(
                                        "overflow-hidden border-l-4",
                                        issue.status === 'pending_redelivery'
                                            ? "border-l-red-500"
                                            : "border-l-transparent"
                                    )}>
                                        <CollapsibleTrigger asChild>
                                            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "transition-transform duration-200",
                                                            isExpanded && "rotate-180"
                                                        )}>
                                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="font-semibold text-foreground">
                                                                    {issue.order_number || 'No order number'}
                                                                </span>
                                                                {getStatusBadge(issue.status)}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span>{format(new Date(issue.delivery_date), 'MMM d, yyyy')}</span>
                                                                <span>•</span>
                                                                <span className="text-red-600 font-medium">
                                                                    -€{Number(issue.missing_value || 0).toFixed(2)} missing
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-sm text-muted-foreground">
                                                                Reported {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                        {issue.status === 'pending_redelivery' && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#009EE0] hover:bg-[#0088C4]"
                                                                onClick={(e) => handleResolve(issue.id, e)}
                                                                disabled={updateStatus.isPending}
                                                            >
                                                                {updateStatus.isPending ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Check className="w-4 h-4 mr-1" />
                                                                        Resolve
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <IssueDetails deliveryId={issue.id} missingValue={Number(issue.missing_value || 0)} />
                                        </CollapsibleContent>
                                    </Card>
                                </Collapsible>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No issues found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Reported issues will be listed here'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainContent>
    );
}

// Issue details component
function IssueDetails({ deliveryId, missingValue }: { deliveryId: string; missingValue: number }) {
    const { data, isLoading } = useSupplierDeliveryWithItems(deliveryId);

    if (isLoading) {
        return (
            <CardContent className="pt-0 pb-4 border-t border-border">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </CardContent>
        );
    }

    const missingItems = data?.items?.filter((item) => item.status === 'missing') || [];

    return (
        <CardContent className="pt-0 pb-4 border-t border-border">
            <div className="mt-4">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Reported Discrepancies
                </h4>

                {missingItems.length > 0 ? (
                    <div className="space-y-3">
                        {missingItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                            >
                                <div>
                                    <span className="font-medium text-foreground">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                        Missing
                                    </Badge>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        Ordered: {item.quantity} {item.unit}
                                        {item.received_quantity != null && (
                                            <span> • Received: {item.received_quantity} {item.unit}</span>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-red-600">
                                        -€{Number(item.total_price || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">No specific items marked as missing</p>
                )}

                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-foreground">Total Discrepancy Value</span>
                    <span className="text-lg font-bold text-red-600">
                        -€{missingValue.toFixed(2)}
                    </span>
                </div>
            </div>
        </CardContent>
    );
}
