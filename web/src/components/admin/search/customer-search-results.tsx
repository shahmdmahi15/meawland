"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminCustomerSearchResult } from "@/schemas/admin/search";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface CustomerSearchResultsProps {
  customers: AdminCustomerSearchResult[];
}

export function CustomerSearchResults({
  customers,
}: CustomerSearchResultsProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
        No customers found matching this search.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-[#EDF5FA]/80">
          <TableRow>
            <TableHead className="text-xs font-bold text-gray-700">
              Customer
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Code
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Contact &amp; District
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Orders Placed
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Lifetime Spend
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Role
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id} className="hover:bg-gray-50/70">
              {/* Customer Avatar & Name */}
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[#EDF5FA] border border-[#D4EEFC] flex items-center justify-center shrink-0">
                    {c.avatar ? (
                      <Image
                        src={c.avatar}
                        alt={c.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                        unoptimized={c.avatar.startsWith("data:")}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-[#56C8D8]">
                        {c.name ? c.name[0] : "C"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {c.email}
                    </p>
                  </div>
                </div>
              </TableCell>

              {/* Code */}
              <TableCell className="font-mono text-xs font-bold text-gray-900">
                #{c.code}
              </TableCell>

              {/* Contact & District */}
              <TableCell>
                <p className="text-xs font-mono font-medium text-gray-900">
                  {c.phone || "—"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {c.district || "Not specified"}
                </p>
              </TableCell>

              {/* Orders */}
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-xs font-bold bg-gray-50"
                >
                  {c.totalOrdersCount} orders
                </Badge>
              </TableCell>

              {/* Lifetime Spend */}
              <TableCell>
                <span className="text-xs font-black text-[#56C8D8]">
                  ৳{c.lifetimeSpent.toLocaleString()}
                </span>
              </TableCell>

              {/* Role */}
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {c.role}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Link
                  href={`/admin/support-marketing/support/customers?customerId=${c.id}`}
                  className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                >
                  <span>360 Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
