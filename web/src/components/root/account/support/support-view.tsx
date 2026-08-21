"use client";

import React from "react";
import {
  SupportTicketSummary,
  UserOrderOption,
} from "@/schemas/root/account/support";
import { InstantContactChannels } from "./instant-contact-channels";
import { CreateTicketDialog } from "./create-ticket-dialog";
import { SupportTicketsHistory } from "./support-tickets-history";
import { Headphones } from "lucide-react";

interface SupportViewProps {
  userName: string;
  userEmail: string;
  userCode?: string;
  userPhone?: string;
  tickets: SupportTicketSummary[];
  orders: UserOrderOption[];
  preselectedOrderCode?: string;
}

export function SupportView({
  userName,
  userEmail,
  userCode,
  userPhone,
  tickets,
  orders,
  preselectedOrderCode,
}: SupportViewProps) {
  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-[#56C8D8]" />
            <span>Help Desk &amp; Customer Care</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            We are here for you and your pets. Reach out via WhatsApp,
            Messenger, or submit a tracked web ticket.
          </p>
        </div>

        <CreateTicketDialog
          orders={orders}
          preselectedOrderCode={preselectedOrderCode}
        />
      </div>

      {/* Instant Direct Contact Channels (WhatsApp, Messenger, Phone, Email) */}
      <InstantContactChannels
        userName={userName}
        userEmail={userEmail}
        selectedOrderCode={preselectedOrderCode}
      />

      {/* Ticket History Listing */}
      <SupportTicketsHistory
        tickets={tickets}
        userName={userName}
        userEmail={userEmail}
        userCode={userCode}
        userPhone={userPhone}
      />
    </div>
  );
}
