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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronDown } from "lucide-react";
import { SubCategory } from "@/generated/prisma/client";
import { Category } from "@/generated/prisma/enums";
import { DeleteSubCategoryButton } from "./delete-sub-category-button";
import { formatCategory } from "@/lib/utils";

// Map category enum to display names
const CATEGORY_DISPLAY_NAMES: Record<Category, string> = {
  PET_ACCESSORIES: "Pet Accessories",
  PET_CARE: "Pet Care",
  PET_FOOD: "Pet Food",
  PET_MEDICINE: "Pet Medicine",
  PET_DRESS: "Pet Dress",
  PET_TOY: "Pet Toy",
  PET_LITTER: "Pet Litter",
};

// Get category badge color
const getCategoryBadgeVariant = (category: Category) => {
  const variants: Record<
    Category,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PET_ACCESSORIES: "default",
    PET_CARE: "secondary",
    PET_FOOD: "destructive",
    PET_MEDICINE: "outline",
    PET_DRESS: "default",
    PET_TOY: "secondary",
    PET_LITTER: "destructive",
  };
  return variants[category];
};

type GroupedSubCategories = Partial<Record<Category, SubCategory[]>>;

export function SubCategoriesTable({
  subCategories,
}: {
  subCategories: SubCategory[];
}) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    new Set(Object.keys(Category) as Category[]),
  );

  // Group sub-categories by category
  const groupedSubCategories = subCategories.reduce<GroupedSubCategories>(
    (acc, subCategory) => {
      if (!acc[subCategory.category]) {
        acc[subCategory.category] = [];
      }
      acc[subCategory.category]!.push(subCategory);
      return acc;
    },
    {},
  );

  // Sort groups by category enum order
  const sortedCategories = (Object.keys(Category) as Category[]).filter(
    (category) => groupedSubCategories[category],
  );

  const normalizedSearch = search.trim().toLowerCase();

  // Filter sub-categories based on search
  const filterSubCategories = (subCats: SubCategory[]) => {
    if (!normalizedSearch) return subCats;
    return subCats.filter(
      (subCat) =>
        subCat.name.toLowerCase().includes(normalizedSearch) ||
        subCat.slug.toLowerCase().includes(normalizedSearch),
    );
  };

  // Count total matching sub-categories
  const totalMatchingSubCategories = sortedCategories.reduce(
    (count, category) => {
      const filtered = filterSubCategories(
        groupedSubCategories[category] || [],
      );
      return count + filtered.length;
    },
    0,
  );

  const toggleCategory = (category: Category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllCategories = (expand: boolean) => {
    if (expand) {
      setExpandedCategories(new Set(sortedCategories));
    } else {
      setExpandedCategories(new Set());
    }
  };

  return (
    <div>
      {/* Search and Filter Header */}
      <div className="border-b p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or slug"
            aria-label="Search sub-categories by name or slug"
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

        {/* Search stats and expand/collapse all buttons */}
        <div className="mt-3 flex items-center justify-between">
          {search && (
            <p className="text-xs text-muted-foreground">
              Showing {totalMatchingSubCategories} of {subCategories.length}{" "}
              sub-categories
            </p>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleAllCategories(true)}
              className="text-xs"
            >
              Expand All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleAllCategories(false)}
              className="text-xs"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-categories by Category */}
      <div className="space-y-1">
        {sortedCategories.length === 0 ? (
          <div className="flex h-32 items-center justify-center border-b">
            <p className="text-sm text-muted-foreground">
              No sub-categories found.
            </p>
          </div>
        ) : (
          sortedCategories.map((category) => {
            const subCats = groupedSubCategories[category] || [];
            const filteredSubCats = filterSubCategories(subCats);
            const isExpanded = expandedCategories.has(category);

            // Skip category if no matching sub-categories
            if (filteredSubCats.length === 0 && search) {
              return null;
            }

            return (
              <Collapsible
                key={category}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category)}
              >
                <div className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-muted/50">
                  <CollapsibleTrigger className="flex w-full items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <Badge variant={getCategoryBadgeVariant(category)}>
                      {CATEGORY_DISPLAY_NAMES[category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {filteredSubCats.length} of {subCats.length}
                    </span>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-12">Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead className="pr-4 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubCats.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-sm text-muted-foreground py-6"
                          >
                            No matching sub-categories in this category.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubCats.map((subCategory) => (
                          <TableRow key={subCategory.id}>
                            <TableCell className="pl-12 font-medium">
                              {subCategory.name}
                            </TableCell>
                            <TableCell>
                              <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                                {subCategory.slug}
                              </code>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatCategory(subCategory.category)}
                              </span>
                            </TableCell>
                            <TableCell className="pr-4">
                              {subCategory.image && (
                                <Image
                                  src={subCategory.image}
                                  alt={subCategory.name}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                            </TableCell>
                            <TableCell className="pr-4 text-right">
                              <DeleteSubCategoryButton
                                subCategoryId={subCategory.id}
                                subCategoryName={subCategory.name}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}
