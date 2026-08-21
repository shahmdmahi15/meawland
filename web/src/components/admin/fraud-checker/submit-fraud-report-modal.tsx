"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Send,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  FRAUD_REPORT_CATEGORIES,
  type SubmitFraudReportInput,
} from "@/schemas/fraud-checker";
import { submitFraudReportAction } from "@/actions/fraud-checker/report";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubmitFraudReportModalProps {
  initialPhone?: string;
  initialName?: string;
  initialCourier?: string;
  initialParcelId?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitFraudReportModal({
  initialPhone = "",
  initialName = "",
  initialCourier = "Steadfast",
  initialParcelId = "",
  trigger,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: SubmitFraudReportModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [isPending, startTransition] = useTransition();

  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [courier, setCourier] = useState(initialCourier);
  const [parcelId, setParcelId] = useState(initialParcelId);
  const [complain, setComplain] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Sync initial values when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (initialPhone) setPhone(initialPhone);
      if (initialName) setName(initialName);
      if (initialCourier) setCourier(initialCourier);
      if (initialParcelId) setParcelId(initialParcelId);
    }
    setIsOpen(open);
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Customer phone number is required.");
      return;
    }

    if (!name.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    if (!complain.trim() || complain.trim().length < 5) {
      toast.error("Please provide at least 5 characters describing the issue.");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error("Please select at least one fraud category tag.");
      return;
    }

    startTransition(async () => {
      const res = await submitFraudReportAction({
        contact_number: phone.trim(),
        contact_name: name.trim(),
        complain_details: complain.trim(),
        courier_name: courier || undefined,
        parcel_id: parcelId.trim() || undefined,
        categories: selectedCategories,
        is_anonymous: isAnonymous,
      });

      if (res.success) {
        toast.success(res.message || "Fraud report submitted successfully!");
        setComplain("");
        setSelectedCategories([]);
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || "Failed to submit fraud report.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger
          render={
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              <ShieldAlert className="w-4 h-4" />
              Report Fraud
            </Button>
          }
        />
      ) : null}

      <DialogContent className="sm:max-w-[620px] w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border/90 shadow-2xl">
        {/* Header - Fixed */}
        <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 sm:p-5 flex items-start gap-3 shrink-0">
          <div className="p-2 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="pr-6">
            <DialogTitle className="text-base font-bold text-foreground">
              Report Fraudulent Customer to FraudSpy
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Submit this customer&apos;s phone and complaint to the nationwide
              e-commerce fraud registry. Reports protect all Bangladeshi
              merchants.
            </DialogDescription>
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
            {/* Phone and Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Customer Phone *
                </Label>
                <Input
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Customer Name *</Label>
                <Input
                  placeholder="e.g. Rahim Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            {/* Courier and Parcel ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Courier Provider
                </Label>
                <Select value={courier} onValueChange={(val) => val && setCourier(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Courier">
                      {courier === "Steadfast"
                        ? "Steadfast Courier"
                        : courier === "Pathao"
                          ? "Pathao Courier"
                          : courier === "RedX"
                            ? "RedX Logistics"
                            : courier === "Paperfly"
                              ? "Paperfly"
                              : courier === "eCourier"
                                ? "eCourier"
                                : courier === "Sundarban"
                                  ? "Sundarban Courier"
                                  : courier === "Other"
                                    ? "Other Courier"
                                    : courier || "Select Courier"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Steadfast">Steadfast Courier</SelectItem>
                    <SelectItem value="Pathao">Pathao Courier</SelectItem>
                    <SelectItem value="RedX">RedX Logistics</SelectItem>
                    <SelectItem value="Paperfly">Paperfly</SelectItem>
                    <SelectItem value="eCourier">eCourier</SelectItem>
                    <SelectItem value="Sundarban">Sundarban Courier</SelectItem>
                    <SelectItem value="Other">Other Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Parcel / Consignment ID (Optional)
                </Label>
                <Input
                  placeholder="e.g. CN-984210"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>
            </div>

            {/* Categories Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Fraud Reasons / Categories *</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {selectedCategories.length} selected
                </span>
              </Label>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-border/80 bg-muted/20 max-h-36 overflow-y-auto">
                {FRAUD_REPORT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all text-left border cursor-pointer",
                        isSelected
                          ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Complaint Details */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Complaint Details *
              </Label>
              <Textarea
                placeholder="Describe what happened (e.g., Customer ordered COD, refused parcel when delivery agent arrived, phone switched off, didn't return demo item...)"
                value={complain}
                onChange={(e) => setComplain(e.target.value)}
                rows={3}
                className="text-xs resize-none"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Maximum 5000 characters. Please be accurate and objective.
              </p>
            </div>

            {/* Anonymous checkbox */}
            <div className="flex items-center space-x-2 pt-1 pb-2">
              <Checkbox
                id="anonymous-report"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
              />
              <Label
                htmlFor="anonymous-report"
                className="text-xs font-medium cursor-pointer text-muted-foreground"
              >
                Submit anonymously (hide Meawland store name in public
                directory)
              </Label>
            </div>
          </div>

          {/* Pinned Footer Actions */}
          <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 border-t border-border bg-muted/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isPending}
              className="text-xs font-bold gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Report to FraudSpy
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
