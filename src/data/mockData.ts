// Mock data for the application

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  accuracyRate: number;
}

export interface DeliveryItem {
  id: string;
  name: string;
  orderedQuantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  receivedQuantity: number | null;
  status: 'pending' | 'received' | 'missing' | 'partial';
  note?: string;
}

export interface Delivery {
  id: string;
  restaurantId: string;
  restaurantName: string;
  supplierId: string;
  supplierName: string;
  orderNumber: string;
  deliveryDate: Date;
  status: 'pending' | 'verified' | 'discrepancy_reported';
  items: DeliveryItem[];
  discrepancyValue: number;
  createdAt: Date;
}

export interface VerificationReport {
  id: string;
  deliveryId: string;
  delivery: Delivery;
  submittedAt: Date;
  discrepancyValue: number;
  supplierStatus: 'pending_review' | 'acknowledged' | 'disputed' | 'resolved';
}

// Sample Suppliers
export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Kespro',
    contactEmail: 'orders@kespro.fi',
    phone: '+358 10 123 4567',
    accuracyRate: 94,
  },
  {
    id: 'sup-2',
    name: 'Metro Tukku',
    contactEmail: 'tilaukset@metro.fi',
    phone: '+358 10 234 5678',
    accuracyRate: 91,
  },
  {
    id: 'sup-3',
    name: 'Heinon Tukku',
    contactEmail: 'info@heinontukku.fi',
    phone: '+358 10 345 6789',
    accuracyRate: 97,
  },
  {
    id: 'sup-4',
    name: 'Valio',
    contactEmail: 'asiakaspalvelu@valio.fi',
    phone: '+358 10 456 7890',
    accuracyRate: 99,
  },
  {
    id: 'sup-5',
    name: 'HKScan',
    contactEmail: 'orders@hkscan.fi',
    phone: '+358 10 567 8901',
    accuracyRate: 95,
  },
];

// Sample Products
export const MOCK_PRODUCTS = [
  { name: 'Naudan jauheliha 20%', unit: 'kg', pricePerUnit: 8.99 },
  { name: 'Broilerin rintafilee', unit: 'kg', pricePerUnit: 13.50 },
  { name: 'Tuore lohi', unit: 'kg', pricePerUnit: 18.00 },
  { name: 'Perunat', unit: 'kg', pricePerUnit: 1.20 },
  { name: 'Sipuli', unit: 'kg', pricePerUnit: 2.50 },
  { name: 'Porkkana', unit: 'kg', pricePerUnit: 1.80 },
  { name: 'Maito 3%', unit: 'l', pricePerUnit: 1.15 },
  { name: 'Voi', unit: 'kg', pricePerUnit: 12.00 },
  { name: 'Kananmunat', unit: 'kpl', pricePerUnit: 0.35 },
  { name: 'Ruisleipä', unit: 'kpl', pricePerUnit: 3.50 },
];

// Sample Deliveries
export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: 'del-1',
    restaurantId: '1',
    restaurantName: 'Ravintola Savotta',
    supplierId: 'sup-1',
    supplierName: 'Kespro',
    orderNumber: 'INV-2024-4521',
    deliveryDate: new Date('2025-01-16'),
    status: 'pending',
    discrepancyValue: 0,
    items: [
      { id: 'item-1', name: 'Naudan jauheliha 20%', orderedQuantity: 10, unit: 'kg', pricePerUnit: 8.99, totalPrice: 89.90, receivedQuantity: null, status: 'pending' },
      { id: 'item-2', name: 'Broilerin rintafilee', orderedQuantity: 5, unit: 'kg', pricePerUnit: 13.50, totalPrice: 67.50, receivedQuantity: null, status: 'pending' },
      { id: 'item-3', name: 'Tuore lohi', orderedQuantity: 3, unit: 'kg', pricePerUnit: 18.00, totalPrice: 54.00, receivedQuantity: null, status: 'pending' },
      { id: 'item-4', name: 'Perunat', orderedQuantity: 20, unit: 'kg', pricePerUnit: 1.20, totalPrice: 24.00, receivedQuantity: null, status: 'pending' },
      { id: 'item-5', name: 'Sipuli', orderedQuantity: 5, unit: 'kg', pricePerUnit: 2.50, totalPrice: 12.50, receivedQuantity: null, status: 'pending' },
    ],
    createdAt: new Date('2025-01-16'),
  },
  {
    id: 'del-2',
    restaurantId: '1',
    restaurantName: 'Ravintola Savotta',
    supplierId: 'sup-2',
    supplierName: 'Metro Tukku',
    orderNumber: 'INV-2024-8834',
    deliveryDate: new Date('2025-01-15'),
    status: 'pending',
    discrepancyValue: 0,
    items: [
      { id: 'item-6', name: 'Maito 3%', orderedQuantity: 50, unit: 'l', pricePerUnit: 1.15, totalPrice: 57.50, receivedQuantity: null, status: 'pending' },
      { id: 'item-7', name: 'Voi', orderedQuantity: 5, unit: 'kg', pricePerUnit: 12.00, totalPrice: 60.00, receivedQuantity: null, status: 'pending' },
      { id: 'item-8', name: 'Kananmunat', orderedQuantity: 120, unit: 'kpl', pricePerUnit: 0.35, totalPrice: 42.00, receivedQuantity: null, status: 'pending' },
    ],
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'del-3',
    restaurantId: '1',
    restaurantName: 'Ravintola Savotta',
    supplierId: 'sup-1',
    supplierName: 'Kespro',
    orderNumber: 'INV-2024-4520',
    deliveryDate: new Date('2025-01-14'),
    status: 'verified',
    discrepancyValue: 54.00,
    items: [
      { id: 'item-9', name: 'Naudan jauheliha 20%', orderedQuantity: 10, unit: 'kg', pricePerUnit: 8.99, totalPrice: 89.90, receivedQuantity: 10, status: 'received' },
      { id: 'item-10', name: 'Broilerin rintafilee', orderedQuantity: 5, unit: 'kg', pricePerUnit: 13.50, totalPrice: 67.50, receivedQuantity: 5, status: 'received' },
      { id: 'item-11', name: 'Tuore lohi', orderedQuantity: 3, unit: 'kg', pricePerUnit: 18.00, totalPrice: 54.00, receivedQuantity: 0, status: 'missing', note: 'Box was not in delivery' },
      { id: 'item-12', name: 'Perunat', orderedQuantity: 20, unit: 'kg', pricePerUnit: 1.20, totalPrice: 24.00, receivedQuantity: 20, status: 'received' },
    ],
    createdAt: new Date('2025-01-14'),
  },
  {
    id: 'del-4',
    restaurantId: '1',
    restaurantName: 'Ravintola Savotta',
    supplierId: 'sup-3',
    supplierName: 'Heinon Tukku',
    orderNumber: 'INV-2024-7721',
    deliveryDate: new Date('2025-01-13'),
    status: 'verified',
    discrepancyValue: 0,
    items: [
      { id: 'item-13', name: 'Porkkana', orderedQuantity: 15, unit: 'kg', pricePerUnit: 1.80, totalPrice: 27.00, receivedQuantity: 15, status: 'received' },
      { id: 'item-14', name: 'Sipuli', orderedQuantity: 10, unit: 'kg', pricePerUnit: 2.50, totalPrice: 25.00, receivedQuantity: 10, status: 'received' },
    ],
    createdAt: new Date('2025-01-13'),
  },
  {
    id: 'del-5',
    restaurantId: '1',
    restaurantName: 'Ravintola Savotta',
    supplierId: 'sup-4',
    supplierName: 'Valio',
    orderNumber: 'INV-2024-9001',
    deliveryDate: new Date('2025-01-12'),
    status: 'discrepancy_reported',
    discrepancyValue: 36.00,
    items: [
      { id: 'item-15', name: 'Maito 3%', orderedQuantity: 100, unit: 'l', pricePerUnit: 1.15, totalPrice: 115.00, receivedQuantity: 100, status: 'received' },
      { id: 'item-16', name: 'Voi', orderedQuantity: 8, unit: 'kg', pricePerUnit: 12.00, totalPrice: 96.00, receivedQuantity: 5, status: 'partial', note: 'Only 5kg delivered, 3kg missing' },
    ],
    createdAt: new Date('2025-01-12'),
  },
];

// Verification Reports for Supplier view
export const MOCK_REPORTS: VerificationReport[] = [
  {
    id: 'rep-1',
    deliveryId: 'del-3',
    delivery: MOCK_DELIVERIES[2],
    submittedAt: new Date('2025-01-14T14:30:00'),
    discrepancyValue: 54.00,
    supplierStatus: 'pending_review',
  },
  {
    id: 'rep-2',
    deliveryId: 'del-5',
    delivery: MOCK_DELIVERIES[4],
    submittedAt: new Date('2025-01-12T16:45:00'),
    discrepancyValue: 36.00,
    supplierStatus: 'acknowledged',
  },
];

// Helper functions
export function getSupplierById(id: string): Supplier | undefined {
  return MOCK_SUPPLIERS.find((s) => s.id === id);
}

export function getDeliveriesForRestaurant(restaurantId: string): Delivery[] {
  return MOCK_DELIVERIES.filter((d) => d.restaurantId === restaurantId);
}

export function getPendingDeliveries(restaurantId: string): Delivery[] {
  return MOCK_DELIVERIES.filter((d) => d.restaurantId === restaurantId && d.status === 'pending');
}

export function getReportsForSupplier(supplierId: string): VerificationReport[] {
  return MOCK_REPORTS.filter((r) => r.delivery.supplierId === supplierId);
}
