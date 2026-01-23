import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, Package, Loader2, Search, MapPin, Mail, Phone, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Delivery } from '@/types/delivery';
import { useAuth } from '@clerk/clerk-react';
import { ConnectButton } from '@/components/connections/ConnectButton';

interface SupplierStats {
  id: string;
  name: string;
  totalDeliveries: number;
  completeDeliveries: number;
  totalValue: number;
  discrepancyValue: number;
  accuracyRate: number;
}

interface SupplierFromDB {
  id: string;
  name: string;
  city: string | null;
  street_address: string | null;
  address: string | null;
  description: string | null;
  category: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupplierFromDB[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch deliveries from Supabase
  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('deliveries')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setDeliveries(data as Delivery[]);
      } catch (err) {
        console.error('Error fetching deliveries:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [userId]);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search suppliers in Supabase
  useEffect(() => {
    const searchSuppliers = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .or(`name.ilike.%${debouncedQuery}%,city.ilike.%${debouncedQuery}%,category.ilike.%${debouncedQuery}%`)
          .limit(20);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching suppliers:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchSuppliers();
  }, [debouncedQuery]);

  // Calculate supplier stats from deliveries
  const suppliers = useMemo((): SupplierStats[] => {
    const supplierMap: Record<string, SupplierStats> = {};

    deliveries.forEach(d => {
      const supplierKey = d.supplier_id || d.supplier_name;
      if (!supplierMap[supplierKey]) {
        supplierMap[supplierKey] = {
          id: d.supplier_id || d.supplier_name,
          name: d.supplier_name,
          totalDeliveries: 0,
          completeDeliveries: 0,
          totalValue: 0,
          discrepancyValue: 0,
          accuracyRate: 0,
        };
      }

      const supplier = supplierMap[supplierKey];
      supplier.totalDeliveries++;
      supplier.totalValue += Number(d.total_value || 0);
      supplier.discrepancyValue += Number(d.missing_value || 0);

      if (d.status === 'complete') {
        supplier.completeDeliveries++;
      }
    });

    // Calculate accuracy rates
    return Object.values(supplierMap).map(supplier => ({
      ...supplier,
      accuracyRate: supplier.totalDeliveries > 0
        ? Math.round((supplier.completeDeliveries / supplier.totalDeliveries) * 100)
        : 0,
    }));
  }, [deliveries]);

  const getAccuracyBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-[#009EE0]/10 text-[#009EE0]">{rate}%</Badge>;
    if (rate >= 85) return <Badge variant="warning">{rate}%</Badge>;
    return <Badge variant="destructive">{rate}%</Badge>;
  };

  const showSearchResults = debouncedQuery.length >= 2;

  if (isLoading) {
    return (
      <AppLayout>
        <MainContent>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#009EE0]" />
          </div>
        </MainContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Supplier Discovery</h1>
            <p className="text-muted-foreground mt-1">
              Find suppliers and view your delivery history
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, city, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {searchQuery && searchQuery.length < 2 && (
              <p className="text-sm text-muted-foreground mt-2">Type at least 2 characters to search all suppliers</p>
            )}
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Search Results {searchResults.length > 0 && `(${searchResults.length})`}
              </h2>

              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((supplier) => (
                    <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-[#009EE0]" />
                              {supplier.name}
                            </h3>
                            {supplier.category && (
                              <Badge variant="secondary" className="mt-1">
                                {supplier.category}
                              </Badge>
                            )}
                            {(supplier.city || supplier.street_address || supplier.address) && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                                <MapPin className="w-3 h-3" />
                                {supplier.street_address || supplier.address}
                                {(supplier.street_address || supplier.address) && supplier.city && ', '}
                                {supplier.city}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {supplier.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {supplier.description}
                          </p>
                        )}

                        {/* Contact Info */}
                        {(supplier.contact_email || supplier.contact_phone) && (
                          <div className="flex flex-col gap-1 mb-4 text-sm text-muted-foreground">
                            {supplier.contact_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {supplier.contact_email}
                              </span>
                            )}
                            {supplier.contact_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {supplier.contact_phone}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Connect Button */}
                        <div className="pt-4 border-t border-border">
                          <ConnectButton
                            entityId={supplier.id}
                            entityType="supplier"
                            entityName={supplier.name}
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No suppliers found for "{debouncedQuery}"</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Your Suppliers Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Suppliers</h2>

            {suppliers.length === 0 ? (
              <div className="bg-muted/10 border border-dashed border-border rounded-xl p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium text-lg">No suppliers yet.</p>
                <p className="text-muted-foreground text-sm mt-2">Upload receipts to see your supplier statistics, or search above to connect with new suppliers.</p>
                <Button
                  onClick={() => navigate('/extract-receipt')}
                  className="bg-[#009EE0] hover:bg-[#009EE0]/90 text-white mt-4"
                >
                  Upload Receipt
                </Button>
              </div>
            ) : (
              /* Suppliers Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                  <Card
                    key={supplier.name}
                    className="hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{supplier.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp size={14} className="text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Accuracy:</span>
                            {getAccuracyBadge(supplier.accuracyRate)}
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-[#009EE0]/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#009EE0]" />
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Deliveries</span>
                          <span className="font-medium text-foreground">{supplier.totalDeliveries}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Value</span>
                          <span className="font-medium text-foreground">{supplier.totalValue.toFixed(2)}</span>
                        </div>
                        {supplier.discrepancyValue > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Discrepancies</span>
                            <span className="font-medium text-destructive">{supplier.discrepancyValue.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-[#009EE0] text-[#009EE0] hover:bg-[#009EE0]/10"
                          onClick={() => navigate(`/deliveries?supplier=${encodeURIComponent(supplier.name)}`)}
                        >
                          View Deliveries
                        </Button>
                        <ConnectButton
                          entityId={supplier.id}
                          entityType="supplier"
                          entityName={supplier.name}
                          size="default"
                          variant="default"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainContent>
    </AppLayout>
  );
}
