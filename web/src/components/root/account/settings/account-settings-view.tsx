"use client";

import React from "react";
import { UserProfileDetails } from "@/schemas/root/account/settings";
import { AccountSettingsForm } from "./account-settings-form";
import { SecurityOverviewCard } from "./security-overview-card";
import { UserCog } from "lucide-react";

interface AccountSettingsViewProps {
  profile: UserProfileDetails;
}

export function AccountSettingsView({ profile }: AccountSettingsViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <UserCog className="w-6 h-6 text-[#56C8D8]" />
          <span>Account Settings &amp; Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your personal details, default shipping address, and profile
          photo.
        </p>
      </div>

      {/* Main Grid: Form (8 cols) + Security (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <AccountSettingsForm profile={profile} />
        </div>

        <div className="lg:col-span-4">
          <SecurityOverviewCard profile={profile} />
        </div>
      </div>
    </div>
  );
}
