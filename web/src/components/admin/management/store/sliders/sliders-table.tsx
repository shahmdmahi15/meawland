"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, ExternalLink } from "lucide-react";
import { DeleteSliderButton } from "./delete-slider-button";
import { Slider } from "@/generated/prisma/client";

export function SlidersTable({ sliders }: { sliders: Slider[] }) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  // Filter sliders based on search
  const filteredSliders = sliders.filter((slider) => {
    if (!normalizedSearch) return true;
    return (
      slider.text.toLowerCase().includes(normalizedSearch) ||
      slider.buttonText.toLowerCase().includes(normalizedSearch) ||
      slider.buttonLink.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div>
      {/* Search and Filter Header */}
      <div className="border-b p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by headline or button text"
            aria-label="Search sliders"
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X />
            </Button>
          )}
        </div>

        {/* Search stats */}
        {search && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {filteredSliders.length} of {sliders.length} sliders
            </p>
          </div>
        )}
      </div>

      {/* Sliders Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Banner Image</TableHead>
            <TableHead>Headline / Text</TableHead>
            <TableHead>Button Label</TableHead>
            <TableHead>Destination Link</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSliders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-sm text-muted-foreground py-8"
              >
                No homepage sliders found.
              </TableCell>
            </TableRow>
          ) : (
            filteredSliders.map((slider) => (
              <TableRow key={slider.id}>
                <TableCell className="pl-6">
                  {slider.image && (
                    <Image
                      src={slider.image}
                      alt={slider.text}
                      width={120}
                      height={67.5}
                      className="h-12 w-24 rounded border object-cover"
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {slider.text}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {slider.buttonText}
                  </span>
                </TableCell>
                <TableCell>
                  <a
                    href={slider.buttonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                  >
                    {slider.buttonLink}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <DeleteSliderButton
                    sliderId={slider.id}
                    sliderText={slider.text}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
