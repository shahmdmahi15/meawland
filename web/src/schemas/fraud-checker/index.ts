import { z } from "zod";

// Phone validation helper (013, 014, 015, 016, 017, 018, 019 - 11 digits)
export const bangladeshiPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const fraudSearchInputSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => {
      let cleaned = val.replace(/[\s\-()]/g, "");
      if (cleaned.startsWith("+88")) cleaned = cleaned.slice(3);
      else if (cleaned.startsWith("88")) cleaned = cleaned.slice(2);
      return cleaned;
    })
    .refine((val) => /^01[3-9]\d{8}$/.test(val), {
      message:
        "Please enter a valid 11-digit Bangladeshi phone number (e.g. 017XXXXXXXX)",
    }),
});

export type FraudSearchInput = z.infer<typeof fraudSearchInputSchema>;

export const FRAUD_REPORT_CATEGORIES = [
  {
    value: "product_not_received",
    label: "Product Not Received (প্রোডাক্ট রিসিভ করেনি)",
  },
  {
    value: "product_not_returned",
    label: "Product Not Returned (প্রোডাক্ট ফেরত দেয়নি)",
  },
  {
    value: "fake_address",
    label: "Fake / Incomplete Address (ভুয়া বা অসম্পূর্ণ ঠিকানা)",
  },
  {
    value: "phone_unreachable",
    label: "Phone Switched Off / Unreachable (ফোন বন্ধ / রিসিভ করে না)",
  },
  {
    value: "refused_delivery",
    label: "Refused Delivery at Doorstep (ডেলিভারিম্যান গেলে রিফিউজ করে)",
  },
  {
    value: "partial_payment",
    label: "Partial Payment Dispute (আংশিক পেমেন্ট সমস্যা)",
  },
  { value: "chargeback", label: "Fraudulent Chargeback (চার্জব্যাক ফ্রড)" },
  {
    value: "fake_identity",
    label: "Fake Identity / Impersonation (ভুয়া পরিচয়)",
  },
  {
    value: "repeated_offender",
    label: "Repeated Offender (বারবার রিটার্নকারী)",
  },
  { value: "other", label: "Other Malicious Behavior (অন্যান্য কারণ)" },
] as const;

export type FraudCategoryValue =
  (typeof FRAUD_REPORT_CATEGORIES)[number]["value"];

export const submitFraudReportSchema = z.object({
  contact_number: z
    .string()
    .min(1, "Customer phone number is required")
    .transform((val) => {
      let cleaned = val.replace(/[\s\-()]/g, "");
      if (cleaned.startsWith("+88")) cleaned = cleaned.slice(3);
      else if (cleaned.startsWith("88")) cleaned = cleaned.slice(2);
      return cleaned;
    })
    .refine((val) => /^01[3-9]\d{8}$/.test(val), {
      message: "Please enter a valid 11-digit phone number (e.g. 017XXXXXXXX)",
    }),
  contact_name: z
    .string()
    .min(1, "Customer name is required")
    .max(150, "Name must be less than 150 characters"),
  complain_details: z
    .string()
    .min(5, "Complaint details must be at least 5 characters")
    .max(5000, "Complaint details must not exceed 5000 characters"),
  courier_name: z.string().optional(),
  parcel_id: z.string().optional(),
  categories: z
    .array(z.string())
    .min(1, "Please select at least one fraud category"),
  is_anonymous: z.boolean().default(false),
});

export type SubmitFraudReportInput = z.infer<typeof submitFraudReportSchema>;

export const connectSteadfastSchema = z.object({
  api_key: z.string().min(1, "Steadfast API Key is required"),
  secret_key: z.string().min(1, "Steadfast Secret Key is required"),
});

export type ConnectSteadfastInput = z.infer<typeof connectSteadfastSchema>;

// Types returned from FraudSpy Search API
export type CourierDeliveryStat = {
  ok: boolean;
  total: number;
  successful: number;
  returned: number;
  ms?: number;
  success_ratio?: number;
};

export type FraudReportItem = {
  id: number;
  contact_name: string;
  complain: string;
  categories: string[];
  courier?: string | null;
  parcel_id?: string | null;
  confirmations: number;
  reporter: string;
  reported_at: string;
};

export type FraudRisk = {
  level: "Low" | "Medium" | "High" | "Critical" | string;
  score: number;
};

export type FraudCheckerSearchResult = {
  ok: boolean;
  phone: {
    local: string;
  };
  overall: {
    total: number;
    delivered: number;
    returned: number;
    success_ratio: number;
  };
  couriers: Record<string, CourierDeliveryStat>;
  fraud_reports: {
    count: number;
    risk: FraudRisk;
    reports: FraudReportItem[];
  };
  server_seconds?: number;
};

export type FraudReportSubmitResponse = {
  ok: boolean;
  message?: string;
  report?: {
    id: number;
    contact_number: string;
    contact_name: string;
    complain: string;
    categories: string[];
    courier?: string | null;
    parcel_id?: string | null;
    is_anonymous: boolean;
    created_at: string;
  };
  risk?: FraudRisk;
};

export type SteadfastConnectResponse = {
  ok: boolean;
  message?: string;
  credential?: {
    id: number;
    api_key_masked: string;
    status: string;
    created_at: string;
  };
};
