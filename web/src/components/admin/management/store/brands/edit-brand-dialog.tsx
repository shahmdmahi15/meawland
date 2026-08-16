"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateBrandAction } from "@/actions/admin/management/store/brands/update";
import {
  updateBrandSchema,
  type UpdateBrandInput,
} from "@/schemas/admin/management/store/brands/update";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface EditBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
}

export function EditBrandDialog({
  open,
  onOpenChange,
  brand,
}: EditBrandDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    brand.image || null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UpdateBrandInput>({
    resolver: zodResolver(updateBrandSchema),
    defaultValues: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    });
    setSelectedImage(null);
    setImagePreview(brand.image || null);
  }, [brand, open, reset]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
    setValue("slug", slug, { shouldValidate: true });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Image must be PNG, JPG, or WebP format");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        if (img.width !== img.height) {
          toast.error(
            `Image must be square (1:1). Current: ${img.width}x${img.height}px`,
          );
          e.target.value = "";
          return;
        }
        setSelectedImage(file);
        setValue("image", file, { shouldValidate: true });
        setImagePreview(reader.result as string);
      };
      img.onerror = () => {
        toast.error("Failed to load image. Please try another file.");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function onSubmit(data: UpdateBrandInput) {
    setIsSubmitting(true);
    try {
      const result = await updateBrandAction({
        ...data,
        id: brand.id,
      });

      if (result.success) {
        toast.success(result.message || "Brand updated successfully");
        onOpenChange(false);
      } else if (result.errors) {
        Object.entries(result.errors.fieldErrors).forEach(
          ([field, messages]) => {
            if (messages?.[0]) toast.error(`${field}: ${messages[0]}`);
          },
        );
      } else {
        toast.error(result.message || "Failed to update brand");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Brand</DialogTitle>
          <DialogDescription>
            Update brand details. Brand image is required, so you can replace it
            but not remove it.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <input type="hidden" value={brand.id} {...register("id")} />

          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldContent>
              <Input
                id="name"
                {...register("name")}
                onChange={(e) => {
                  register("name").onChange(e);
                  handleNameChange(e);
                }}
              />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <FieldContent>
              <Input id="slug" {...register("slug")} />
              <FieldError errors={[errors.slug]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="image">Logo / Image (Replace)</FieldLabel>
            <FieldContent>
              <div className="space-y-3">
                <label
                  htmlFor="edit-brand-image-input"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:bg-slate-100"
                >
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-slate-400" />
                  )}
                  <div className="text-sm">
                    <p className="font-medium text-slate-700">
                      {selectedImage
                        ? selectedImage.name
                        : "Click to replace image"}
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, or WebP • Square 1:1 • Max 5MB
                    </p>
                  </div>
                </label>
                <input
                  id="edit-brand-image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <FieldError errors={[errors.image]} />
              </div>
            </FieldContent>
          </Field>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
