import { getNavbarAccountAction } from "@/actions/auth/get-navbar-account";
import { AccountSidebar } from "@/components/root/account/account-sidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getNavbarAccountAction();

  return (
    <div className="min-h-screen bg-[#EDF5FA] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 items-start">
          {/* Sidebar */}
          <div className="hidden sm:block shrink-0 bg-[#EDF5FA] rounded-2xl">
            <AccountSidebar user={user} />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm p-6 min-h-105">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
