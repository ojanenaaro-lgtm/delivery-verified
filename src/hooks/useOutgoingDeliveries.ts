import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useUser } from '@clerk/clerk-react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types for outgoing deliveries
export type OutgoingDeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'confirmed' | 'disputed';

export interface OutgoingDelivery {
    id: string;
    supplier_id: string;
    restaurant_id: string;
    original_delivery_id: string | null;
    original_report_id: string | null;
    status: OutgoingDeliveryStatus;
    estimated_delivery_date: string | null;
    actual_delivery_date: string | null;
    notes: string | null;
    total_value: number;
    items_count: number;
    created_at: string;
    updated_at: string;
    last_action_by: string | null;
}

export interface OutgoingDeliveryItem {
    id: string;
    outgoing_delivery_id: string;
    item_name: string;
    quantity: number;
    unit: string | null;
    price_per_unit: number | null;
    total_price: number | null;
    original_item_id: string | null;
    created_at: string;
}

export interface OutgoingDeliveryWithDetails extends OutgoingDelivery {
    items?: OutgoingDeliveryItem[];
    restaurant?: { id: string; name: string; contact_email: string | null; contact_phone: string | null };
    supplier?: { id: string; name: string };
}

export interface CreateOutgoingDeliveryParams {
    restaurantId: string;
    originalDeliveryId?: string;
    originalReportId?: string;
    items: Array<{
        item_name: string;
        quantity: number;
        unit?: string;
        price_per_unit?: number;
        original_item_id?: string;
    }>;
    notes?: string;
    estimatedDeliveryDate?: string;
}

export interface RealtimeOutgoingDeliveryEvent {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    delivery: OutgoingDelivery;
    timestamp: Date;
}

export interface OutgoingDeliveryFilters {
    status?: OutgoingDeliveryStatus | 'all';
    search?: string;
}

/**
 * Hook for supplier outgoing deliveries real-time subscription
 * Provides real-time subscription and event tracking
 */
export function useRealtimeOutgoingDeliveries() {
    const { user } = useUser();
    const supabase = useAuthenticatedSupabase();
    const supplierId = user?.id || '';
    const queryClient = useQueryClient();

    // Real-time state
    const channelRef = useRef<RealtimeChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<RealtimeOutgoingDeliveryEvent | null>(null);

    // Handle real-time changes
    const handleRealtimeChange = useCallback(
        (payload: RealtimePostgresChangesPayload<OutgoingDelivery>) => {
            const delivery = payload.new as OutgoingDelivery;

            // Only process if this delivery is for our supplier
            if (delivery?.supplier_id !== supplierId) return;

            const event: RealtimeOutgoingDeliveryEvent = {
                type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                delivery,
                timestamp: new Date(),
            };

            setLastEvent(event);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['outgoing-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['outgoing-delivery-details'] });
        },
        [supplierId, queryClient]
    );

    // Set up real-time subscription
    useEffect(() => {
        if (!supplierId) return;

        const channelName = `outgoing-deliveries-${supplierId}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'outgoing_deliveries',
                    filter: `supplier_id=eq.${supplierId}`,
                },
                handleRealtimeChange
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
                setIsConnected(false);
            }
        };
    }, [supplierId, supabase, handleRealtimeChange]);

    return {
        supplierId,
        isConnected,
        lastEvent,
    };
}

/**
 * Fetch all outgoing deliveries for the current supplier with optional filtering
 */
export function useSupplierOutgoingDeliveries(filters?: OutgoingDeliveryFilters) {
    const { user } = useUser();
    const supabase = useAuthenticatedSupabase();
    const supplierId = user?.id || '';

    return useQuery({
        queryKey: ['outgoing-deliveries', 'supplier', supplierId, filters],
        queryFn: async (): Promise<OutgoingDeliveryWithDetails[]> => {
            if (!supplierId) {
                return [];
            }

            // Build the query
            let query = supabase
                .from('outgoing_deliveries')
                .select('*')
                .eq('supplier_id', supplierId)
                .order('created_at', { ascending: false });

            // Apply status filter
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            const { data: deliveries, error } = await query;

            if (error) {
                throw error;
            }
            if (!deliveries || deliveries.length === 0) {
                return [];
            }

            // Get unique restaurant IDs
            const restaurantIds = [...new Set(deliveries.map(d => d.restaurant_id))];

            // Fetch restaurant info
            const { data: restaurants, error: restaurantError } = await supabase
                .from('restaurants')
                .select('id, name, contact_email, contact_phone')
                .in('id', restaurantIds);

            if (restaurantError) {
                console.error('Error fetching restaurants:', restaurantError);
            }

            // Create a map for quick lookup
            const restaurantMap = new Map<string, { id: string; name: string; contact_email: string | null; contact_phone: string | null }>();
            (restaurants || []).forEach(r => restaurantMap.set(r.id, r));

            // Combine deliveries with restaurant info
            let result: OutgoingDeliveryWithDetails[] = deliveries.map(delivery => ({
                ...delivery,
                restaurant: restaurantMap.get(delivery.restaurant_id),
            }));

            // Apply search filter (client-side for restaurant name)
            if (filters?.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(delivery =>
                    delivery.restaurant?.name?.toLowerCase().includes(searchLower)
                );
            }

            return result;
        },
        enabled: !!supplierId,
    });
}

/**
 * Fetch all incoming outgoing deliveries for the current restaurant with optional filtering
 */
export function useRestaurantIncomingDeliveries(filters?: OutgoingDeliveryFilters) {
    const { user } = useUser();
    const supabase = useAuthenticatedSupabase();
    const restaurantId = user?.id || '';

    return useQuery({
        queryKey: ['outgoing-deliveries', 'restaurant', restaurantId, filters],
        queryFn: async (): Promise<OutgoingDeliveryWithDetails[]> => {
            if (!restaurantId) {
                return [];
            }

            // Build the query
            let query = supabase
                .from('outgoing_deliveries')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            // Apply status filter
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            const { data: deliveries, error } = await query;

            if (error) {
                throw error;
            }
            if (!deliveries || deliveries.length === 0) {
                return [];
            }

            // Get unique supplier IDs
            const supplierIds = [...new Set(deliveries.map(d => d.supplier_id))];

            // Fetch supplier info
            const { data: suppliers, error: supplierError } = await supabase
                .from('suppliers')
                .select('id, name')
                .in('id', supplierIds);

            if (supplierError) {
                console.error('Error fetching suppliers:', supplierError);
            }

            // Create a map for quick lookup
            const supplierMap = new Map<string, { id: string; name: string }>();
            (suppliers || []).forEach(s => supplierMap.set(s.id, s));

            // Combine deliveries with supplier info
            let result: OutgoingDeliveryWithDetails[] = deliveries.map(delivery => ({
                ...delivery,
                supplier: supplierMap.get(delivery.supplier_id),
            }));

            // Apply search filter (client-side for supplier name)
            if (filters?.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(delivery =>
                    delivery.supplier?.name?.toLowerCase().includes(searchLower)
                );
            }

            return result;
        },
        enabled: !!restaurantId,
    });
}

/**
 * Fetch a single outgoing delivery with full details including items
 */
export function useOutgoingDeliveryDetails(deliveryId: string | undefined) {
    const supabase = useAuthenticatedSupabase();

    return useQuery({
        queryKey: ['outgoing-delivery-details', deliveryId],
        queryFn: async (): Promise<OutgoingDeliveryWithDetails | null> => {
            if (!deliveryId) return null;

            // Fetch the delivery
            const { data: delivery, error: deliveryError } = await supabase
                .from('outgoing_deliveries')
                .select('*')
                .eq('id', deliveryId)
                .single();

            if (deliveryError) throw deliveryError;
            if (!delivery) return null;

            // Fetch the items
            const { data: items, error: itemsError } = await supabase
                .from('outgoing_delivery_items')
                .select('*')
                .eq('outgoing_delivery_id', deliveryId)
                .order('item_name', { ascending: true });

            if (itemsError) {
                console.error('Error fetching delivery items:', itemsError);
            }

            // Fetch restaurant info
            const { data: restaurant, error: restaurantError } = await supabase
                .from('restaurants')
                .select('id, name, contact_email, contact_phone')
                .eq('id', delivery.restaurant_id)
                .single();

            if (restaurantError) {
                console.error('Error fetching restaurant:', restaurantError);
            }

            // Fetch supplier info
            const { data: supplier, error: supplierError } = await supabase
                .from('suppliers')
                .select('id, name')
                .eq('id', delivery.supplier_id)
                .single();

            if (supplierError) {
                console.error('Error fetching supplier:', supplierError);
            }

            return {
                ...delivery,
                items: items || [],
                restaurant: restaurant || undefined,
                supplier: supplier || undefined,
            };
        },
        enabled: !!deliveryId,
    });
}

/**
 * Create a new outgoing delivery with items
 */
export function useCreateOutgoingDelivery() {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const supabase = useAuthenticatedSupabase();

    return useMutation({
        mutationFn: async (params: CreateOutgoingDeliveryParams) => {
            const supplierId = user?.id;
            if (!supplierId) {
                throw new Error('User not authenticated');
            }

            // Calculate totals from items
            const itemsCount = params.items.length;
            const totalValue = params.items.reduce((sum, item) => {
                const itemTotal = item.price_per_unit ? item.price_per_unit * item.quantity : 0;
                return sum + itemTotal;
            }, 0);

            // Create the outgoing delivery
            const { data: delivery, error: deliveryError } = await supabase
                .from('outgoing_deliveries')
                .insert({
                    supplier_id: supplierId,
                    restaurant_id: params.restaurantId,
                    original_delivery_id: params.originalDeliveryId || null,
                    original_report_id: params.originalReportId || null,
                    status: 'pending' as OutgoingDeliveryStatus,
                    estimated_delivery_date: params.estimatedDeliveryDate || null,
                    notes: params.notes || null,
                    total_value: totalValue,
                    items_count: itemsCount,
                    last_action_by: supplierId,
                })
                .select()
                .single();

            if (deliveryError) throw deliveryError;

            // Create the delivery items
            const itemsToInsert = params.items.map(item => ({
                outgoing_delivery_id: delivery.id,
                item_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit || null,
                price_per_unit: item.price_per_unit || null,
                total_price: item.price_per_unit ? item.price_per_unit * item.quantity : null,
                original_item_id: item.original_item_id || null,
            }));

            const { error: itemsError } = await supabase
                .from('outgoing_delivery_items')
                .insert(itemsToInsert);

            if (itemsError) {
                // Attempt to clean up the delivery if items failed
                await supabase
                    .from('outgoing_deliveries')
                    .delete()
                    .eq('id', delivery.id);
                throw itemsError;
            }

            return delivery;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outgoing-deliveries'] });
        },
    });
}

export interface UpdateOutgoingDeliveryStatusParams {
    deliveryId: string;
    status: OutgoingDeliveryStatus;
    notes?: string;
    actualDeliveryDate?: string;
}

/**
 * Update the status of an outgoing delivery
 */
export function useUpdateOutgoingDeliveryStatus() {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const supabase = useAuthenticatedSupabase();

    return useMutation({
        mutationFn: async ({ deliveryId, status, notes, actualDeliveryDate }: UpdateOutgoingDeliveryStatusParams) => {
            const userId = user?.id;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const updateData: Record<string, unknown> = {
                status,
                updated_at: new Date().toISOString(),
                last_action_by: userId,
            };

            // Add notes if provided
            if (notes !== undefined) {
                updateData.notes = notes;
            }

            // Set actual delivery date when status is 'delivered'
            if (status === 'delivered') {
                updateData.actual_delivery_date = actualDeliveryDate || new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('outgoing_deliveries')
                .update(updateData)
                .eq('id', deliveryId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outgoing-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['outgoing-delivery-details'] });
        },
    });
}
