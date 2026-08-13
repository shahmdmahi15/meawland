"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateSliderDialog } from "./create-slider-dialog";
import { Plus } from "lucide-react";

interface SlidersActionsProps {
  onSuccess?: () => void;
}

export function SlidersActions({ onSuccess }: SlidersActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Slider
      </Button>

      <CreateSliderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
