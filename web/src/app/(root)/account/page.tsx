import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account — Dashboard | Meawland",
  description:
    "Manage your Meawland account — view orders, track shipments, get support, and update your settings.",
  robots: {
    index: false,
    follow: false,
  },
};

// Mock stats — replace with real data when wired up
const stats = {
  pending: { count: 0, percent: 0 },
  processing: { count: 0, percent: 0 },
  completed: { count: 0, percent: 0 },
};

function StatCard({
  title,
  count,
  percent,
  large = false,
}: {
  title: string;
  count: number;
  percent: number;
  large?: boolean;
}) {
  const formattedCount = String(count).padStart(2, "0");
  const formattedPercent = `${percent}%`;

  return (
    <div
      className={`bg-[#dff3f7] rounded-2xl flex items-start justify-between p-5 gap-4 ${
        large ? "row-span-2 flex-col justify-between min-h-50" : ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-gray-700 text-base font-normal">{title}</span>
        <span className="text-gray-900 text-2xl font-bold">
          {formattedCount}
        </span>
      </div>
      <span className="text-[#56C8D8] text-base font-semibold self-start">
        {formattedPercent}
      </span>
    </div>
  );
}

export default function AccountDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left column: Pending + Processing stacked */}
        <div className="flex flex-col gap-4">
          <StatCard
            title="Pending"
            count={stats.pending.count}
            percent={stats.pending.percent}
          />
          <StatCard
            title="Processing"
            count={stats.processing.count}
            percent={stats.processing.percent}
          />
        </div>

        {/* Right column: Completed — tall card spanning both rows */}
        <div className="bg-[#dff3f7] rounded-2xl flex flex-col justify-between p-5 min-h-50">
          <div className="flex flex-col gap-1">
            <span className="text-gray-700 text-base font-normal">
              Completed
            </span>
            <span className="text-gray-900 text-2xl font-bold">
              {String(stats.completed.count).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[#56C8D8] text-base font-semibold self-end">
            {stats.completed.percent}%
          </span>
        </div>
      </div>
    </div>
  );
}
