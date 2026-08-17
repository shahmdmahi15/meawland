"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCouponAction } from "@/actions/admin/management/offers/coupons";
import { toast } from "sonner";

interface DeleteCouponButtonProps {
  couponId: string;
  couponCode: string;
  onDeleted?: () => void;
}

export function DeleteCouponButton({
  couponId,
  couponCode,
  onDeleted,
}: DeleteCouponButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteCouponAction({ couponId });
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        onDeleted?.();
      } else {
        toast.error(res.message || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("[DeleteCouponButton]:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Delete Coupon"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete coupon{" "}
              <span className="font-semibold text-foreground font-mono">
                &quot;{couponCode}&quot;
              </span>
              ? Customers will no longer be able to apply this discount during
              checkout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Coupon"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
