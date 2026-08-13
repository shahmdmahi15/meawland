"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { deleteBrandAction } from "@/actions/admin/management/store/brands/delete";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteBrandButtonProps {
  brandId: string;
  brandName: string;
  productCount: number;
  onSuccess?: () => void;
}

export function DeleteBrandButton({
  brandId,
  brandName,
  productCount,
  onSuccess,
}: DeleteBrandButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasProducts = productCount > 0;

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteBrandAction(brandId);

      if (result.success) {
        toast.success(result.message || "Brand deleted successfully");
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to delete brand");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => !hasProducts && setIsOpen(true)}
              disabled={hasProducts}
              className={
                hasProducts
                  ? "cursor-not-allowed opacity-40"
                  : "text-destructive hover:text-destructive hover:bg-destructive/10"
              }
              title={
                hasProducts
                  ? `Cannot delete — ${productCount} product${productCount === 1 ? "" : "s"} assigned`
                  : `Delete ${brandName}`
              }
              aria-disabled={hasProducts}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {hasProducts && (
            <TooltipContent side="left">
              <p>
                Cannot delete &mdash; {productCount} product
                {productCount === 1 ? "" : "s"} assigned
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{brandName}</strong>? This
              action cannot be undone. The associated image will also be removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
