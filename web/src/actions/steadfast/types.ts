// ────────────────────────────────────────────────────────────────────────────────
// Steadfast Courier API Types & Interfaces
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastDeliveryStatus =
  | "pending"
  | "delivered_approval_pending"
  | "partial_delivered_approval_pending"
  | "cancelled_approval_pending"
  | "unknown_approval_pending"
  | "delivered"
  | "partial_delivered"
  | "cancelled"
  | "hold"
  | "in_review"
  | "unknown";

export type SteadfastReturnStatus =
  "pending" | "approved" | "processing" | "completed" | "cancelled";

// ────────────────────────────────────────────────────────────────────────────────
// 1. Create Single Order
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastCreateOrderInput = {
  invoice: string; // Unique invoice/order code (alphanumeric, -, _)
  recipient_name: string; // Max 100 chars
  recipient_phone: string; // 11 digits
  recipient_address: string; // Max 250 chars
  cod_amount: number; // In BDT, >= 0
  note?: string | null; // Delivery instructions (optional)
  alternative_phone?: string | null; // 11 digits (optional)
  recipient_email?: string | null; // Email (optional)
  item_description?: string | null; // Item details (optional)
  total_lot?: number | null; // Total lot count (optional)
  delivery_type?: 0 | 1 | null; // 0 = Home Delivery, 1 = Point Delivery / Hub Pick Up (optional)
};

export type SteadfastConsignment = {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: SteadfastDeliveryStatus | string;
  note: string | null;
  created_at: string;
  updatedAt?: string;
  updated_at?: string;
};

export type SteadfastCreateOrderResponse = {
  status: number;
  message: string;
  consignment: SteadfastConsignment;
  errors?: Record<string, string[]>;
};

// ────────────────────────────────────────────────────────────────────────────────
// 2. Bulk Order
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastBulkOrderItem = SteadfastCreateOrderInput;

export type SteadfastBulkOrderResultItem = {
  invoice: string;
  recipient_name: string;
  recipient_address: string;
  recipient_phone: string;
  cod_amount: string | number;
  note: string | null;
  consignment_id: number | null;
  tracking_code: string | null;
  status: "success" | "error" | string;
  error?: string;
};

export type SteadfastBulkOrderResponse = {
  status?: number;
  message?: string;
  data?: SteadfastBulkOrderResultItem[];
};

// ────────────────────────────────────────────────────────────────────────────────
// 3. Delivery Status
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastStatusResponse = {
  status: number;
  delivery_status: SteadfastDeliveryStatus | string;
  message?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// 4. Balance
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastBalanceResponse = {
  status: number;
  current_balance: number;
  message?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// 5. Return Requests
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastCreateReturnRequestInput = {
  consignment_id?: number | string | null;
  invoice?: string | null;
  tracking_code?: string | null;
  reason?: string | null;
};

export type SteadfastReturnRequest = {
  id: number;
  user_id: number;
  consignment_id: number;
  reason: string | null;
  status: SteadfastReturnStatus | string;
  created_at: string;
  updated_at: string;
};

export type SteadfastSingleReturnResponse = {
  status?: number;
  message?: string;
  data?: SteadfastReturnRequest;
} & Partial<SteadfastReturnRequest>;

export type SteadfastReturnRequestsListResponse = {
  status: number;
  data: SteadfastReturnRequest[];
  message?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// 6. Payments
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastPaymentSummary = {
  id: number;
  user_id?: number;
  invoice?: string;
  amount: number | string;
  payment_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SteadfastSinglePaymentConsignment = {
  id: number;
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  cod_amount: number;
  collected_amount?: number;
  delivery_charge?: number;
  cod_charge?: number;
  payable_amount?: number;
  status: string;
};

export type SteadfastSinglePaymentResponse = {
  status: number;
  payment?: SteadfastPaymentSummary;
  consignments?: SteadfastSinglePaymentConsignment[];
  data?: {
    payment: SteadfastPaymentSummary;
    consignments: SteadfastSinglePaymentConsignment[];
  };
  message?: string;
};

export type SteadfastPaymentsListResponse = {
  status: number;
  payments?: SteadfastPaymentSummary[];
  data?: SteadfastPaymentSummary[];
  message?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// 7. Police Stations / Hubs
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastPoliceStation = {
  id: number;
  name: string;
  district?: string;
  division?: string;
  hub_name?: string;
};

export type SteadfastPoliceStationsResponse = {
  status: number;
  data?: SteadfastPoliceStation[];
  police_stations?: SteadfastPoliceStation[];
  message?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// 8. Webhook Payloads
// ────────────────────────────────────────────────────────────────────────────────

export type SteadfastDeliveryStatusWebhookPayload = {
  notification_type: "delivery_status";
  consignment_id: number;
  invoice: string;
  cod_amount?: number;
  status: SteadfastDeliveryStatus | string;
  delivery_charge?: number;
  tracking_message?: string;
  updated_at?: string;
};

export type SteadfastTrackingUpdateWebhookPayload = {
  notification_type: "tracking_update";
  consignment_id: number;
  invoice: string;
  tracking_message: string;
  updated_at?: string;
};

export type SteadfastWebhookPayload =
  SteadfastDeliveryStatusWebhookPayload | SteadfastTrackingUpdateWebhookPayload;
