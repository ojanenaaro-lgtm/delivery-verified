import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Check, AlertCircle, ChevronRight, ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MOCK_SUPPLIERS, MOCK_PRODUCTS, DeliveryItem } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface UploadReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (items: DeliveryItem[], supplierId: string, orderNumber: string) => void;
}

type Step = 'upload' | 'processing' | 'review' | 'verify';

interface VerificationStatus {
  [itemId: string]: 'pending' | 'received' | 'missing' | 'partial';
}

interface PartialQuantities {
  [itemId: string]: number;
}

interface ItemNotes {
  [itemId: string]: string;
}

export function UploadReceiptModal({ open, onClose, onComplete }: UploadReceiptModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [supplierId, setSupplierId] = useState('sup-1');
  const [orderNumber, setOrderNumber] = useState('INV-2025-' + Math.floor(1000 + Math.random() * 9000));
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Mock extracted items
  const [extractedItems, setExtractedItems] = useState<DeliveryItem[]>([]);
  
  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({});
  const [partialQuantities, setPartialQuantities] = useState<PartialQuantities>({});
  const [itemNotes, setItemNotes] = useState<ItemNotes>({});

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generateMockItems = () => {
    // Generate random items from mock products
    const numItems = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...MOCK_PRODUCTS].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffled.slice(0, numItems);
    
    return selectedProducts.map((product, index) => {
      const quantity = Math.floor(3 + Math.random() * 20);
      return {
        id: `item-new-${index}`,
        name: product.name,
        orderedQuantity: quantity,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit,
        totalPrice: Number((quantity * product.pricePerUnit).toFixed(2)),
        receivedQuantity: null,
        status: 'pending' as const,
      };
    });
  };

  const handleNext = async () => {
    if (step === 'upload' && file) {
      setStep('processing');
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const items = generateMockItems();
      setExtractedItems(items);
      // Initialize verification status
      const initialStatus: VerificationStatus = {};
      items.forEach((item) => {
        initialStatus[item.id] = 'pending';
      });
      setVerificationStatus(initialStatus);
      setStep('review');
    } else if (step === 'review') {
      setStep('verify');
    }
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('upload');
      setFile(null);
    } else if (step === 'verify') {
      setStep('review');
    }
  };

  const handleItemStatusChange = (itemId: string, status: 'received' | 'missing' | 'partial') => {
    setVerificationStatus((prev) => ({ ...prev, [itemId]: status }));
    if (status !== 'partial') {
      setPartialQuantities((prev) => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  const handlePartialQuantityChange = (itemId: string, quantity: number) => {
    setPartialQuantities((prev) => ({ ...prev, [itemId]: quantity }));
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes((prev) => ({ ...prev, [itemId]: note }));
  };

  const handleComplete = () => {
    const finalItems = extractedItems.map((item) => {
      const status = verificationStatus[item.id];
      let receivedQuantity = item.orderedQuantity;
      
      if (status === 'missing') {
        receivedQuantity = 0;
      } else if (status === 'partial') {
        receivedQuantity = partialQuantities[item.id] || 0;
      }
      
      return {
        ...item,
        status,
        receivedQuantity,
        note: itemNotes[item.id],
      };
    });
    
    onComplete(finalItems, supplierId, orderNumber);
    resetModal();
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setExtractedItems([]);
    setVerificationStatus({});
    setPartialQuantities({});
    setItemNotes({});
    onClose();
  };

  const getVerifiedCount = () => {
    return Object.values(verificationStatus).filter((s) => s !== 'pending').length;
  };

  const getMissingValue = () => {
    return extractedItems.reduce((total, item) => {
      const status = verificationStatus[item.id];
      if (status === 'missing') {
        return total + item.totalPrice;
      } else if (status === 'partial') {
        const received = partialQuantities[item.id] || 0;
        const missing = item.orderedQuantity - received;
        return total + (missing * item.pricePerUnit);
      }
      return total;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Upload Receipt'}
            {step === 'processing' && 'Processing...'}
            {step === 'review' && 'Review Extracted Data'}
            {step === 'verify' && 'Verify Delivery'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200',
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                    file && 'border-success bg-success-muted'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-success mb-4" />
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="font-medium text-foreground mb-1">
                        Drag & drop receipt image
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Supports: JPG, PNG, PDF
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative mb-6">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  Extracting receipt data...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a moment
                </p>
              </motion.div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground"
                    >
                      {MOCK_SUPPLIERS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order Number</Label>
                    <Input
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Extracted Items</Label>
                    <span className="text-sm text-muted-foreground">
                      {extractedItems.length} items
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {extractedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background-secondary border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-success" />
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {item.orderedQuantity} {item.unit} @ €{item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Verify Step */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <p className="text-sm text-muted-foreground">
                  Check off items as you confirm them. Mark any missing or incorrect items.
                </p>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {extractedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Ordered: {item.orderedQuantity} {item.unit} @ €{item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Button
                          size="sm"
                          variant={verificationStatus[item.id] === 'received' ? 'success' : 'outline'}
                          onClick={() => handleItemStatusChange(item.id, 'received')}
                        >
                          <Check size={14} />
                          Received
                        </Button>
                        <Button
                          size="sm"
                          variant={verificationStatus[item.id] === 'missing' ? 'destructive' : 'outline'}
                          onClick={() => handleItemStatusChange(item.id, 'missing')}
                        >
                          <X size={14} />
                          Missing
                        </Button>
                        <Button
                          size="sm"
                          variant={verificationStatus[item.id] === 'partial' ? 'warning' : 'outline'}
                          onClick={() => handleItemStatusChange(item.id, 'partial')}
                        >
                          <AlertCircle size={14} />
                          Partial
                        </Button>
                      </div>

                      {verificationStatus[item.id] === 'partial' && (
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="text-sm whitespace-nowrap">Received:</Label>
                          <Input
                            type="number"
                            min={0}
                            max={item.orderedQuantity}
                            value={partialQuantities[item.id] || ''}
                            onChange={(e) => handlePartialQuantityChange(item.id, Number(e.target.value))}
                            className="w-24"
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                        </div>
                      )}

                      <Input
                        placeholder="Optional note..."
                        value={itemNotes[item.id] || ''}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Items verified:</span>
                    <span className="font-mono font-medium">
                      {getVerifiedCount()} / {extractedItems.length}
                    </span>
                  </div>
                  {getMissingValue() > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-destructive">Missing value:</span>
                      <span className="font-mono font-semibold text-destructive">
                        €{getMissingValue().toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <Button variant="ghost" onClick={step === 'upload' ? resetModal : handleBack}>
            {step === 'upload' ? 'Cancel' : (
              <>
                <ChevronLeft size={16} />
                Back
              </>
            )}
          </Button>
          
          {step === 'upload' && (
            <Button onClick={handleNext} disabled={!file}>
              Next
              <ChevronRight size={16} />
            </Button>
          )}
          
          {step === 'review' && (
            <Button onClick={handleNext}>
              Start Verification
              <ChevronRight size={16} />
            </Button>
          )}
          
          {step === 'verify' && (
            <Button
              onClick={handleComplete}
              disabled={getVerifiedCount() < extractedItems.length}
            >
              Complete & Send to Supplier
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
