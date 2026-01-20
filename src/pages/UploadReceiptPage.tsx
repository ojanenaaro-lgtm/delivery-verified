import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, Calendar, Building2, FileText, Save } from 'lucide-react';
import { useSession } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { ReceiptUploader } from '@/components/receipt/ReceiptUploader';
import { ScannedItemsTable, ScannedItem } from '@/components/receipt/ScannedItemsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Delivery } from '@/types/delivery';

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
  const { session } = useSession();
  const navigate = useNavigate();
  const { deliveryId } = useParams();

  const [step, setStep] = useState<PageStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingDeliveryId, setExistingDeliveryId] = useState<string | null>(null);

  // Scan result state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [items, setItems] = useState<ScannedItem[]>([]);

  if (!user) return null;

  useEffect(() => {
    const loadDelivery = async () => {
      if (!deliveryId) return;

      try {
        setIsProcessing(true);
        // Fetch delivery
        const { data: delivery, error: deliveryError } = await supabase
          .from('deliveries')
          .select('*')
          .eq('id', deliveryId)
          .single();

        if (deliveryError) throw deliveryError;

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('delivery_items')
          .select('*')
          .eq('delivery_id', deliveryId);

        if (itemsError) throw itemsError;

        // Populate state
        setExistingDeliveryId(delivery.id);
        setSupplierName(delivery.supplier_name);
        setDeliveryDate(delivery.delivery_date);
        setOrderNumber(delivery.order_number || '');

        // Map DB items to ScannedItem type
        const mappedItems: ScannedItem[] = (itemsData || []).map(item => ({
          id: item.id, // Ensure ID is mapped
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
          pricePerUnit: Number(item.price_per_unit),
          totalPrice: Number(item.total_price),
          receivedQuantity: item.received_quantity ? Number(item.received_quantity) : undefined,
          missingQuantity: item.missing_quantity ? Number(item.missing_quantity) : undefined,
          status: item.status as 'pending' | 'received' | 'missing'
        }));

        setItems(mappedItems);
        setStep('verify');

      } catch (err) {
        console.error('Error loading delivery:', err);
        toast.error('Failed to load delivery');
        navigate('/dashboard');
      } finally {
        setIsProcessing(false);
      }
    };

    loadDelivery();
  }, [deliveryId, navigate]);

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
      const extractedSupplierName = data.supplier_name || '';
      const extractedDeliveryDate = data.date || new Date().toISOString().split('T')[0];
      const extractedOrderNumber = data.order_number || `INV-${Date.now()}`;
      const extractedItems = data.items || [];

      setScanResult(data);
      setSupplierName(extractedSupplierName);
      setDeliveryDate(extractedDeliveryDate);
      setOrderNumber(extractedOrderNumber);
      setItems(extractedItems);

      setStep('verify');

      // Auto-save as draft
      try {
        await saveDelivery('draft', {
          supplierName: extractedSupplierName,
          deliveryDate: extractedDeliveryDate,
          orderNumber: extractedOrderNumber,
          items: extractedItems
        });
        toast.success('Receipt scanned and saved as draft');
      } catch (saveErr) {
        console.warn('Auto-save failed:', saveErr);
        toast.info('Receipt scanned successfully (auto-save failed)');
      }
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

  const getMissingValue = () => {
    return items.reduce((total, item) => {
      if (item.status === 'missing' && item.missingQuantity) {
        return total + (item.missingQuantity * item.pricePerUnit);
      }
      return total;
    }, 0);
  };

  const saveDelivery = async (
    targetStatus: 'complete' | 'pending_redelivery' | 'draft',
    overrides?: {
      supplierName?: string;
      deliveryDate?: string;
      orderNumber?: string;
      items?: ScannedItem[];
    }
  ) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      let supabaseHeaders = {};
      try {
        const token = await session?.getToken({ template: 'supabase' });
        if (token) {
          supabaseHeaders = { Authorization: `Bearer ${token}` };
        }
      } catch (e) {
        console.warn('Failed to get Supabase token from Clerk:', e);
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: supabaseHeaders },
      });

      // Use overrides or current state
      const currentItems = overrides?.items || items;
      const currentSupplierName = overrides?.supplierName ?? supplierName;
      const currentDeliveryDate = overrides?.deliveryDate ?? deliveryDate;
      const currentOrderNumber = overrides?.orderNumber ?? orderNumber;

      // Calculate totals
      const totalValue = currentItems.reduce((sum, item) => sum + (item.totalPrice || (item.pricePerUnit * item.quantity)), 0);

      const missingValue = currentItems.reduce((total, item) => {
        if (item.status === 'missing' && item.missingQuantity) {
          return total + (item.missingQuantity * item.pricePerUnit);
        }
        return total;
      }, 0);

      const finalStatus = targetStatus === 'complete' && missingValue > 0 ? 'pending_redelivery' : targetStatus;

      // Prepare Delivery Header
      const deliveryPayload = {
        ...(existingDeliveryId ? { id: existingDeliveryId } : {}),
        restaurant_id: user.id,
        user_id: user.id,
        supplier_name: currentSupplierName,
        delivery_date: currentDeliveryDate,
        order_number: currentOrderNumber,
        total_value: totalValue,
        missing_value: missingValue,
        status: finalStatus,
      };

      // Upsert Delivery
      const { data: deliveryData, error: deliveryError } = await supabaseClient
        .from('deliveries')
        .upsert(deliveryPayload)
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      const newDeliveryId = deliveryData.id;
      setExistingDeliveryId(newDeliveryId);

      // Prepare Delivery Items
      const itemsPayload = currentItems.map(item => ({
        delivery_id: newDeliveryId,
        name: item.name || 'Unknown Item',
        quantity: item.quantity,
        unit: item.unit || 'unit',
        price_per_unit: item.pricePerUnit,
        total_price: item.totalPrice || (item.pricePerUnit * item.quantity),
        received_quantity: item.receivedQuantity ?? item.quantity,
        missing_quantity: item.missingQuantity || 0,
        status: item.status
      }));

      // Delete existing items for this delivery to ensure clean state (sync)
      const { error: deleteError } = await supabaseClient
        .from('delivery_items')
        .delete()
        .eq('delivery_id', newDeliveryId);

      if (deleteError) throw deleteError;

      // Insert Items
      const { error: insertError } = await supabaseClient
        .from('delivery_items')
        .insert(itemsPayload);

      if (insertError) throw insertError;

      return { deliveryId: newDeliveryId, missingValue };
    } catch (err) {
      throw err;
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsProcessing(true);
      await saveDelivery('draft');
      toast.success('Draft saved successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Save draft error:', err);
      toast.error('Failed to save draft');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    // Check if all items are verified
    const unverifiedCount = items.filter((item) => item.status === 'pending').length;
    if (unverifiedCount > 0) {
      toast.error('Please verify all items', {
        description: `${unverifiedCount} item(s) still pending verification`,
      });
      return;
    }

    try {
      setIsProcessing(true);
      const { missingValue } = await saveDelivery('complete');

      console.log('Verification complete:', {
        supplierName,
        deliveryDate,
        orderNumber,
        itemsCount: items.length,
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

    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save verification', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setScanResult(null);
    setItems([]);
    setError(null);
    setExistingDeliveryId(null);
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveDraft}>
                      <Save size={16} className="mr-2" />
                      Save & Continue Later
                    </Button>
                    <Button onClick={handleComplete} size="lg">
                      <CheckCircle size={18} className="mr-2" />
                      Complete Verification
                    </Button>
                  </div>
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

