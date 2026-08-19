"use client";

import React from "react";
import { UserProfileDetails } from "@/schemas/root/account/settings";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Calendar,
  CheckCircle2,
  KeyRound,
  Fingerprint,
} from "lucide-react";

interface SecurityOverviewCardProps {
  profile: UserProfileDetails;
}

export function SecurityOverviewCard({ profile }: SecurityOverviewCardProps) {
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Account Identity Card */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Fingerprint className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Account Identity</span>
        </h3>

        <div className="rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Customer ID:</span>
            <span className="font-mono text-xs font-black text-gray-900">
              #{profile.code}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Role &amp; Tier:</span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold text-[10px]"
            >
              {profile.role === "ADMIN" || profile.role === "OWNER"
                ? "ADMINISTRATOR"
                : "VERIFIED CUSTOMER"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Member Since:</span>
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#56C8D8]" />
              {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Security & Authentication Card */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Authentication &amp; Login</span>
        </h3>

        <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Primary Email:</span>
            <span className="font-semibold text-gray-900 truncate max-w-[170px]">
              {profile.email}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Google OAuth:</span>
            {profile.hasGoogleLinked ? (
              <Badge
                variant="outline"
                className="border-blue-500/30 text-blue-600 bg-blue-500/10 font-bold text-[10px] gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Linked
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-500 bg-gray-100 font-medium text-[10px]"
              >
                Not Linked
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Passwordless OTP:</span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold text-[10px] gap-1"
            >
              <KeyRound className="w-3 h-3" />
              Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Policy Notice: Why Email is Locked */}
      <div className="rounded-3xl bg-[#EDF5FA]/60 border border-[#D4EEFC] p-4 text-xs text-gray-600 space-y-1.5">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <Lock className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Why is my email locked?</span>
        </div>
        <p className="text-[11px] leading-relaxed text-gray-500">
          Your email address is your primary account identifier and
          authentication key. To update your email address or transfer your
          purchase history, please contact Meawland Support.
        </p>
      </div>
    </div>
  );
}
