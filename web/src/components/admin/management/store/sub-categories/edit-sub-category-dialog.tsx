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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Category } from "@/generated/prisma/enums";
import { updateSubCategoryAction } from "@/actions/admin/management/store/sub-categories/update";
import {
  updateSubCategorySchema,
  type UpdateSubCategoryInput,
} from "@/schemas/admin/management/store/sub-categories/update";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: Category.PET_ACCESSORIES, label: "Pet Accessories" },
  { value: Category.PET_CARE, label: "Pet Care" },
  { value: Category.PET_FOOD, label: "Pet Food" },
  { value: Category.PET_MEDICINE, label: "Pet Medicine" },
  { value: Category.PET_DRESS, label: "Pet Dress" },
  { value: Category.PET_TOY, label: "Pet Toy" },
  { value: Category.PET_LITTER, label: "Pet Litter" },
];

interface EditSubCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subCategory: {
    id: string;
    name: string;
    slug: string;
    category: Category;
    image: string;
  };
}

export function EditSubCategoryDialog({
  open,
  onOpenChange,
  subCategory,
}: EditSubCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    subCategory.image || null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UpdateSubCategoryInput>({
    resolver: zodResolver(updateSubCategorySchema),
    defaultValues: {
      id: subCategory.id,
      name: subCategory.name,
      slug: subCategory.slug,
      category: subCategory.category,
    },
  });

  const selectedCategory = watch("category");

  useEffect(() => {
    if (!open) return;
    reset({
      id: subCategory.id,
      name: subCategory.name,
      slug: subCategory.slug,
      category: subCategory.category,
    });
    setSelectedImage(null);
    setImagePreview(subCategory.image || null);
  }, [open, reset, subCategory]);

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

  async function onSubmit(data: UpdateSubCategoryInput) {
    setIsSubmitting(true);

    try {
      const result = await updateSubCategoryAction({
        ...data,
        id: subCategory.id,
      });

      if (result.success) {
        toast.success(result.message || "Sub-category updated successfully");
        onOpenChange(false);
      } else if (result.errors) {
        Object.entries(result.errors.fieldErrors).forEach(
          ([field, messages]) => {
            if (messages?.[0]) toast.error(`${field}: ${messages[0]}`);
          },
        );
      } else {
        toast.error(result.message || "Failed to update sub-category");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Sub-Category</DialogTitle>
          <DialogDescription>
            Update sub-category details. Image is mandatory, so you can replace
            it but cannot remove it.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <input type="hidden" value={subCategory.id} {...register("id")} />

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
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <FieldContent>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setValue("category", value as Category, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue>
                    {CATEGORY_OPTIONS.find((o) => o.value === selectedCategory)
                      ?.label ?? "Select a category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.category]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="image">Image (Replace)</FieldLabel>
            <FieldContent>
              <div className="space-y-3">
                <label
                  htmlFor="edit-sub-category-image-input"
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
                      PNG, JPG, or WebP • Square 1:1 ratio • Max 5MB
                    </p>
                  </div>
                </label>
                <input
                  id="edit-sub-category-image-input"
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
