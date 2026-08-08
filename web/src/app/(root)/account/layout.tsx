import { getMeAction } from "@/actions/auth/get-me";
import { AccountSidebar } from "@/components/root/account/account-sidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMeAction();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
          {/* Sidebar */}
          <div className="w-full md:w-auto shrink-0 bg-[#EDF5FA] rounded-2xl">
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
