import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-react';
import * as mock from '@/data/mockData';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types based on existing Supabase tables
export interface Delivery {
    id: string;
    user_id: string;
    supplier_name: string;
    delivery_date: string;
    order_number: string | null;
    total_value: number;
    missing_value: number;
    status: 'draft' | 'complete' | 'pending_redelivery' | 'resolved';
    created_at: string;
    updated_at: string;
    restaurant_id: string | null;
    supplier_id?: string; // For mock mapping
}

export interface DeliveryItem {
    id: string;
    delivery_id: string;
    name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    total_price: number;
    received_quantity: number | null;
    missing_quantity: number | null;
    status: 'received' | 'missing' | 'pending';
    created_at: string;
}

export interface Product {
    name: string | null;
    price: number | null;
    url: string | null;
    image_url: string | null;
    code: number | null;
    scraped_at: string;
}

export interface SupplierStats {
    totalDeliveries: number;
    pendingDeliveries: number;
    activeDeliveries: number;
    openIssues: number;
    uniqueRestaurants: number;
    totalRevenue: number;
}

// ============ DELIVERIES (Orders from restaurants) ============

/**
 * Fetch all deliveries for the current supplier
 * These are orders placed by restaurants that need to be fulfilled
 */
export function useSupplierDeliveries() {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-deliveries', supplierName],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('*')
                .eq('supplier_name', supplierName)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fallback to mock data if empty
            if (!data || data.length === 0) {
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()));
                if (mockSupplier) {
                    return mock.MOCK_DELIVERIES
                        .filter(d => d.supplierId === mockSupplier.id)
                        .map(d => ({
                            id: d.id,
                            user_id: d.restaurantId,
                            supplier_name: d.supplierName,
                            delivery_date: d.deliveryDate.toISOString(),
                            order_number: d.orderNumber,
                            total_value: d.items.reduce((sum, i) => sum + i.totalPrice, 0),
                            missing_value: d.discrepancyValue,
                            status: d.status === 'verified' ? 'complete' : (d.status === 'discrepancy_reported' ? 'pending_redelivery' : 'draft'),
                            created_at: d.createdAt.toISOString(),
                            updated_at: d.createdAt.toISOString(),
                            restaurant_id: d.restaurantId
                        } as Delivery));
                }
            }

            return data as Delivery[];
        },
    });
}

/**
 * Fetch deliveries with specific statuses (for filtering)
 */
export function useSupplierDeliveriesByStatus(statuses: string[]) {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-deliveries', supplierName, 'status', statuses],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('*')
                .eq('supplier_name', supplierName)
                .in('status', statuses)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Delivery[];
        },
    });
}

/**
 * Fetch a single delivery with its items
 */
export function useSupplierDeliveryWithItems(deliveryId: string | undefined) {
    return useQuery({
        queryKey: ['supplier-delivery', deliveryId],
        queryFn: async () => {
            if (!deliveryId) return null;

            const { data: delivery, error: deliveryError } = await supabase
                .from('deliveries')
                .select('*')
                .eq('id', deliveryId)
                .single();

            if (deliveryError) throw deliveryError;

            const { data: items, error: itemsError } = await supabase
                .from('delivery_items')
                .select('*')
                .eq('delivery_id', deliveryId);

            if (itemsError) throw itemsError;

            return {
                delivery: delivery as Delivery,
                items: items as DeliveryItem[],
            };
        },
        enabled: !!deliveryId,
    });
}

// ============ ISSUES (Deliveries with discrepancies) ============

/**
 * Fetch deliveries with discrepancies (missing_value > 0)
 */
export function useSupplierIssues() {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-issues', supplierName],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('*')
                .eq('supplier_name', supplierName)
                .gt('missing_value', 0)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fallback to mock data if empty
            if (!data || data.length === 0) {
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()));
                if (mockSupplier) {
                    return mock.MOCK_DELIVERIES
                        .filter(d => d.supplierId === mockSupplier.id && d.discrepancyValue > 0)
                        .map(d => ({
                            id: d.id,
                            user_id: d.restaurantId,
                            supplier_name: d.supplierName,
                            delivery_date: d.deliveryDate.toISOString(),
                            order_number: d.orderNumber,
                            total_value: d.items.reduce((sum, i) => sum + i.totalPrice, 0),
                            missing_value: d.discrepancyValue,
                            status: d.status === 'verified' ? 'complete' : (d.status === 'discrepancy_reported' ? 'pending_redelivery' : 'draft'),
                            created_at: d.createdAt.toISOString(),
                            updated_at: d.createdAt.toISOString(),
                            restaurant_id: d.restaurantId
                        } as Delivery));
                }
            }

            return data as Delivery[];
        },
    });
}

/**
 * Fetch open issues (pending_redelivery status)
 */
export function useSupplierOpenIssues() {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-open-issues', supplierName],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('*')
                .eq('supplier_name', supplierName)
                .eq('status', 'pending_redelivery')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fallback to mock data if empty
            if (!data || data.length === 0) {
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()));
                if (mockSupplier) {
                    return mock.MOCK_DELIVERIES
                        .filter(d => d.supplierId === mockSupplier.id && d.status === 'discrepancy_reported')
                        .map(d => ({
                            id: d.id,
                            user_id: d.restaurantId,
                            supplier_name: d.supplierName,
                            delivery_date: d.deliveryDate.toISOString(),
                            order_number: d.orderNumber,
                            total_value: d.items.reduce((sum, i) => sum + i.totalPrice, 0),
                            missing_value: d.discrepancyValue,
                            status: 'pending_redelivery',
                            created_at: d.createdAt.toISOString(),
                            updated_at: d.createdAt.toISOString(),
                            restaurant_id: d.restaurantId
                        } as Delivery));
                }
            }

            return data as Delivery[];
        },
    });
}

// ============ PRODUCTS ============

/**
 * Fetch products from metrotukku_products table
 */
export function useSupplierProducts() {
    return useQuery({
        queryKey: ['supplier-products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metrotukku_products')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data as Product[];
        },
    });
}

// ============ RESTAURANTS (Aggregated from deliveries) ============

export interface ConnectedRestaurant {
    restaurantId: string;
    totalDeliveries: number;
    totalValue: number;
    lastDeliveryDate: string | null;
}

/**
 * Get unique restaurants that have ordered from this supplier
 * Aggregated from deliveries table
 */
export function useSupplierRestaurants() {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-restaurants', supplierName],
        queryFn: async () => {
            let { data, error } = await supabase
                .from('deliveries')
                .select('user_id, total_value, delivery_date')
                .eq('supplier_name', supplierName);

            if (error) throw error;

            // Fallback to mock data if empty
            if (!data || data.length === 0) {
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()));
                if (mockSupplier) {
                    return mock.getRestaurantsForSupplier(mockSupplier.id).map(r => ({
                        restaurantId: r.restaurantId,
                        totalDeliveries: r.totalOrders,
                        totalValue: r.totalRevenue,
                        lastDeliveryDate: r.lastOrderDate ? r.lastOrderDate.toISOString() : null
                    }));
                }
            }

            // Aggregate by user_id (restaurant)
            const restaurantMap = new Map<string, ConnectedRestaurant>();

            (data || []).forEach((delivery) => {
                const existing = restaurantMap.get(delivery.user_id);
                if (existing) {
                    existing.totalDeliveries += 1;
                    existing.totalValue += Number(delivery.total_value) || 0;
                    if (delivery.delivery_date > (existing.lastDeliveryDate || '')) {
                        existing.lastDeliveryDate = delivery.delivery_date;
                    }
                } else {
                    restaurantMap.set(delivery.user_id, {
                        restaurantId: delivery.user_id,
                        totalDeliveries: 1,
                        totalValue: Number(delivery.total_value) || 0,
                        lastDeliveryDate: delivery.delivery_date,
                    });
                }
            });

            return Array.from(restaurantMap.values()).sort(
                (a, b) => b.totalValue - a.totalValue
            );
        },
    });
}

// ============ STATISTICS ============

/**
 * Get supplier dashboard statistics
 */
export function useSupplierStats() {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-stats', supplierName],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('id, user_id, status, total_value, missing_value')
                .eq('supplier_name', supplierName);

            if (error) throw error;

            const deliveries = data || [];

            // Fallback to mock stats if no real deliveries
            if (deliveries.length === 0) {
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()));
                if (mockSupplier) {
                    const mockStats = mock.getSupplierStats(mockSupplier.id);
                    return {
                        totalDeliveries: mockStats.totalOrders,
                        pendingDeliveries: mockStats.pendingOrders,
                        activeDeliveries: mockStats.deliveriesInTransit,
                        openIssues: mockStats.openIssues,
                        uniqueRestaurants: mockStats.connectedRestaurants,
                        totalRevenue: mockStats.totalRevenue,
                    };
                }
            }

            const stats: SupplierStats = {
                totalDeliveries: deliveries.length,
                pendingDeliveries: deliveries.filter((d) => d.status === 'draft').length,
                activeDeliveries: deliveries.filter(
                    (d) => d.status === 'complete' || d.status === 'pending_redelivery'
                ).length,
                openIssues: deliveries.filter((d) => d.status === 'pending_redelivery').length,
                uniqueRestaurants: new Set(deliveries.map((d) => d.user_id)).size,
                totalRevenue: deliveries
                    .filter((d) => d.status === 'complete' || d.status === 'resolved')
                    .reduce((sum, d) => sum + (Number(d.total_value) || 0), 0),
            };

            return stats;
        },
    });
}

// ============ MUTATIONS ============

/**
 * Update delivery status (e.g., resolve an issue)
 */
export function useUpdateDeliveryStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            deliveryId,
            status,
        }: {
            deliveryId: string;
            status: Delivery['status'];
        }) => {
            const { data, error } = await supabase
                .from('deliveries')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', deliveryId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['supplier-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-issues'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-open-issues'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
        },
    });
}

/**
 * Get recent deliveries (for dashboard)
 */
export function useRecentSupplierDeliveries(limit: number = 5) {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-recent-deliveries', supplierName, limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('*')
                .eq('supplier_name', supplierName)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            // Fallback to mock data if empty
            if (!data || data.length === 0) {
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()));
                if (mockSupplier) {
                    return mock.MOCK_DELIVERIES
                        .filter(d => d.supplierId === mockSupplier.id)
                        .slice(0, limit)
                        .map(d => ({
                            id: d.id,
                            user_id: d.restaurantId,
                            supplier_name: d.supplierName,
                            delivery_date: d.deliveryDate.toISOString(),
                            order_number: d.orderNumber,
                            total_value: d.items.reduce((sum, i) => sum + i.totalPrice, 0),
                            missing_value: d.discrepancyValue,
                            status: d.status === 'verified' ? 'complete' : (d.status === 'discrepancy_reported' ? 'pending_redelivery' : 'draft'),
                            created_at: d.createdAt.toISOString(),
                            updated_at: d.createdAt.toISOString(),
                            restaurant_id: d.restaurantId
                        } as Delivery));
                }
            }

            return data as Delivery[];
        },
    });
}

// ============ REAL-TIME SUBSCRIPTIONS ============

export interface RealtimeDeliveryEvent {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    delivery: Delivery;
    timestamp: Date;
}

/**
 * Real-time subscription for incoming discrepancy reports
 * This is CRITICAL for demos - suppliers see reports as they arrive
 */
export function useRealtimeDeliveries(onNewReport?: (event: RealtimeDeliveryEvent) => void) {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<RealtimeDeliveryEvent | null>(null);

    const handleRealtimeChange = useCallback(
        (payload: RealtimePostgresChangesPayload<Delivery>) => {
            const delivery = payload.new as Delivery;

            // Only process if this delivery is for our supplier
            if (delivery?.supplier_name !== supplierName) return;

            const event: RealtimeDeliveryEvent = {
                type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                delivery,
                timestamp: new Date(),
            };

            setLastEvent(event);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['supplier-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-issues'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-open-issues'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-recent-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-restaurants'] });

            // Call the callback if provided
            if (onNewReport) {
                onNewReport(event);
            }
        },
        [supplierName, queryClient, onNewReport]
    );

    useEffect(() => {
        if (!supplierName) return;

        // Create a unique channel name
        const channelName = `supplier-deliveries-${supplierName.replace(/\s+/g, '-').toLowerCase()}`;

        // Subscribe to changes on the deliveries table
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'deliveries',
                },
                handleRealtimeChange
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        channelRef.current = channel;

        // Cleanup on unmount
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
                setIsConnected(false);
            }
        };
    }, [supplierName, handleRealtimeChange]);

    return {
        isConnected,
        lastEvent,
    };
}

/**
 * Hook specifically for tracking new discrepancy reports in real-time
 * Shows a count of unread/new reports since last check
 */
export function useRealtimeDiscrepancyAlerts() {
    const [newReportsCount, setNewReportsCount] = useState(0);
    const [recentReports, setRecentReports] = useState<Delivery[]>([]);

    const handleNewReport = useCallback((event: RealtimeDeliveryEvent) => {
        // Only count as new if it's an issue (has missing value)
        const isMissingValueIssue =
            Number(event.delivery.missing_value || 0) > 0 ||
            event.delivery.status === 'pending_redelivery';

        if (event.type === 'INSERT' && isMissingValueIssue) {
            setNewReportsCount((prev) => prev + 1);
            setRecentReports((prev) => [event.delivery, ...prev].slice(0, 10));
        } else if (event.type === 'UPDATE' && isMissingValueIssue) {
            // An existing delivery was updated to have issues
            setNewReportsCount((prev) => prev + 1);
            setRecentReports((prev) => {
                const filtered = prev.filter((d) => d.id !== event.delivery.id);
                return [event.delivery, ...filtered].slice(0, 10);
            });
        }
    }, []);

    const { isConnected, lastEvent } = useRealtimeDeliveries(handleNewReport);

    const clearAlerts = useCallback(() => {
        setNewReportsCount(0);
    }, []);

    const clearRecentReports = useCallback(() => {
        setRecentReports([]);
        setNewReportsCount(0);
    }, []);

    return {
        isConnected,
        newReportsCount,
        recentReports,
        lastEvent,
        clearAlerts,
        clearRecentReports,
    };
}

// ============ RESTAURANT PROFILES ============

export interface RestaurantProfile {
    id: string;
    name: string;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    street_address: string | null;
    city: string | null;
    postal_code: string | null;
}

export interface ConnectedRestaurantWithProfile extends ConnectedRestaurant {
    profile: RestaurantProfile | null;
    discrepancyRate: number;
    issueCount: number;
}

/**
 * Get restaurants with their profile data and stats
 */
export function useSupplierRestaurantsWithProfiles() {
    const { user } = useUser();
    const supplierName = (user?.publicMetadata?.companyName || user?.unsafeMetadata?.companyName || 'Kespro') as string;

    return useQuery({
        queryKey: ['supplier-restaurants-profiles', supplierName],
        queryFn: async () => {
            // First get all deliveries for this supplier
            const { data: deliveries, error: deliveriesError } = await supabase
                .from('deliveries')
                .select('user_id, total_value, missing_value, delivery_date, status')
                .eq('supplier_name', supplierName);

            if (deliveriesError) throw deliveriesError;

            if (!deliveries || deliveries.length === 0) {
                // Fallback to mock data
                const mockSupplier = mock.MOCK_SUPPLIERS.find(s =>
                    s.name.toLowerCase().includes(supplierName.toLowerCase())
                );
                if (mockSupplier) {
                    return mock.getRestaurantsForSupplier(mockSupplier.id).map(r => ({
                        restaurantId: r.restaurantId,
                        totalDeliveries: r.totalOrders,
                        totalValue: r.totalRevenue,
                        lastDeliveryDate: r.lastOrderDate ? r.lastOrderDate.toISOString() : null,
                        profile: {
                            id: r.restaurantId,
                            name: r.restaurantName,
                            contact_email: `contact@${r.restaurantName.toLowerCase().replace(/\s+/g, '')}.fi`,
                            contact_phone: '+358 40 1234567',
                            address: 'Ravintolakatu 1',
                            city: 'Helsinki',
                            postal_code: '00100',
                        },
                        discrepancyRate: r.discrepancyRate,
                        issueCount: Math.floor(r.totalOrders * r.discrepancyRate / 100),
                    } as ConnectedRestaurantWithProfile));
                }
                return [];
            }

            // Get unique restaurant IDs
            const restaurantIds = [...new Set(deliveries.map(d => d.user_id))];

            // Fetch restaurant profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('restaurants')
                .select('*')
                .in('id', restaurantIds);

            if (profilesError) throw profilesError;

            // Create a map of profiles by ID
            const profileMap = new Map<string, RestaurantProfile>();
            (profiles || []).forEach((p) => profileMap.set(p.id, p));

            // Aggregate delivery data by restaurant
            const restaurantMap = new Map<string, {
                totalDeliveries: number;
                totalValue: number;
                totalMissing: number;
                lastDeliveryDate: string | null;
                issueCount: number;
            }>();

            deliveries.forEach((delivery) => {
                const existing = restaurantMap.get(delivery.user_id);
                const hasIssue = Number(delivery.missing_value) > 0 || delivery.status === 'pending_redelivery';

                if (existing) {
                    existing.totalDeliveries += 1;
                    existing.totalValue += Number(delivery.total_value) || 0;
                    existing.totalMissing += Number(delivery.missing_value) || 0;
                    existing.issueCount += hasIssue ? 1 : 0;
                    if (delivery.delivery_date > (existing.lastDeliveryDate || '')) {
                        existing.lastDeliveryDate = delivery.delivery_date;
                    }
                } else {
                    restaurantMap.set(delivery.user_id, {
                        totalDeliveries: 1,
                        totalValue: Number(delivery.total_value) || 0,
                        totalMissing: Number(delivery.missing_value) || 0,
                        lastDeliveryDate: delivery.delivery_date,
                        issueCount: hasIssue ? 1 : 0,
                    });
                }
            });

            // Build final array with profiles
            const result: ConnectedRestaurantWithProfile[] = [];
            restaurantMap.forEach((data, restaurantId) => {
                const profile = profileMap.get(restaurantId) || null;
                const discrepancyRate = data.totalDeliveries > 0
                    ? (data.issueCount / data.totalDeliveries) * 100
                    : 0;

                result.push({
                    restaurantId,
                    totalDeliveries: data.totalDeliveries,
                    totalValue: data.totalValue,
                    lastDeliveryDate: data.lastDeliveryDate,
                    profile,
                    discrepancyRate,
                    issueCount: data.issueCount,
                });
            });

            // Sort by total value (highest first)
            return result.sort((a, b) => b.totalValue - a.totalValue);
        },
    });
}
