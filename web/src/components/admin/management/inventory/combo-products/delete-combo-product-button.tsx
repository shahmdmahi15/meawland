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
import { deleteComboProductAction } from "@/actions/admin/management/inventory/combo-products";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteComboProductButtonProps {
  comboId: string;
  comboName: string;
}

export function DeleteComboProductButton({
  comboId,
  comboName,
}: DeleteComboProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteComboProductAction(comboId);
      if (result.success) {
        toast.success(result.message || "Combo product deleted successfully");
        setOpen(false);
      } else {
        toast.error(result.message || "Failed to delete combo product");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while deleting combo product.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        title="Delete combo product"
        aria-label="Delete combo product"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Combo Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{comboName}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
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
