import { AlertCircle, Ticket, CheckCircle2, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAllCouponsAdminAction,
  getCouponFormDataAction,
} from "@/actions/admin/management/offers/coupons";
import { CouponsTable } from "@/components/admin/management/offers/coupons/coupons-table";
import { CreateCouponModal } from "@/components/admin/management/offers/coupons/create-coupon-modal";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const [formDataRes, couponsRes] = await Promise.all([
    getCouponFormDataAction(),
    getAllCouponsAdminAction(),
  ]);

  if (!formDataRes.success || !formDataRes.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">Failed to Load Coupon Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formDataRes.message ??
              "An unexpected error prevented catalog data from loading."}
          </p>
        </div>
      </div>
    );
  }

  const formData = formDataRes.data;
  const coupons = couponsRes.success ? (couponsRes.coupons ?? []) : [];
  const metrics = couponsRes.metrics ?? {
    totalCoupons: coupons.length,
    activeCoupons: 0,
    expiredCoupons: 0,
    exhaustedCoupons: 0,
    totalRedemptions: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Coupon &amp; Voucher Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Create discount promo codes, targeted customer rewards, cart
              thresholds, and track live redemption metrics.
            </p>
          </div>
        </div>

        <CreateCouponModal formData={formData} />
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 min-w-0">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Coupons
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.totalCoupons}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Active Vouchers
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {metrics.activeCoupons}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Total Redemptions
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {metrics.totalRedemptions}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Expired / Exhausted
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.expiredCoupons + metrics.exhaustedCoupons}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Coupons Table */}
      <CouponsTable coupons={coupons} formData={formData} />
    </div>
  );
}
