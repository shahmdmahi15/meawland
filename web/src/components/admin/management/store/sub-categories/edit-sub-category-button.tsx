"use client";

import { useState } from "react";
import { Category } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EditSubCategoryDialog } from "./edit-sub-category-dialog";

interface EditSubCategoryButtonProps {
  subCategory: {
    id: string;
    name: string;
    slug: string;
    category: Category;
    image: string;
  };
}

export function EditSubCategoryButton({
  subCategory,
}: EditSubCategoryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Edit sub-category"
        aria-label="Edit sub-category"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <EditSubCategoryDialog
        open={open}
        onOpenChange={setOpen}
        subCategory={subCategory}
      />
    </>
  );
}
