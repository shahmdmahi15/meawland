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
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/actions/admin/management/inventory/delete-product";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
  productCode: string;
  variantCount?: number;
  onSuccess?: () => void;
}

export function DeleteProductButton({
  productId,
  productName,
  productCode,
  variantCount = 0,
  onSuccess,
}: DeleteProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteProductAction(productId);

      if (result.success) {
        toast.success(result.message || "Product deleted successfully");
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting the product.");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        title={`Delete ${productName}`}
        aria-label={`Delete ${productName}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground mt-2">
                <p>
                  Are you sure you want to delete product{" "}
                  <strong>{productName}</strong> (Code:{" "}
                  <code className="px-1.5 py-0.5 rounded bg-muted font-mono font-semibold">
                    {productCode}
                  </code>
                  )?
                </p>
                {variantCount > 0 && (
                  <p className="text-amber-600 font-medium">
                    Warning: This product has {variantCount} variant(s) which
                    will also be permanently deleted.
                  </p>
                )}
                <p className="text-xs">
                  This action is permanent and cannot be undone. All product
                  images stored in S3 and historical data will be removed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-6 flex justify-end gap-3">
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
                "Permanently Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
