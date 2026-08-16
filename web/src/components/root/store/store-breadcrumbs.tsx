import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface StoreBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function StoreBreadcrumbs({ items }: StoreBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="container max-w-7xl mx-auto px-4 py-3 text-xs sm:text-sm text-gray-500 flex items-center flex-wrap gap-1.5"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-[#56C8D8] transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-gray-600 hover:text-[#56C8D8] font-medium transition-colors line-clamp-1 max-w-[160px] sm:max-w-[240px]"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-gray-900 font-bold line-clamp-1 max-w-[180px] sm:max-w-[280px]"
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
