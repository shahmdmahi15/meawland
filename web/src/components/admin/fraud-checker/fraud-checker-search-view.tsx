"use client";

import { useState, useTransition } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  Loader2,
  Truck,
  RotateCcw,
  CheckCircle2,
  Info,
  Clock,
  History,
  TrendingUp,
  Sliders,
  Send,
  Zap,
  Check,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  checkCustomerFraudAction,
  type CheckCustomerFraudResult,
} from "@/actions/fraud-checker/search";
import { connectSteadfastToFraudSpyAction } from "@/actions/fraud-checker/connect";
import { SubmitFraudReportModal } from "./submit-fraud-report-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SAMPLE_SEARCHES = [
  { label: "High Delivery Ratio Sample", phone: "01711223344" },
  { label: "Frequent Return Sample", phone: "01855667788" },
  { label: "Test Inquiry", phone: "01400570011" },
];

export function FraudCheckerSearchView() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<CheckCustomerFraudResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [isConnecting, startConnectTransition] = useTransition();

  const handleSearch = (overridePhone?: string) => {
    const targetPhone = overridePhone || phone;
    if (!targetPhone.trim()) {
      toast.error("Please enter a customer phone number to search.");
      return;
    }

    startTransition(async () => {
      const res = await checkCustomerFraudAction(targetPhone);
      setResult(res);
      if (!res.success) {
        toast.error(
          res.message || "Failed to search customer delivery profile.",
        );
      } else {
        toast.success(`Retrieved courier history for ${targetPhone}`);
      }
    });
  };

  const handleConnectSteadfast = (e: React.FormEvent) => {
    e.preventDefault();
    startConnectTransition(async () => {
      const res = await connectSteadfastToFraudSpyAction();
      if (res.success) {
        toast.success(
          res.message || "Steadfast credentials connected with FraudSpy!",
        );
        setConnectModalOpen(false);
      } else {
        toast.error(res.message || "Failed to connect Steadfast credentials.");
      }
    });
  };

  const risk = result?.riskSummary;
  const overall = result?.data?.overall;
  const couriers = result?.data?.couriers;
  const fraudReports = result?.data?.fraud_reports;

  const successRatio = overall?.success_ratio ?? 0;
  const totalParcels = overall?.total ?? 0;
  const delivered = overall?.delivered ?? 0;
  const returned = overall?.returned ?? 0;
  const reportCount = fraudReports?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              FraudSpy Courier &amp; Return Intelligence
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Check real-time delivery success ratios, return percentages, and
            community fraud complaints across all major Bangladeshi couriers
            (Steadfast, Pathao, RedX, Bahok, Carrybee).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConnectModalOpen(true)}
            className="text-xs gap-1.5 h-9"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Steadfast Sync
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="text-xs font-bold gap-1.5 h-9"
          >
            <ShieldAlert className="w-4 h-4" />
            Report Fraud Customer
          </Button>
        </div>
      </div>

      {/* Search Bar Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Customer Phone Fraud Lookup
          </CardTitle>
          <CardDescription className="text-xs">
            Enter an 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX) to
            query delivery statistics.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row items-center gap-2.5"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter customer phone number (e.g. 01400570011)..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 font-mono text-sm h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || !phone.trim()}
              className="w-full sm:w-auto h-10 px-6 font-bold text-xs gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Querying Couriers...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Check Fraud Risk
                </>
              )}
            </Button>
          </form>

          {/* Sample Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Quick Test Queries:
            </span>
            {SAMPLE_SEARCHES.map((item) => (
              <button
                key={item.phone}
                type="button"
                onClick={() => {
                  setPhone(item.phone);
                  handleSearch(item.phone);
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-all cursor-pointer"
              >
                {item.phone}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Results Display */}
      {result && result.success && result.data && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Main Risk Assessment Card */}
          <Card className="border-border shadow-xs overflow-hidden">
            <div
              className={cn(
                "p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                risk?.level === "Critical"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
                  : risk?.level === "High"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                    : risk?.level === "Medium"
                      ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-300"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-card border border-border shrink-0 shadow-xs">
                  {risk?.level === "Critical" || risk?.level === "High" ? (
                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">
                      Risk Assessment: {risk?.level} Risk
                    </h3>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        risk?.level === "Critical"
                          ? "bg-rose-600 text-white"
                          : risk?.level === "High"
                            ? "bg-amber-600 text-white"
                            : risk?.level === "Medium"
                              ? "bg-yellow-600 text-black"
                              : "bg-emerald-600 text-white",
                      )}
                    >
                      Score: {result.data.fraud_reports?.risk?.score ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-90 mt-0.5">{risk?.verdict}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="text-xs font-bold gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Report Customer
                </Button>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Success Rate
                  </span>
                  <p
                    className={cn(
                      "text-2xl sm:text-3xl font-black font-mono",
                      successRatio >= 85
                        ? "text-emerald-600 dark:text-emerald-400"
                        : successRatio >= 70
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {successRatio.toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Total Delivered
                  </span>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {delivered}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Total Returned
                  </span>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {returned}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Fraud Reports
                  </span>
                  <p
                    className={cn(
                      "text-2xl sm:text-3xl font-black font-mono",
                      reportCount > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {reportCount}
                  </p>
                </div>
              </div>

              {/* Progress Visualizer */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Overall Delivery vs Return Distribution</span>
                  <span className="font-mono text-muted-foreground">
                    {delivered} / {totalParcels} Orders (
                    {successRatio.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={successRatio}
                  className="h-3 bg-rose-500/20 [&>div]:bg-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ {delivered} Successfully Received
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    ✕ {returned} Refused / Cancelled
                  </span>
                </div>
              </div>

              {/* Couriers Detail Cards */}
              {couriers && Object.keys(couriers).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Delivery History by Courier Provider
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {Object.entries(couriers).map(([courierName, stat]) => {
                      const courierRatio =
                        stat.total > 0
                          ? Math.round((stat.successful / stat.total) * 100)
                          : 0;

                      return (
                        <div
                          key={courierName}
                          className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm capitalize text-foreground">
                              {courierName}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-mono font-bold",
                                courierRatio >= 80
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/30",
                              )}
                            >
                              {courierRatio}%
                            </Badge>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Total Consignments:</span>
                              <strong className="font-mono text-foreground">
                                {stat.total}
                              </strong>
                            </div>
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                              <span>Delivered:</span>
                              <strong className="font-mono">
                                {stat.successful}
                              </strong>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                              <span>Returned:</span>
                              <strong className="font-mono">
                                {stat.returned}
                              </strong>
                            </div>
                            {stat.ms !== undefined && (
                              <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                                <span>Courier Latency:</span>
                                <span>{stat.ms}ms</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fraud Reports Section */}
              {fraudReports &&
              fraudReports.reports &&
              fraudReports.reports.length > 0 ? (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Community Fraud &amp; Dispute Reports (
                      {fraudReports.reports.length})
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Reported by merchants nationwide
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {fraudReports.reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground">
                            Merchant Report: &ldquo;{report.contact_name}&rdquo;
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(report.reported_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-foreground/90 bg-card p-3 rounded-lg border border-border/80">
                          {report.complain}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {report.courier && (
                            <Badge variant="outline" className="text-[10px]">
                              Courier: {report.courier}
                            </Badge>
                          )}
                          {report.parcel_id && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono"
                            >
                              Parcel ID: {report.parcel_id}
                            </Badge>
                          )}
                          {report.categories?.map((cat) => (
                            <Badge
                              key={cat}
                              variant="secondary"
                              className="text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            >
                              {cat.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    No merchant fraud complaints or blacklist entries recorded
                    for this phone number in the FraudSpy network.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Fraud Report Modal */}
      <SubmitFraudReportModal
        initialPhone={phone}
        isOpen={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onSuccess={() => {
          if (phone) handleSearch();
        }}
      />

      {/* Connect Steadfast Courier Dialog */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 sm:p-5 flex items-start gap-3 shrink-0">
            <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div className="pr-6">
              <DialogTitle className="text-base font-bold text-foreground">
                Connect Steadfast Courier with FraudSpy
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Link your active Steadfast Courier credentials with FraudSpy to
                synchronize delivery success statistics and automated return
                intelligence.
              </DialogDescription>
            </div>
          </div>

          <form
            onSubmit={handleConnectSteadfast}
            className="p-4 sm:p-6 space-y-4 text-xs"
          >
            <p className="text-xs text-muted-foreground">
              Your server already has active Steadfast API keys configured in
              the environment. Clicking below will establish an authenticated
              connection with FraudSpy.
            </p>

            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Endpoint:</span>
                <span className="font-mono">
                  POST /api/v1/steadfast/connect
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Courier Provider:</span>
                <span>Steadfast Courier Bangladesh</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConnectModalOpen(false)}
                disabled={isConnecting}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isConnecting}
                className="text-xs font-bold gap-1.5"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Connect Credentials Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
