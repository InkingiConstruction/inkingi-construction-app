export type SupplierRfq = {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  specs?: Record<string, unknown>;
  quantity: string | number;
  unit: string;
  deadline: string;
  status: string;
  project?: { name?: string };
  milestone?: { name?: string };
  quotes?: SupplierQuote[];
  purchaseOrder?: SupplierPurchaseOrder | null;
};

export type SupplierQuote = {
  id: string;
  rfqId: string;
  unitPrice: string | number;
  totalPrice: string | number;
  deliveryDays: number;
  warrantyMonths?: number | null;
  terms?: string | null;
  status: string;
  createdAt: string;
  rfq?: SupplierRfq;
  purchaseOrder?: SupplierPurchaseOrder | null;
};

export type SupplierPurchaseOrder = {
  id: string;
  rfqId: string;
  quoteId: string;
  poNumber: string;
  cloudinaryUrl: string;
  status: string;
  issuedAt: string;
  acceptedAt?: string | null;
  rfq?: SupplierRfq;
  quote?: SupplierQuote;
  deliveries?: SupplierDelivery[];
};

export type SupplierDelivery = {
  id: string;
  purchaseOrderId: string;
  status: string;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  purchaseOrder?: SupplierPurchaseOrder;
};
