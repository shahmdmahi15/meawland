// ────────────────────────────────────────────────────────────────────────────────
// BulkSMSBD API Types & Interfaces
// ────────────────────────────────────────────────────────────────────────────────

export const SMS_ERROR_CODES: Record<string | number, string> = {
  202: "SMS Submitted Successfully",
  1001: "Invalid Number",
  1002: "Sender ID not correct or disabled",
  1003: "All fields are required / Contact system administrator",
  1005: "Internal Error",
  1006: "Balance Validity Not Available",
  1007: "Balance Insufficient",
  1011: "User ID not found",
  1012: "Masking SMS must be sent in Bengali",
  1013: "Sender ID has not found Gateway by API key",
  1014: "Sender Type Name not found using this sender by API key",
  1015: "Sender ID has not found Any Valid Gateway by API key",
  1016: "Sender Type Name Active Price Info not found by this sender ID",
  1017: "Sender Type Name Price Info not found by this sender ID",
  1018: "The Owner of this Account is disabled",
  1019: "The Price of this Account is disabled",
  1020: "The parent of this account is not found",
  1021: "The parent active price of this account is not found",
  1031: "Your Account is Not Verified. Please Contact Administrator",
  1032: "IP Not Whitelisted",
};

export type SingleSmsInput = {
  recipient: string; // e.g. "017XXXXXXXX" or "88017XXXXXXXX"
  message: string;
  senderId?: string;
};

export type BulkSmsInput = {
  recipients: string[]; // List of numbers
  message: string;
  senderId?: string;
};

export type ManySmsMessageItem = {
  to: string; // Phone number
  message: string; // Specific message for this recipient
};

export type ManySmsInput = {
  messages: ManySmsMessageItem[];
  senderId?: string;
};

export type SmsApiResponse = {
  response_code?: number | string;
  status_code?: number | string;
  message?: string;
  success_message?: string;
  error_message?: string;
  [key: string]: unknown;
};

export type SmsBalanceResponse = {
  response_code?: number | string;
  balance?: number | string;
  user_balance?: number | string;
  message?: string;
  error_message?: string;
  [key: string]: unknown;
};

export type OtpSmsInput = {
  phone: string;
  otp: string | number;
  brandName?: string; // Default: "Meawland"
  senderId?: string;
};

export type OrderConfirmationSmsInput = {
  phone: string;
  orderCode: string;
  totalAmount: number | string;
  customerName?: string;
  senderId?: string;
};

export type OrderDispatchedSmsInput = {
  phone: string;
  orderCode: string;
  trackingCode?: string;
  courierName?: string;
  senderId?: string;
};

export type OrderDeliveredSmsInput = {
  phone: string;
  orderCode: string;
  customerName?: string;
  senderId?: string;
};
