"use client";

import React, { ReactNode, ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";
import { AdminOrder } from "@/actions/admin/management/orders/get-orders";
import { CustomInvoiceModal } from "@/components/invoice/custom-invoice-modal";

interface OrderInvoiceModalProps {
  order: AdminOrder;
  trigger?: ReactNode;
}

export function OrderInvoiceModal({ order, trigger }: OrderInvoiceModalProps) {
  return (
    <CustomInvoiceModal
      orderCode={order.code}
      trigger={
        trigger ? (
          (trigger as ReactElement)
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Download / Print Custom Invoice"
            className="cursor-pointer"
          >
            <Printer className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )
      }
    />
  );
}
