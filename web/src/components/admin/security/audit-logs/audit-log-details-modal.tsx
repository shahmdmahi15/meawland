"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  AdminAuditLogSummary,
  AdminAuditLogDetails,
} from "@/actions/admin/security/audit-logs/types";
import { getAuditLogDetailsAction } from "@/actions/admin/security/audit-logs/logs";
import { AuditSeverity } from "@/generated/prisma/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  User,
  Clock,
  Globe,
  FileCode,
  Loader2,
  ArrowRight,
  Sparkles,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLogDetailsModalProps {
  logSummary: AdminAuditLogSummary | null;
  onClose: () => void;
}

export function AuditLogDetailsModal({
  logSummary,
  onClose,
}: AuditLogDetailsModalProps) {
  const [details, setDetails] = useState<AdminAuditLogDetails | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (logSummary?.id) {
      startTransition(async () => {
        const res = await getAuditLogDetailsAction(logSummary.id);
        if (res.success && res.log) {
          setDetails(res.log);
        } else {
          toast.error("Failed to load audit entry details.");
        }
      });
    } else {
      setDetails(null);
    }
  }, [logSummary?.id]);

  if (!logSummary) return null;

  const handleCopyJson = () => {
    if (!details) return;
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    toast.success("Audit log JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case AuditSeverity.CRITICAL:
        return (
          <Badge variant="destructive" className="text-[10px] font-bold">
            CRITICAL
          </Badge>
        );
      case AuditSeverity.SECURITY:
        return (
          <Badge className="bg-purple-600 text-white text-[10px] font-bold">
            SECURITY ALERT
          </Badge>
        );
      case AuditSeverity.WARNING:
        return (
          <Badge className="bg-amber-500 text-white text-[10px] font-bold">
            WARNING
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-bold bg-gray-50">
            INFO
          </Badge>
        );
    }
  };

  return (
    <Dialog open={!!logSummary} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] w-[min(96vw,900px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-8 space-y-5">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-black text-gray-900">
                    Audit Log Inspection #{logSummary.id.slice(-8)}
                  </DialogTitle>
                  {getSeverityBadge(logSummary.severity)}
                </div>
                <DialogDescription className="text-xs text-gray-500">
                  Detailed forensics, user attribution, and state delta comparison.
                </DialogDescription>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyJson}
              className="h-8 text-xs font-semibold gap-1.5 bg-white shadow-xs cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {isPending || !details ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Loading full audit details...</span>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Attribution & Context Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-200">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Action &amp; Entity
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px] font-mono bg-white font-bold text-[#0097a7]">
                    {details.action}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono bg-white">
                    {details.entity}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Actor (User)
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-5 w-5 rounded-full bg-[#56C8D8] text-white flex items-center justify-center text-[10px] font-black">
                    {details.actor?.name ? details.actor.name[0].toUpperCase() : "S"}
                  </div>
                  <span className="font-bold text-gray-900 truncate">
                    {details.actor?.name || "System Automated"}
                  </span>
                </div>
                {details.actor?.email && (
                  <span className="text-[10px] text-gray-500 block truncate">
                    {details.actor.email} ({details.actor.role})
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Network &amp; IP
                </span>
                <p className="font-mono text-gray-800 font-semibold mt-1">
                  {details.ipAddress || "Internal Server"}
                </p>
                {details.path && (
                  <span className="text-[10px] text-gray-500 block truncate font-mono">
                    {details.path}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Timestamp
                </span>
                <p className="text-gray-800 font-semibold mt-1">
                  {new Date(details.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            {/* Summary Narrative */}
            <div className="p-3.5 rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] text-gray-800">
              <span className="text-[10px] font-bold text-[#0097a7] uppercase block mb-0.5">
                Audit Event Summary
              </span>
              <p className="font-bold text-xs text-gray-900">
                {details.summary}
              </p>
              {details.entityName && (
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Target: <strong>{details.entityName}</strong> {details.entityId ? `(#${details.entityId})` : ""}
                </p>
              )}
            </div>

            {/* State Delta / JSON Diff Comparison */}
            {details.hasStateDiff ? (
              <div className="space-y-2">
                <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-primary" /> State Modification Delta (Before &amp; After)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Previous State */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      Previous Value (Before)
                    </span>
                    <pre className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/80 font-mono text-[11px] text-rose-950 overflow-x-auto max-h-60 overflow-y-auto leading-relaxed">
                      {details.previousState
                        ? JSON.stringify(details.previousState, null, 2)
                        : "// No previous state recorded (New entity creation)"}
                    </pre>
                  </div>

                  {/* New State */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Updated Value (After)
                    </span>
                    <pre className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 font-mono text-[11px] text-emerald-950 overflow-x-auto max-h-60 overflow-y-auto leading-relaxed">
                      {details.newState
                        ? JSON.stringify(details.newState, null, 2)
                        : "// Entity deleted"}
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Metadata (if present) */}
            {details.metadata && Object.keys(details.metadata).length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-xs text-gray-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-gray-500" /> Additional Metadata
                </span>
                <pre className="p-3 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-800 overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(details.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer bg-white"
          >
            Close Inspector
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
