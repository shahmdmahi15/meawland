"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  ChevronDown,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Image as ImageIcon,
  Layers3,
  Download,
  LayoutGrid,
  List,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Printer,
} from "lucide-react";
import { Category } from "@/generated/prisma/enums";
import type { FullProduct } from "@/actions/admin/management/inventory/get-all-products";
import { DeleteProductButton } from "./delete-product-button";
import { ProductDetailModal } from "./product-detail-modal";
import { StockEventsModal } from "./stock-events-modal";
import { EditProductModal } from "./edit-product-modal";
import { ProductStickerModal } from "../stickers/product-sticker-modal";
import { formatCategory, cn } from "@/lib/utils";

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "stock_desc"
  | "stock_asc";

interface AllProductsTableProps {
  products: FullProduct[];
  subCategories: Array<{
    id: string;
    name: string;
    category: string;
    slug: string;
  }>;
  brands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function AllProductsTable({
  products,
  subCategories,
  brands,
}: AllProductsTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlProductId = searchParams.get("productId");
  const urlProductCode = searchParams.get("productCode");
  const urlSearch = searchParams.get("search");

  const [activeModalProductId, setActiveModalProductId] = useState<
    string | null
  >(null);

  // Pure derived URL matched product ID
  const urlMatchedProductId = useMemo(() => {
    if (urlProductId) {
      return products.find((p) => p.id === urlProductId)?.id ?? null;
    }
    if (urlProductCode) {
      return (
        products.find(
          (p) => p.code.toLowerCase() === urlProductCode.toLowerCase(),
        )?.id ?? null
      );
    }
    return null;
  }, [urlProductId, urlProductCode, products]);

  const effectiveActiveProductId = activeModalProductId ?? urlMatchedProductId;

  // State for search and filters
  const [search, setSearch] = useState(() => urlSearch || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for bulk selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  // State for expanded rows (variable products)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRows(next);
  };

  const toggleExpandAll = (expand: boolean) => {
    if (expand) {
      const variableIds = filteredAndSortedProducts
        .filter((p) => p.isVariable)
        .map((p) => p.id);
      setExpandedRows(new Set(variableIds));
    } else {
      setExpandedRows(new Set());
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedSubCategory("ALL");
    setSelectedBrand("ALL");
    setSelectedType("ALL");
    setSelectedStockStatus("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Filtered subcategories based on selected category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === "ALL") return subCategories;
    return subCategories.filter((sc) => sc.category === selectedCategory);
  }, [subCategories, selectedCategory]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Code",
      "SKU",
      "Type",
      "Category",
      "SubCategory",
      "Brand",
      "Regular Price",
      "Sale Price",
      "Stock",
    ];

    const rows = filteredAndSortedProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.code,
      p.sku,
      p.isVariable ? "Variable" : "Simple",
      p.subCategory.category,
      `"${p.subCategory.name.replace(/"/g, '""')}"`,
      p.brand?.name ? `"${p.brand.name.replace(/"/g, '""')}"` : "N/A",
      p.regularPrice ?? "",
      p.salePrice ?? "",
      getProductStock(p),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `products_inventory_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to compute total stock for a product
  const getProductStock = (product: FullProduct): number => {
    if (product.isVariable) {
      return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    }
    return product.stock ?? 0;
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1 text-[10px]">
          <XCircle className="h-3 w-3" /> Out of Stock
        </Badge>
      );
    }
    if (stock <= 5) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Low: {stock}{" "}
          units
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {stock} in stock
      </Badge>
    );
  };

  // Helper to compute display price for a product
  const getDisplayPrice = (product: FullProduct) => {
    if (product.isVariable && product.variants.length > 0) {
      const prices = product.variants
        .map((v) => parseFloat(v.salePrice || v.regularPrice || "0"))
        .filter((p) => !isNaN(p) && p > 0);

      if (prices.length === 0) return "—";

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice === maxPrice) {
        return `৳${minPrice.toLocaleString()}`;
      }
      return `৳${minPrice.toLocaleString()} - ৳${maxPrice.toLocaleString()}`;
    }

    if (product.salePrice) {
      return (
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            ৳{product.salePrice}
          </span>
          {product.regularPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ৳{product.regularPrice}
            </span>
          )}
        </span>
      );
    }

    return product.regularPrice ? `৳${product.regularPrice}` : "—";
  };

  // Filter and Sort logic
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesCode = p.code.toLowerCase().includes(q);
          const matchesSku = p.sku.toLowerCase().includes(q);
          const matchesSlug = p.slug.toLowerCase().includes(q);
          const matchesSubCat = p.subCategory.name.toLowerCase().includes(q);
          const matchesBrand = p.brand?.name.toLowerCase().includes(q) ?? false;
          const matchesVariantSku = p.variants.some((v) =>
            v.sku.toLowerCase().includes(q),
          );

          if (
            !matchesName &&
            !matchesCode &&
            !matchesSku &&
            !matchesSlug &&
            !matchesSubCat &&
            !matchesBrand &&
            !matchesVariantSku
          ) {
            return false;
          }
        }

        // Category filter
        if (
          selectedCategory !== "ALL" &&
          p.subCategory.category !== selectedCategory
        ) {
          return false;
        }

        // SubCategory filter
        if (
          selectedSubCategory !== "ALL" &&
          p.subCategory.id !== selectedSubCategory
        ) {
          return false;
        }

        // Brand filter
        if (selectedBrand !== "ALL" && p.brand?.id !== selectedBrand) {
          return false;
        }

        // Product Type filter
        if (selectedType === "SIMPLE" && p.isVariable) return false;
        if (selectedType === "VARIABLE" && !p.isVariable) return false;

        // Stock status filter
        const stock = getProductStock(p);
        if (selectedStockStatus === "IN_STOCK" && stock <= 5) return false;
        if (selectedStockStatus === "LOW_STOCK" && (stock === 0 || stock > 5))
          return false;
        if (selectedStockStatus === "OUT_OF_STOCK" && stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "price_asc": {
            const pA = a.isVariable
              ? Math.min(
                  ...a.variants.map((v) =>
                    parseFloat(v.salePrice || v.regularPrice || "0"),
                  ),
                )
              : parseFloat(a.salePrice || a.regularPrice || "0");
            const pB = b.isVariable
              ? Math.min(
                  ...b.variants.map((v) =>
                    parseFloat(v.salePrice || v.regularPrice || "0"),
                  ),
                )
              : parseFloat(b.salePrice || b.regularPrice || "0");
            return pA - pB;
          }
          case "price_desc": {
            const pA = a.isVariable
              ? Math.max(
                  ...a.variants.map((v) =>
                    parseFloat(v.salePrice || v.regularPrice || "0"),
                  ),
                )
              : parseFloat(a.salePrice || a.regularPrice || "0");
            const pB = b.isVariable
              ? Math.max(
                  ...b.variants.map((v) =>
                    parseFloat(v.salePrice || v.regularPrice || "0"),
                  ),
                )
              : parseFloat(b.salePrice || b.regularPrice || "0");
            return pB - pA;
          }
          case "stock_desc":
            return getProductStock(b) - getProductStock(a);
          case "stock_asc":
            return getProductStock(a) - getProductStock(b);
          default:
            return 0;
        }
      });
  }, [
    products,
    search,
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    selectedType,
    selectedStockStatus,
    sortBy,
  ]);

  // Pagination calculation
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredAndSortedProducts.slice(
    startIndex,
    startIndex + pageSize,
  );

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const selectedStickersCount = useMemo(() => {
    return selectedProducts.reduce((acc, p) => {
      if (p.isVariable && p.variants && p.variants.length > 0) {
        return acc + p.variants.length;
      }
      return acc + 1;
    }, 0);
  }, [selectedProducts]);

  const isFiltered =
    search !== "" ||
    selectedCategory !== "ALL" ||
    selectedSubCategory !== "ALL" ||
    selectedBrand !== "ALL" ||
    selectedType !== "ALL" ||
    selectedStockStatus !== "ALL" ||
    sortBy !== "newest";

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* Control Bar: Search, View Mode, Export, Quick Links */}
      <div className="p-3 sm:p-4 rounded-xl border bg-card space-y-3 w-full min-w-0 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between min-w-0">
          {/* Search Bar */}
          <div className="relative flex-1 w-full max-w-md min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, code, SKU, brand, slug..."
              aria-label="Search products"
              className="h-9 pl-9 pr-9 text-xs sm:text-sm w-full"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Actions: View Toggle, Export, Modify Stock, Reset */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/20 mr-1">
              <Button
                type="button"
                variant={viewMode === "TABLE" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("TABLE")}
                className="h-7 w-7"
                title="Table view"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "GRID" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("GRID")}
                className="h-7 w-7"
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Modify Stock Link */}
            <Link
              href="/admin/management/inventory/modify-stock"
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium bg-background hover:bg-muted/50 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              Modify Stock
            </Link>

            {/* Export CSV */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>

            {/* Reset Filters */}
            {isFiltered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs gap-1.5 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            )}

            {viewMode === "TABLE" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpandAll(true)}
                  className="h-8 text-xs"
                >
                  Expand All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpandAll(false)}
                  className="h-8 text-xs"
                >
                  Collapse All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t text-xs min-w-0">
          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Category
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val ?? "ALL");
                setSelectedSubCategory("ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.keys(Category).map((catKey) => (
                  <SelectItem key={catKey} value={catKey}>
                    {formatCategory(catKey as Category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SubCategory Filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              SubCategory
            </label>
            <Select
              value={selectedSubCategory}
              onValueChange={(val) => {
                setSelectedSubCategory(val ?? "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All SubCategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All SubCategories</SelectItem>
                {availableSubCategories.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id}>
                    {sc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Brand
            </label>
            <Select
              value={selectedBrand}
              onValueChange={(val) => {
                setSelectedBrand(val ?? "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Type Filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Product Type
            </label>
            <Select
              value={selectedType}
              onValueChange={(val) => {
                setSelectedType(val ?? "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SIMPLE">Simple Product</SelectItem>
                <SelectItem value="VARIABLE">Variable Product</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Stock Status
            </label>
            <Select
              value={selectedStockStatus}
              onValueChange={(val) => {
                setSelectedStockStatus(val ?? "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stock Statuses</SelectItem>
                <SelectItem value="IN_STOCK">In Stock (&gt; 5)</SelectItem>
                <SelectItem value="LOW_STOCK">Low Stock (1 - 5)</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Sort By
            </label>
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortOption)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name (A &rarr; Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z &rarr; A)</SelectItem>
                <SelectItem value="price_asc">
                  Price (Low &rarr; High)
                </SelectItem>
                <SelectItem value="price_desc">
                  Price (High &rarr; Low)
                </SelectItem>
                <SelectItem value="stock_desc">
                  Stock (High &rarr; Low)
                </SelectItem>
                <SelectItem value="stock_asc">
                  Stock (Low &rarr; High)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {totalItems > 0 ? startIndex + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-foreground">
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{" "}
          of <span className="font-semibold text-foreground">{totalItems}</span>{" "}
          products
          {isFiltered && ` (filtered from ${products.length} total)`}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
          <Package className="h-10 w-10 stroke-1 text-muted-foreground/50 mb-2" />
          <p className="font-medium text-sm text-foreground">
            No products found
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Try adjusting your search query or filter criteria.
          </p>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-3 text-xs"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : viewMode === "TABLE" ? (
        /* TABLE VIEW */
        <div className="rounded-xl border bg-card overflow-hidden shadow-xs w-full min-w-0 max-w-full">
          <div className="overflow-x-auto w-full min-w-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
                  <TableHead className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProducts.length > 0 &&
                        paginatedProducts.every((p) =>
                          selectedProductIds.has(p.id),
                        )
                      }
                      onChange={() => {
                        const allSelected =
                          paginatedProducts.length > 0 &&
                          paginatedProducts.every((p) =>
                            selectedProductIds.has(p.id),
                          );
                        setSelectedProductIds((prev) => {
                          const next = new Set(prev);
                          if (allSelected) {
                            paginatedProducts.forEach((p) => next.delete(p.id));
                          } else {
                            paginatedProducts.forEach((p) => next.add(p.id));
                          }
                          return next;
                        });
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer align-middle"
                      title="Select all on this page"
                    />
                  </TableHead>
                  <TableHead className="w-10 text-center"></TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead className="min-w-[220px]">Product Info</TableHead>
                  <TableHead className="min-w-[120px]">SKU</TableHead>
                  <TableHead className="min-w-[160px]">
                    Category / SubCategory
                  </TableHead>
                  <TableHead className="min-w-[120px]">Brand</TableHead>
                  <TableHead className="min-w-[140px]">Price</TableHead>
                  <TableHead className="min-w-[110px]">Stock Status</TableHead>
                  <TableHead className="w-[170px] text-right pr-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.flatMap((product) => {
                  const stock = getProductStock(product);
                  const isExpanded = expandedRows.has(product.id);
                  const isSelected = selectedProductIds.has(product.id);
                  const isHighlighted =
                    product.id === urlProductId ||
                    product.code.toLowerCase() ===
                      urlProductCode?.toLowerCase() ||
                    effectiveActiveProductId === product.id;

                  const mainRow = (
                    <TableRow
                      key={product.id}
                      className={cn(
                        "border-b transition-colors",
                        isSelected
                          ? "bg-primary/5 hover:bg-primary/10"
                          : isHighlighted
                            ? "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary"
                            : "hover:bg-muted/20",
                      )}
                    >
                      {/* Checkbox for Bulk Selection */}
                      <TableCell className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedProductIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(product.id)) next.delete(product.id);
                              else next.add(product.id);
                              return next;
                            });
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer align-middle"
                        />
                      </TableCell>
                      {/* Expand Trigger for Variable Products */}
                      <TableCell className="p-2 text-center">
                        {product.isVariable ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="h-7 w-7 p-0"
                            onClick={() => toggleRowExpansion(product.id)}
                            title={
                              isExpanded
                                ? "Collapse Variants"
                                : "Expand Variants"
                            }
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        ) : (
                          <span className="block h-3.5 w-3.5 mx-auto rounded-full bg-muted/40" />
                        )}
                      </TableCell>

                      {/* Product Image */}
                      <TableCell className="p-2">
                        <div className="relative h-12 w-12 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
                          {product.imageBase64 ? (
                            <Image
                              src={product.imageBase64}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>

                      {/* Product Info */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm line-clamp-1">
                              {product.name}
                            </span>
                            {product.isVariable ? (
                              <Badge
                                variant="default"
                                className="text-[10px] py-0 px-1.5 font-normal"
                              >
                                Variable
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 font-normal"
                              >
                                Simple
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span>
                              Code:{" "}
                              <strong className="text-foreground">
                                {product.code}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">
                              {product.slug}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="py-3">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                          {product.sku}
                        </code>
                      </TableCell>

                      {/* Category & SubCategory */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-[10px] py-0">
                            {formatCategory(product.subCategory.category)}
                          </Badge>
                          <div className="text-xs font-medium text-foreground/80">
                            {product.subCategory.name}
                          </div>
                        </div>
                      </TableCell>

                      {/* Brand */}
                      <TableCell className="py-3">
                        {product.brand ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted/60">
                            {product.brand.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No Brand
                          </span>
                        )}
                      </TableCell>

                      {/* Price */}
                      <TableCell className="py-3 text-xs font-medium">
                        {getDisplayPrice(product)}
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          {getStockBadge(stock)}
                          {product.isVariable && (
                            <div className="text-[10px] text-muted-foreground">
                              {product.variants.length} variant(s)
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ProductStickerModal
                            products={[product]}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Print Barcode Stickers (Thermal)"
                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                              >
                                <Tag className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <ProductDetailModal
                            product={product}
                            isOpen={effectiveActiveProductId === product.id}
                            onOpenChange={(isOpen) => {
                              if (
                                !isOpen &&
                                effectiveActiveProductId === product.id
                              ) {
                                setActiveModalProductId(null);
                                if (urlProductId || urlProductCode) {
                                  router.replace(pathname, { scroll: false });
                                }
                              }
                            }}
                          />
                          <StockEventsModal product={product} />
                          <EditProductModal
                            product={product}
                            subCategories={subCategories}
                            brands={brands}
                          />
                          <DeleteProductButton
                            productId={product.id}
                            productName={product.name}
                            productCode={product.code}
                            variantCount={product.variants.length}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );

                  if (product.isVariable && isExpanded) {
                    const drawerRow = (
                      <TableRow
                        key={`${product.id}-drawer`}
                        className="bg-muted/15 border-b"
                      >
                        <TableCell colSpan={10} className="p-4 pl-14">
                          <div className="rounded-xl border bg-card p-4 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between border-b pb-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Layers3 className="h-4 w-4 text-primary" />{" "}
                                Variant Breakdown ({product.variants.length}{" "}
                                Variants)
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Total Stock across variants:{" "}
                                <strong className="text-foreground">
                                  {stock} units
                                </strong>
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
                                    <TableHead className="w-12">
                                      Thumb
                                    </TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Attributes</TableHead>
                                    <TableHead>Cost Price</TableHead>
                                    <TableHead>Regular Price</TableHead>
                                    <TableHead>Sale Price</TableHead>
                                    <TableHead className="text-right">
                                      Stock
                                    </TableHead>
                                    <TableHead className="w-16 text-right pr-2">
                                      Sticker
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.variants.map((variant) => (
                                    <TableRow
                                      key={variant.id}
                                      className="text-xs hover:bg-muted/30"
                                    >
                                      <TableCell className="p-2">
                                        <div className="relative h-8 w-8 rounded-md border bg-muted/40 overflow-hidden flex items-center justify-center">
                                          {variant.imageBase64 ? (
                                            <Image
                                              src={variant.imageBase64}
                                              alt={variant.sku}
                                              fill
                                              className="object-cover"
                                            />
                                          ) : (
                                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-mono text-xs font-medium">
                                        {variant.sku}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {variant.attributes.length > 0 ? (
                                            variant.attributes.map((attr) => {
                                              const typeStr = attr.type
                                                ? `${attr.type.charAt(0).toUpperCase() + attr.type.slice(1).toLowerCase()}: `
                                                : "";
                                              return (
                                                <Badge
                                                  key={attr.id}
                                                  variant="outline"
                                                  className="text-[10px] py-0 px-1.5"
                                                >
                                                  {typeStr}
                                                  {attr.name}
                                                </Badge>
                                              );
                                            })
                                          ) : (
                                            <span className="text-muted-foreground italic text-[11px]">
                                              No attributes
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        ৳{variant.costPrice}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        ৳{variant.regularPrice}
                                      </TableCell>
                                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        ৳{variant.salePrice}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {getStockBadge(variant.stock)}
                                      </TableCell>
                                      <TableCell className="text-right pr-2">
                                        <ProductStickerModal
                                          products={[
                                            {
                                              ...product,
                                              isVariable: false,
                                              sku: variant.sku,
                                              regularPrice:
                                                variant.regularPrice,
                                              salePrice: variant.salePrice,
                                              variants: [variant],
                                            },
                                          ]}
                                          title={`Print Barcode: ${product.name} (${variant.sku})`}
                                          trigger={
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon-xs"
                                              title={`Print Barcode (${variant.sku})`}
                                              className="h-6 w-6 cursor-pointer text-muted-foreground hover:text-foreground"
                                            >
                                              <Tag className="w-3.5 h-3.5" />
                                            </Button>
                                          }
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    return [mainRow, drawerRow];
                  }

                  return [mainRow];
                })}
              </TableBody>
            </Table>
          </div>

          {/* Footer Pagination Bar */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-muted/20 text-xs">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue placeholder={String(pageSize)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground mr-2">
                  Page{" "}
                  <strong className="text-foreground">{currentPage}</strong> of{" "}
                  <strong className="text-foreground">{totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProducts.map((product) => {
              const stock = getProductStock(product);

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div>
                    {/* Image & Stock Badge Overlay */}
                    <div className="relative h-44 w-full overflow-hidden rounded-lg border bg-muted/20 flex items-center justify-center">
                      {product.imageBase64 ? (
                        <Image
                          src={product.imageBase64}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground/40" />
                      )}

                      <div className="absolute top-2 left-2">
                        <Badge
                          variant={product.isVariable ? "default" : "secondary"}
                          className="text-[10px] font-mono uppercase shadow-xs"
                        >
                          {product.isVariable ? "Variable" : "Simple"}
                        </Badge>
                      </div>

                      <div className="absolute top-2 right-2">
                        {getStockBadge(stock)}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="mt-3.5 space-y-1.5">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>Code: {product.code}</span>
                        <span>SKU: {product.sku}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {formatCategory(product.subCategory.category)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {product.subCategory.name}
                        </span>
                        {product.brand && (
                          <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-foreground/80">
                            {product.brand.name}
                          </span>
                        )}
                      </div>

                      {/* Variant chips preview */}
                      {product.isVariable && product.variants.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-muted-foreground block mb-1">
                            {product.variants.length} Variants:
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                            {product.variants.map((v) => (
                              <span
                                key={v.id}
                                className="rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono"
                              >
                                {v.sku} ({v.stock})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Price
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {getDisplayPrice(product)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <ProductStickerModal
                        products={[product]}
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            title="Print Barcode Stickers (Thermal)"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </Button>
                        }
                      />
                      <ProductDetailModal product={product} />
                      <StockEventsModal product={product} />
                      <EditProductModal
                        product={product}
                        subCategories={subCategories}
                        brands={brands}
                      />
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                        productCode={product.code}
                        variantCount={product.variants.length}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid View Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-xs text-xs">
              <p className="text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + pageSize, totalItems)} of {totalItems}{" "}
                products
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>

                <span className="font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 gap-1 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedProductIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3 px-5 flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 max-w-[92vw]">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="rounded-full px-2.5 py-0.5 font-bold text-xs"
            >
              {selectedProductIds.size} Selected
            </Badge>
            <span className="text-xs text-muted-foreground hidden md:inline">
              ({selectedStickersCount} thermal label
              {selectedStickersCount > 1 ? "s" : ""})
            </span>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <ProductStickerModal
            products={selectedProducts}
            title={`Bulk Print ${selectedStickersCount} Barcode Sticker(s)`}
            trigger={
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-xl bg-[#56C8D8] hover:bg-[#43B8C8] text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Barcodes ({selectedStickersCount})</span>
              </Button>
            }
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedProductIds(new Set())}
            className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
