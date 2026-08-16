"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditBrandDialog } from "./edit-brand-dialog";
import { Pencil } from "lucide-react";

interface EditBrandButtonProps {
  brand: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
}

export function EditBrandButton({ brand }: EditBrandButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Edit brand"
        aria-label="Edit brand"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <EditBrandDialog open={open} onOpenChange={setOpen} brand={brand} />
    </>
  );
}
