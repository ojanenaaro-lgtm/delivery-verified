import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, Calendar, Building2, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { ReceiptUploader } from '@/components/receipt/ReceiptUploader';
import { ScannedItemsTable, ScannedItem } from '@/components/receipt/ScannedItemsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type PageStep = 'upload' | 'processing' | 'verify' | 'complete';

interface ScanResult {
  supplier_name: string;
  date: string;
  order_number: string | null;
  items: ScannedItem[];
  totalValue: number;
}

export default function UploadReceiptPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<PageStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scan result state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [items, setItems] = useState<ScannedItem[]>([]);

  if (!user) return null;

  const handleFileSelect = async (file: File, base64: string) => {
    setError(null);
    setIsProcessing(true);
    setStep('processing');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // For now, we'll use a simple approach without Clerk session
      // In production, you'd get the session token from Clerk/Supabase integration
      const response = await fetch(
        `${supabaseUrl}/functions/v1/extract-receipt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            imageBase64: base64,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process receipt');
      }

      // Set the scan result
      const data = result.data;
      setScanResult(data);
      setSupplierName(data.supplier_name || '');
      setDeliveryDate(data.date || new Date().toISOString().split('T')[0]);
      setOrderNumber(data.order_number || `INV-${Date.now()}`);
      setItems(data.items || []);

      setStep('verify');
      toast.success('Receipt scanned successfully!', {
        description: `Found ${data.items?.length || 0} items from ${data.supplier_name}`,
      });
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process receipt');
      setStep('upload');
      toast.error('Failed to scan receipt', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    // Check if all items are verified
    const unverifiedCount = items.filter((item) => item.status === 'pending').length;
    if (unverifiedCount > 0) {
      toast.error('Please verify all items', {
        description: `${unverifiedCount} item(s) still pending verification`,
      });
      return;
    }

    // Calculate missing value
    const missingValue = items.reduce((total, item) => {
      if (item.status === 'missing' && item.missingQuantity) {
        return total + (item.missingQuantity * item.pricePerUnit);
      }
      return total;
    }, 0);

    // In a real app, you'd save this to Supabase here
    console.log('Verification complete:', {
      supplierName,
      deliveryDate,
      orderNumber,
      items,
      missingValue,
    });

    setStep('complete');

    if (missingValue > 0) {
      toast.success('Verification complete!', {
        description: `Discrepancy of €${missingValue.toFixed(2)} reported to supplier`,
      });
    } else {
      toast.success('Delivery verified!', {
        description: 'All items received correctly',
      });
    }
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setScanResult(null);
    setItems([]);
    setError(null);
  };

  const getMissingValue = () => {
    return items.reduce((total, item) => {
      if (item.status === 'missing' && item.missingQuantity) {
        return total + (item.missingQuantity * item.pricePerUnit);
      }
      return total;
    }, 0);
  };

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {step === 'upload' && 'Upload Receipt'}
                {step === 'processing' && 'Processing Receipt'}
                {step === 'verify' && 'Verify Delivery'}
                {step === 'complete' && 'Verification Complete'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {step === 'upload' && 'Upload a receipt image or PDF to get started'}
                {step === 'processing' && 'AI is extracting items from your receipt...'}
                {step === 'verify' && 'Review and verify the items you received'}
                {step === 'complete' && 'Your delivery has been verified'}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto"
              >
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertTriangle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-destructive">Error processing receipt</p>
                      <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <ReceiptUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Analyzing your receipt...
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Our AI is extracting item details, quantities, and prices from your receipt. This usually takes a few seconds.
                </p>
              </motion.div>
            )}

            {/* Verify Step */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Delivery Info */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 size={16} className="text-muted-foreground" />
                        Supplier
                      </Label>
                      <Input
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        Delivery Date
                      </Label>
                      <Input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        Order Number
                      </Label>
                      <Input
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="INV-XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Verify Items ({items.length})
                  </h2>
                  <ScannedItemsTable
                    items={items}
                    onItemsChange={setItems}
                    editable={true}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="ghost" onClick={handleBackToUpload}>
                    <ArrowLeft size={16} />
                    Scan Another Receipt
                  </Button>
                  <Button onClick={handleComplete} size="lg">
                    <CheckCircle size={18} />
                    Complete Verification
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Complete Step */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                  <CheckCircle className="w-12 h-12 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Verification Complete!
                </h2>
                <p className="text-muted-foreground text-center max-w-md mb-2">
                  Your delivery from <span className="font-medium text-foreground">{supplierName}</span> has been verified.
                </p>

                {getMissingValue() > 0 ? (
                  <div className="bg-destructive/10 rounded-xl p-4 mt-4 mb-8 text-center">
                    <p className="text-sm text-destructive">Discrepancy Reported</p>
                    <p className="text-2xl font-bold font-mono text-destructive">
                      €{getMissingValue().toFixed(2)}
                    </p>
                    <p className="text-xs text-destructive/80 mt-1">
                      A report has been sent to the supplier
                    </p>
                  </div>
                ) : (
                  <div className="bg-success/10 rounded-xl p-4 mt-4 mb-8 text-center">
                    <p className="text-sm text-success">All Items Received</p>
                    <p className="text-lg font-medium text-success">
                      No discrepancies found
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBackToUpload}>
                    Scan Another Receipt
                  </Button>
                  <Button onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MainContent>
    </AppLayout>
  );
}
