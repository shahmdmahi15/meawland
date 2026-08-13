"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateSubCategoryDialog } from "./create-sub-category-dialog";
import { Plus } from "lucide-react";

interface SubCategoriesActionsProps {
  onSuccess?: () => void;
}

export function SubCategoriesActions({ onSuccess }: SubCategoriesActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Sub-Category
      </Button>

      <CreateSubCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
