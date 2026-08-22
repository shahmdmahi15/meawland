"use client";

import React from "react";
import Link from "next/link";
import { AdminOfferSearchResult } from "@/schemas/admin/search";
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

interface OfferSearchResultsProps {
  offers: AdminOfferSearchResult[];
}

export function OfferSearchResults({ offers }: OfferSearchResultsProps) {
  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
        No coupons, campaigns, or store entities found.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-[#EDF5FA]/80">
          <TableRow>
            <TableHead className="text-xs font-bold text-gray-700">
              Entity Name
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Code / Identifier
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Type
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Details
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Status
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-50/70">
              {/* Name */}
              <TableCell className="font-bold text-xs text-gray-900">
                {item.name}
              </TableCell>

              {/* Code */}
              <TableCell className="font-mono text-xs font-semibold text-gray-800">
                #{item.code}
              </TableCell>

              {/* Type */}
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {item.type}
                </Badge>
              </TableCell>

              {/* Details */}
              <TableCell className="text-xs text-gray-600">
                {item.details}
              </TableCell>

              {/* Status */}
              <TableCell>
                {item.status ? (
                  <Badge variant="outline" className="text-[10px] bg-gray-50">
                    {item.status}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Link
                  href={item.link}
                  className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Section</span>
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
