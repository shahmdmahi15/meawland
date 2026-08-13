"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateBrandDialog } from "./create-brand-dialog";
import { Plus } from "lucide-react";

interface BrandsActionsProps {
  onSuccess?: () => void;
}

export function BrandsActions({ onSuccess }: BrandsActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Brand
      </Button>

      <CreateBrandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
