import { AlertCircle, Flame, CheckCircle2, Clock, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAllCampaignsAdminAction,
  getCampaignFormDataAction,
} from "@/actions/admin/management/offers/campaigns";
import { CampaignsTable } from "@/components/admin/management/offers/campaigns/campaigns-table";
import { CreateCampaignModal } from "@/components/admin/management/offers/campaigns/create-campaign-modal";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [formDataRes, campaignsRes] = await Promise.all([
    getCampaignFormDataAction(),
    getAllCampaignsAdminAction(),
  ]);

  if (!formDataRes.success || !formDataRes.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">
            Failed to Load Campaign Data
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formDataRes.message ??
              "An unexpected error prevented catalog data from loading."}
          </p>
        </div>
      </div>
    );
  }

  const formData = formDataRes.data;
  const campaigns = campaignsRes.success ? (campaignsRes.campaigns ?? []) : [];
  const metrics = campaignsRes.metrics ?? {
    totalCampaigns: campaigns.length,
    activeCampaigns: 0,
    expiredCampaigns: 0,
    totalRedemptions: 0,
    avgDiscountPercent: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Campaign &amp; Flash Sale Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Launch high-conversion seasonal campaigns, hero banner promotions,
              time-limited discounts, and bundle sales.
            </p>
          </div>
        </div>

        <CreateCampaignModal formData={formData} />
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 min-w-0">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Campaigns
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.totalCampaigns}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flame className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Active Promotions
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {metrics.activeCampaigns}
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
                Avg Promotion Discount
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {metrics.avgDiscountPercent}% OFF
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ended Campaigns
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.expiredCampaigns}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Campaigns Table */}
      <CampaignsTable campaigns={campaigns} formData={formData} />
    </div>
  );
}
