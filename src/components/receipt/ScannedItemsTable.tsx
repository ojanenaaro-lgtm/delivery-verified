import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ScannedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  receivedQuantity: number | null;
  status: 'pending' | 'received' | 'missing' | 'partial';
  note?: string;
}

interface ScannedItemsTableProps {
  items: ScannedItem[];
  onItemsChange: (items: ScannedItem[]) => void;
  editable?: boolean;
}

export function ScannedItemsTable({ items, onItemsChange, editable = true }: ScannedItemsTableProps) {
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const updateItem = (id: string, updates: Partial<ScannedItem>) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onItemsChange(newItems);
  };

  const handleStatusChange = (id: string, status: ScannedItem['status']) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updates: Partial<ScannedItem> = { status };
    
    if (status === 'received') {
      updates.receivedQuantity = item.quantity;
    } else if (status === 'missing') {
      updates.receivedQuantity = 0;
    } else if (status === 'partial') {
      updates.receivedQuantity = item.receivedQuantity ?? Math.floor(item.quantity / 2);
    }

    updateItem(id, updates);
  };

  const handleReceivedQuantityChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const item = items.find((i) => i.id === id);
    if (!item) return;

    let status: ScannedItem['status'] = 'partial';
    if (numValue === 0) status = 'missing';
    if (numValue >= item.quantity) status = 'received';

    updateItem(id, { receivedQuantity: numValue, status });
  };

  const handleNoteChange = (id: string, note: string) => {
    updateItem(id, { note });
  };

  const getStatusBadge = (status: ScannedItem['status']) => {
    switch (status) {
      case 'received':
        return <Badge variant="verified" className="text-xs">Received</Badge>;
      case 'missing':
        return <Badge variant="error" className="text-xs">Missing</Badge>;
      case 'partial':
        return <Badge variant="warning" className="text-xs">Partial</Badge>;
      default:
        return <Badge variant="pending" className="text-xs">Pending</Badge>;
    }
  };

  const getMissingValue = () => {
    return items.reduce((total, item) => {
      if (item.status === 'missing') {
        return total + item.totalPrice;
      } else if (item.status === 'partial' && item.receivedQuantity !== null) {
        const missing = item.quantity - item.receivedQuantity;
        return total + (missing * item.pricePerUnit);
      }
      return total;
    }, 0);
  };

  const getVerifiedCount = () => {
    return items.filter((item) => item.status !== 'pending').length;
  };

  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const missingValue = getMissingValue();

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-sm font-semibold text-foreground">Item</th>
                <th className="text-center p-4 text-sm font-semibold text-foreground">Ordered</th>
                <th className="text-center p-4 text-sm font-semibold text-foreground">Unit</th>
                <th className="text-right p-4 text-sm font-semibold text-foreground">Price/Unit</th>
                <th className="text-right p-4 text-sm font-semibold text-foreground">Total</th>
                {editable && (
                  <>
                    <th className="text-center p-4 text-sm font-semibold text-foreground">Received</th>
                    <th className="text-center p-4 text-sm font-semibold text-foreground">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    item.status === 'missing' && 'bg-destructive/5',
                    item.status === 'partial' && 'bg-warning/5',
                    item.status === 'received' && 'bg-success/5'
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.name}</span>
                      {item.note && (
                        <span className="text-xs text-muted-foreground italic">({item.note})</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-mono text-foreground">{item.quantity}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-muted-foreground">{item.unit}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-mono text-muted-foreground">€{item.pricePerUnit.toFixed(2)}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-mono font-medium text-foreground">€{item.totalPrice.toFixed(2)}</span>
                  </td>
                  {editable && (
                    <>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity * 2}
                            step="0.1"
                            value={item.receivedQuantity ?? ''}
                            onChange={(e) => handleReceivedQuantityChange(item.id, e.target.value)}
                            className="w-20 text-center font-mono"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="icon"
                            variant={item.status === 'received' ? 'success' : 'ghost'}
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(item.id, 'received')}
                            title="Mark as received"
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant={item.status === 'partial' ? 'warning' : 'ghost'}
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(item.id, 'partial')}
                            title="Mark as partial"
                          >
                            <AlertCircle size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant={item.status === 'missing' ? 'destructive' : 'ghost'}
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(item.id, 'missing')}
                            title="Mark as missing"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'p-4 rounded-xl border border-border bg-card',
              item.status === 'missing' && 'border-destructive/30 bg-destructive/5',
              item.status === 'partial' && 'border-warning/30 bg-warning/5',
              item.status === 'received' && 'border-success/30 bg-success/5'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit} @ €{item.pricePerUnit.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-foreground">€{item.totalPrice.toFixed(2)}</p>
                {getStatusBadge(item.status)}
              </div>
            </div>

            {editable && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-muted-foreground">Received:</span>
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity * 2}
                    step="0.1"
                    value={item.receivedQuantity ?? ''}
                    onChange={(e) => handleReceivedQuantityChange(item.id, e.target.value)}
                    className="w-24 text-center font-mono"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">{item.unit}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={item.status === 'received' ? 'success' : 'outline'}
                    className="flex-1"
                    onClick={() => handleStatusChange(item.id, 'received')}
                  >
                    <Check size={14} />
                    Received
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === 'partial' ? 'warning' : 'outline'}
                    className="flex-1"
                    onClick={() => handleStatusChange(item.id, 'partial')}
                  >
                    <AlertCircle size={14} />
                    Partial
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === 'missing' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => handleStatusChange(item.id, 'missing')}
                  >
                    <X size={14} />
                    Missing
                  </Button>
                </div>

                {/* Note input */}
                {(item.status === 'missing' || item.status === 'partial') && (
                  <div className="mt-3">
                    <Input
                      placeholder="Add a note (optional)..."
                      value={item.note || ''}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-lg font-semibold text-foreground">{items.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Verified</p>
            <p className="text-lg font-semibold text-foreground">
              {getVerifiedCount()} / {items.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Total</p>
            <p className="text-lg font-semibold font-mono text-foreground">€{totalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Missing Value</p>
            <p className={cn(
              'text-lg font-semibold font-mono',
              missingValue > 0 ? 'text-destructive' : 'text-success'
            )}>
              €{missingValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
