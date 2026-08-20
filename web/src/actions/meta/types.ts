export type MetaStandardEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Contact"
  | "CustomizeProduct"
  | "Donate"
  | "FindLocation"
  | "Schedule"
  | "StartTrial"
  | "SubmitApplication"
  | "Subscribe";

export interface MetaContentItem {
  id: string; // Product SKU or ID
  quantity?: number;
  item_price?: number;
  title?: string;
  description?: string;
  brand?: string;
  category?: string;
  delivery_category?: "in_store" | "curbside" | "home_delivery";
}

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: MetaContentItem[];
  content_type?: "product" | "product_group";
  order_id?: string;
  predicted_ltv?: number;
  num_items?: number;
  search_string?: string;
  status?: string;
  delivery_category?: string;
  [key: string]: unknown;
}

export interface MetaUserData {
  em?: string[]; // SHA-256 hashed emails
  ph?: string[]; // SHA-256 hashed phones
  fn?: string[]; // SHA-256 hashed first names
  ln?: string[]; // SHA-256 hashed last names
  db?: string[]; // SHA-256 hashed date of birth (YYYYMMDD)
  ge?: string[]; // SHA-256 hashed gender (m or f)
  ct?: string[]; // SHA-256 hashed cities
  st?: string[]; // SHA-256 hashed states/districts
  zp?: string[]; // SHA-256 hashed zip/postal codes
  country?: string[]; // SHA-256 hashed two-letter country codes (e.g. bd)
  external_id?: string[]; // SHA-256 hashed external unique IDs
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string; // _fbp cookie value
  fbc?: string; // _fbc cookie value
  subscription_id?: string;
  lead_id?: string;
  dob?: string[];
}

export interface MetaServerEventPayload {
  event_name: MetaStandardEventName | string;
  event_time: number; // Unix timestamp in seconds
  event_id?: string; // Matching deduplication ID
  event_source_url?: string;
  action_source: "website" | "app" | "physical_store" | "system_generated" | "other";
  user_data: MetaUserData;
  custom_data?: MetaCustomData;
  opt_out?: boolean;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

export interface MetaCapiResponse {
  events_received?: number;
  messages?: string[];
  fbtrace_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface RawClientContext {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  district?: string | null;
  zipCode?: string | null;
  userId?: string | null;
  eventSourceUrl?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}
