"use client";

import { useState, useTransition, ReactNode, ReactElement } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteOrderAction } from "@/actions/admin/management/orders/delete-order";
import { toast } from "sonner";

interface DeleteOrderButtonProps {
  orderId: string;
  orderCode: string;
  trigger?: ReactNode;
}

export function DeleteOrderButton({
  orderId,
  orderCode,
  trigger,
}: DeleteOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const [restoreStock, setRestoreStock] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteOrderAction({
        orderId,
        restoreStock,
      });

      if (res.success) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          trigger ? (
            (trigger as ReactElement)
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Delete Order"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <AlertDialogTitle>Delete Order #{orderCode}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2 text-xs text-muted-foreground">
            <p>
              This action cannot be undone. It will permanently remove this
              order record from the database.
            </p>

            <div className="flex items-center space-x-2 pt-2 border-t border-border">
              <Checkbox
                id={`restore-stock-${orderId}`}
                checked={restoreStock}
                onCheckedChange={(checked) => setRestoreStock(!!checked)}
              />
              <label
                htmlFor={`restore-stock-${orderId}`}
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                Restore inventory stock for products &amp; variants in this
                order
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{" "}
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
