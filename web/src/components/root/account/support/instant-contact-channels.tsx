"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface InstantContactChannelsProps {
  userName?: string;
  userEmail?: string;
  selectedOrderCode?: string;
}

export function InstantContactChannels({
  userName,
  userEmail,
  selectedOrderCode,
}: InstantContactChannelsProps) {
  // Meawland Support Hotline & Socials
  const WHATSAPP_NUMBER = "8801886866866"; // Official Meawland WhatsApp Hotline
  const MESSENGER_USERNAME = "meawland.official"; // Official Meawland Messenger
  const SUPPORT_EMAIL = "support@meawland.com";
  const HOTLINE_PHONE = "+8801886866866";

  const waMessage = encodeURIComponent(
    `Hello Meawland Support! 👋\n\nI am ${userName || "a customer"}${userEmail ? ` (${userEmail})` : ""}.${
      selectedOrderCode
        ? ` I am contacting regarding Order #${selectedOrderCode}.`
        : ""
    }\n\nI need assistance with: `,
  );

  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Support Request - ${userName || "Customer"}${selectedOrderCode ? ` (Order #${selectedOrderCode})` : ""}`,
  )}`;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;
  const messengerUrl = `https://m.me/${MESSENGER_USERNAME}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Instant Direct Support Channels</span>
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Need immediate help? Reach our pet care agents directly on WhatsApp or
          Messenger (Avg. response under 5 mins).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WhatsApp Channel Card */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/40 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xs hover:border-emerald-500/40">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live 24/7
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900">WhatsApp Chat</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Chat directly with our dedicated pet support team on WhatsApp.
              </p>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer">
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>

        {/* Facebook Messenger Channel Card */}
        <div className="rounded-3xl border border-blue-500/20 bg-blue-50/40 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xs hover:border-blue-500/40">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Verified Page
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900">Messenger</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Connect via Facebook Messenger for order assistance &amp;
                advice.
              </p>
            </div>
          </div>

          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer">
              <span>Open Messenger</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>

        {/* Hotline Call Channel Card */}
        <div className="rounded-3xl border border-amber-500/20 bg-amber-50/40 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xs hover:border-amber-500/40">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                <Phone className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" />
                10 AM – 10 PM
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900">Hotline Phone</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Speak directly with customer support representative.
              </p>
            </div>
          </div>

          <a href={`tel:${HOTLINE_PHONE}`} className="block">
            <Button
              variant="outline"
              className="w-full h-9 rounded-xl border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{HOTLINE_PHONE}</span>
            </Button>
          </a>
        </div>

        {/* Email Support Card */}
        <div className="rounded-3xl border border-gray-200 bg-gray-50/60 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-800 text-white shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded-full">
                Official
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900">Email Support</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                For detailed business, refund, or warranty inquiries.
              </p>
            </div>
          </div>

          <a href={mailtoUrl} className="block">
            <Button
              variant="outline"
              className="w-full h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{SUPPORT_EMAIL}</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
