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
import { deleteSliderAction } from "@/actions/admin/management/store/sliders/delete";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteSliderButtonProps {
  sliderId: string;
  sliderText: string;
  onSuccess?: () => void;
}

export function DeleteSliderButton({
  sliderId,
  sliderText,
  onSuccess,
}: DeleteSliderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteSliderAction(sliderId);

      if (result.success) {
        toast.success(result.message || "Slider deleted successfully");
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to delete slider");
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
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        title="Delete Slider"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the slider{" "}
              <strong>"{sliderText}"</strong>? This action cannot be undone. The
              banner image will also be removed from storage.
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
