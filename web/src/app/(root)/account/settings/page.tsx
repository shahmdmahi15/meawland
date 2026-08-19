import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { getUserProfileSettingsAction } from "@/actions/root/account/settings";
import { AccountSettingsView } from "@/components/root/account/settings/account-settings-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account Settings & Profile | Meawland",
  description:
    "Update your personal profile, delivery addresses, contact details, and notification preferences at Meawland.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountSettingsPage() {
  const sessionUser = await getMeAction();
  if (!sessionUser) {
    redirect("/login?callbackUrl=/account/settings");
  }

  const res = await getUserProfileSettingsAction();

  if (!res.success || !res.profile) {
    redirect("/login?callbackUrl=/account/settings");
  }

  return <AccountSettingsView profile={res.profile} />;
}
