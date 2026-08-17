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
import { deleteCampaignAction } from "@/actions/admin/management/offers/campaigns";
import { toast } from "sonner";

interface DeleteCampaignButtonProps {
  campaignId: string;
  campaignName: string;
  onDeleted?: () => void;
}

export function DeleteCampaignButton({
  campaignId,
  campaignName,
  onDeleted,
}: DeleteCampaignButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteCampaignAction({ campaignId });
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        onDeleted?.();
      } else {
        toast.error(res.message || "Failed to delete campaign");
      }
    } catch (error) {
      console.error("[DeleteCampaignButton]:", error);
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
        title="Delete Campaign"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotional Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete campaign{" "}
              <span className="font-semibold text-foreground">
                &quot;{campaignName}&quot;
              </span>
              ? Its hero banner will be purged from storage and all campaign
              promotions will be discontinued.
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
                "Delete Campaign"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
