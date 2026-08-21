"use client";

import React, { ReactNode, ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { CustomerOrderSummary } from "@/schemas/root/account/orders";
import { CustomInvoiceModal } from "@/components/invoice/custom-invoice-modal";

interface CustomerOrderInvoiceModalProps {
  order: CustomerOrderSummary;
  trigger?: ReactNode;
}

export function CustomerOrderInvoiceModal({
  order,
  trigger,
}: CustomerOrderInvoiceModalProps) {
  return (
    <CustomInvoiceModal
      orderCode={order.code}
      trigger={
        trigger ? (
          (trigger as ReactElement)
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Invoice</span>
          </Button>
        )
      }
    />
  );
}
