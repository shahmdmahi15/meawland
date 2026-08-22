"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Truck,
  History,
  AlertCircle,
} from "lucide-react";
import {
  checkCustomerFraudAction,
  type CheckCustomerFraudResult,
} from "@/actions/fraud-checker/search";
import { SubmitFraudReportModal } from "./submit-fraud-report-modal";
import { cn } from "@/lib/utils";

interface OrderFraudRiskBadgeProps {
  phone: string;
  customerName?: string;
  orderCode?: string;
  parcelId?: string;
  variant?: "badge" | "button" | "card" | "inline";
  className?: string;
}

export function OrderFraudRiskBadge({
  phone,
  customerName = "Customer",
  orderCode = "",
  parcelId = "",
  variant = "badge",
  className,
}: OrderFraudRiskBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<CheckCustomerFraudResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fetchFraudCheck = () => {
    if (!phone) return;
    startTransition(async () => {
      const res = await checkCustomerFraudAction(phone);
      setResult(res);
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !result && !isPending) {
      fetchFraudCheck();
    }
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

  // Badge trigger rendering
  const renderTrigger = () => {
    if (variant === "card") {
      return (
        <button
          type="button"
          className={cn(
            "w-full text-left p-3.5 rounded-xl border cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/30 group block",
            risk?.level === "Critical"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
              : risk?.level === "High"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                : risk?.level === "Medium"
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
                  : result?.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted/30 border-border text-foreground",
            className,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "p-1.5 rounded-lg shrink-0",
                  risk?.level === "Critical"
                    ? "bg-rose-500/20 text-rose-600"
                    : risk?.level === "High"
                      ? "bg-amber-500/20 text-amber-600"
                      : "bg-primary/10 text-primary",
                )}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold flex items-center gap-1.5">
                  FraudSpy Delivery Profile
                  {result?.success && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase py-0.5 px-1.5 rounded border inline-block",
                        risk?.level === "Critical"
                          ? "bg-rose-500 text-white border-rose-500"
                          : risk?.level === "High"
                            ? "bg-amber-500 text-white border-amber-500"
                            : risk?.level === "Medium"
                              ? "bg-yellow-500 text-black border-yellow-500"
                              : "bg-emerald-500 text-white border-emerald-500",
                      )}
                    >
                      {risk?.level} Risk
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {result?.success
                    ? `${successRatio.toFixed(1)}% Delivery Rate • ${delivered} Delivered / ${returned} Returned (${totalParcels} Total)`
                    : "Click to verify courier return history & fraud complaints"}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center justify-center border border-border bg-background px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
              {result ? "View Report" : "Check Fraud"}
            </span>
          </div>
        </button>
      );
    }

    if (variant === "button") {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-1.5 text-xs font-semibold h-8", className)}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-primary" />
          Check Courier Fraud
        </Button>
      );
    }

    if (variant === "inline") {
      return (
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer",
            className,
          )}
        >
          <ShieldAlert className="w-3 h-3 text-primary" />
          <span>Fraud History</span>
        </button>
      );
    }

    // Default badge
    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 border border-border bg-background hover:bg-muted/80 text-[11px] font-semibold rounded-md py-0.5 px-2 transition-all cursor-pointer text-foreground",
          className,
        )}
      >
        <ShieldAlert className="w-3 h-3 text-primary" />
        <span>Check Fraud</span>
      </button>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger render={renderTrigger() as React.ReactElement} />

        <DialogContent className="sm:max-w-[640px] w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
          {/* Header - Fixed */}
          <div className="bg-muted/30 border-b border-border p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="pr-2">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-foreground">
                    FraudSpy Delivery &amp; Risk Intelligence
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Aggregated courier delivery ratio &amp; fraud database for{" "}
                  <strong className="text-foreground font-mono">{phone}</strong>{" "}
                  ({customerName})
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchFraudCheck}
              disabled={isPending}
              className="h-8 px-2 text-xs gap-1 shrink-0"
            >
              <History
                className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
              />
              Refresh
            </Button>
          </div>

          <div className="p-4 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1 min-h-0">
            {isPending && !result ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-medium">
                  Querying integrated couriers &amp; FraudSpy database for{" "}
                  {phone}...
                </p>
              </div>
            ) : !result?.success ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-2.5">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="font-semibold text-sm text-foreground">
                  {result?.message ||
                    "No data could be retrieved for this number."}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Verify the phone format (017XXXXXXXX) or retry querying the
                  FraudSpy service.
                </p>
                <Button
                  size="sm"
                  onClick={fetchFraudCheck}
                  className="mt-2 text-xs"
                >
                  Retry Search
                </Button>
              </div>
            ) : (
              <>
                {/* Risk Verdict Banner */}
                <div
                  className={cn(
                    "p-3.5 rounded-xl border flex items-start gap-3",
                    risk?.color || "bg-muted/30 border-border text-foreground",
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {risk?.level === "Critical" || risk?.level === "High" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs uppercase tracking-wide">
                        Risk Level: {risk?.level}
                      </span>
                      {reportCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] font-bold"
                        >
                          {reportCount} Fraud{" "}
                          {reportCount === 1 ? "Report" : "Reports"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed opacity-95">
                      {risk?.verdict}
                    </p>
                  </div>
                </div>

                {/* Overall Score Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-border/80 bg-card text-center space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Success Ratio
                    </p>
                    <p
                      className={cn(
                        "text-xl font-bold font-mono",
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

                  <div className="p-3 rounded-xl border border-border/80 bg-card text-center space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Total Parcels
                    </p>
                    <p className="text-xl font-bold font-mono text-foreground">
                      {totalParcels}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-card text-center space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Delivered
                    </p>
                    <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {delivered}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-card text-center space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Returned
                    </p>
                    <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                      {returned}
                    </p>
                  </div>
                </div>

                {/* Visual Ratio Progress */}
                <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/10">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Delivery Reliability Index</span>
                    <span className="font-mono">
                      {successRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={successRatio}
                    className="h-2.5 bg-rose-500/20 [&>div]:bg-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span>{delivered} Delivered Successfully</span>
                    <span>{returned} Returned / Cancelled</span>
                  </div>
                </div>

                {/* Couriers Breakdown Grid */}
                {couriers && Object.keys(couriers).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                      Courier-By-Courier Breakdown
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(couriers).map(([courierKey, stat]) => {
                        const courierRatio =
                          stat.total > 0
                            ? Math.round((stat.successful / stat.total) * 100)
                            : 0;

                        return (
                          <div
                            key={courierKey}
                            className="p-3 rounded-xl border border-border bg-card space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs capitalize text-foreground">
                                {courierKey}
                              </span>
                              <Badge
                                variant={
                                  courierRatio >= 80 ? "secondary" : "outline"
                                }
                                className={cn(
                                  "text-[10px] font-mono font-bold",
                                  courierRatio >= 80
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-600 border-rose-500/30",
                                )}
                              >
                                {courierRatio}% Success
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>
                                Total: <strong>{stat.total}</strong>
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Del: <strong>{stat.successful}</strong>
                              </span>
                              <span className="text-rose-600 dark:text-rose-400">
                                Ret: <strong>{stat.returned}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fraud Reports List */}
                {fraudReports &&
                  fraudReports.reports &&
                  fraudReports.reports.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-border">
                      <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4" />
                        Community Fraud Complaints (
                        {fraudReports.reports.length})
                      </h4>

                      <div className="space-y-2">
                        {fraudReports.reports.map((report) => (
                          <div
                            key={report.id}
                            className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-foreground">
                                Reported by {report.reporter || "Merchant"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(
                                  report.reported_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-xs text-foreground/90 font-medium">
                              &ldquo;{report.complain}&rdquo;
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {report.courier && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  Courier: {report.courier}
                                </Badge>
                              )}
                              {report.categories?.map((cat) => (
                                <Badge
                                  key={cat}
                                  variant="secondary"
                                  className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                >
                                  {cat.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Action Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    Powered by FraudSpy Nationwide Intelligence
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        setReportModalOpen(true);
                      }}
                      className="text-xs font-bold gap-1.5 w-full sm:w-auto"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Report Customer as Fraud
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Submit Fraud Report Modal */}
      <SubmitFraudReportModal
        initialPhone={phone}
        initialName={customerName}
        initialParcelId={parcelId || orderCode}
        isOpen={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onSuccess={() => {
          fetchFraudCheck();
        }}
      />
    </>
  );
}
