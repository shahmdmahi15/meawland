"use client";

import { useState } from "react";
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
import { createSubCategoryAction } from "@/actions/admin/management/store/sub-categories/create";
import {
  createSubCategorySchema,
  type CreateSubCategoryInput,
} from "@/schemas/admin/management/store/sub-categories/create";
import { Category } from "@/generated/prisma/enums";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: Category.PET_ACCESSORIES, label: "Pet Accessories" },
  { value: Category.PET_CARE, label: "Pet Care" },
  { value: Category.PET_FOOD, label: "Pet Food" },
  { value: Category.PET_MEDICINE, label: "Pet Medicine" },
  { value: Category.PET_DRESS, label: "Pet Dress" },
  { value: Category.PET_TOY, label: "Pet Toy" },
  { value: Category.PET_LITTER, label: "Pet Litter" },
];

interface CreateSubCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSubCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSubCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateSubCategoryInput>({
    resolver: zodResolver(createSubCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      category: Category.PET_ACCESSORIES,
    },
  });

  const selectedCategory = watch("category");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
    setValue("slug", slug);
  };

  // Handle image upload with validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Image must be PNG, JPG, or WebP format");
      return;
    }

    // Read file and validate dimensions
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // Check if image is 1:1 (square)
        if (img.width !== img.height) {
          toast.error(
            `Image must be square (1:1 aspect ratio). Current: ${img.width}x${img.height}px`,
          );
          // Reset the input
          e.target.value = "";
          return;
        }

        // Dimensions are valid, set the image
        setSelectedImage(file);
        setValue("image", file);
        setImagePreview(reader.result as string);
      };
      img.onerror = () => {
        toast.error("Failed to load image. Please try another file.");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  async function onSubmit(data: CreateSubCategoryInput) {
    setIsSubmitting(true);

    try {
      const result = await createSubCategoryAction(data);

      if (result.success) {
        toast.success(result.message || "Sub-category created successfully");
        reset();
        setSelectedImage(null);
        setImagePreview(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        if (result.errors) {
          // Show validation errors
          Object.entries(result.errors.fieldErrors).forEach(
            ([field, messages]) => {
              if (messages && messages.length > 0) {
                toast.error(`${field}: ${messages[0]}`);
              }
            },
          );
        } else {
          toast.error(result.message || "Failed to create sub-category");
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setSelectedImage(null);
      setImagePreview(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sub-Category</DialogTitle>
          <DialogDescription>
            Add a new sub-category to your store. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Name Field */}
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldContent>
              <Input
                id="name"
                placeholder="e.g., Dog Collars"
                {...register("name")}
                onChange={(e) => {
                  register("name").onChange(e);
                  handleNameChange(e);
                }}
              />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          {/* Slug Field */}
          <Field>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <FieldContent>
              <Input
                id="slug"
                placeholder="auto-generated-slug"
                {...register("slug")}
              />
              <FieldError errors={[errors.slug]} />
            </FieldContent>
          </Field>

          {/* Category Field */}
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <FieldContent>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setValue("category", value as Category)
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

          {/* Image Upload Field */}
          <Field>
            <FieldLabel htmlFor="image">Image</FieldLabel>
            <FieldContent>
              <div className="space-y-3">
                <label
                  htmlFor="image-input"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center cursor-pointer hover:bg-slate-100 transition-colors"
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
                      {selectedImage ? selectedImage.name : "Click to upload"}
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, or WebP • Square 1:1 ratio • Max 5MB
                    </p>
                  </div>
                </label>
                <input
                  id="image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <FieldError errors={[errors.image]} />
              </div>
            </FieldContent>
          </Field>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Sub-Category"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
