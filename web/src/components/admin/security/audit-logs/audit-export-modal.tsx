"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { exportAuditLogsAction } from "@/actions/admin/security/audit-logs/logs";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface AuditExportModalProps {
  trigger?: React.ReactNode;
}

export function AuditExportModal({ trigger }: AuditExportModalProps) {
  const [open, setOpen] = useState(false);
  const [entity, setEntity] = useState<string>("ALL");
  const [action, setAction] = useState<string>("ALL");
  const [severity, setSeverity] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportAuditLogsAction({
        entity: entity !== "ALL" ? (entity as AuditEntity) : undefined,
        action: action !== "ALL" ? (action as AuditAction) : undefined,
        severity: severity !== "ALL" ? (severity as AuditSeverity) : undefined,
      });

      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `meawland_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(res.message || "Audit logs exported successfully!");
        setOpen(false);
      } else {
        toast.error(res.message || "Failed to export audit logs.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold gap-1.5 bg-white border-gray-200 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[550px] w-[min(96vw,550px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-7 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-gray-900">
                Export Forensic Audit Logs (CSV)
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Download structured audit trail records for compliance,
                inventory verification, and security reporting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs">
          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Filter by Entity
            </Label>
            <Select
              value={entity}
              onValueChange={(val) => val && setEntity(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue>
                  {entity === "ALL" ? "All Entities" : entity}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-56 z-50 bg-white">
                <SelectItem value="ALL" className="text-xs">
                  All Entities
                </SelectItem>
                {Object.values(AuditEntity).map((e) => (
                  <SelectItem key={e} value={e} className="text-xs">
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Filter by Action Type
            </Label>
            <Select
              value={action}
              onValueChange={(val) => val && setAction(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue>
                  {action === "ALL" ? "All Actions" : action}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-56 z-50 bg-white">
                <SelectItem value="ALL" className="text-xs">
                  All Actions
                </SelectItem>
                {Object.values(AuditAction).map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Severity
            </Label>
            <Select
              value={severity}
              onValueChange={(val) => val && setSeverity(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue>
                  {severity === "ALL" ? "All Severities" : severity}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                <SelectItem value="ALL" className="text-xs">
                  All Severities
                </SelectItem>
                {Object.values(AuditSeverity).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={handleExport}
            className="text-xs bg-[#0097a7] hover:bg-[#00838f] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
