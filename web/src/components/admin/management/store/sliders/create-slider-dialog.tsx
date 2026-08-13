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
import { Button } from "@/components/ui/button";
import { createSliderAction } from "@/actions/admin/management/store/sliders/create";
import {
  createSliderSchema,
  type CreateSliderInput,
} from "@/schemas/admin/management/store/sliders/create";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface CreateSliderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSliderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSliderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<CreateSliderInput>({
    resolver: zodResolver(createSliderSchema),
    defaultValues: {
      text: "",
      buttonText: "",
      buttonLink: "",
    },
  });

  // Handle image upload with 1920x1080 dimension validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Image must be PNG, JPG, or WebP format");
      return;
    }

    // Read file and validate exact 1920x1080 dimensions
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // Enforce 1920x1080 pixels
        if (img.width !== 1920 || img.height !== 1080) {
          toast.error(
            `Image must be exactly 1920x1080 pixels. Current: ${img.width}x${img.height}px`,
          );
          // Reset input
          e.target.value = "";
          return;
        }

        // Dimensions are valid
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
  async function onSubmit(data: CreateSliderInput) {
    setIsSubmitting(true);

    try {
      const result = await createSliderAction(data);

      if (result.success) {
        toast.success(result.message || "Slider created successfully");
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
          toast.error(result.message || "Failed to create slider");
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
          <DialogTitle>Create Homepage Slider</DialogTitle>
          <DialogDescription>
            Add a new hero banner slider to your homepage. Image must be
            1920x1080 pixels.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Slider Text / Heading */}
          <Field>
            <FieldLabel htmlFor="text">Slider Text / Headline</FieldLabel>
            <FieldContent>
              <Input
                id="text"
                placeholder="e.g., Summer Pet Essentials Up to 40% Off"
                {...register("text")}
              />
              <FieldError errors={[errors.text]} />
            </FieldContent>
          </Field>

          {/* Button Text */}
          <Field>
            <FieldLabel htmlFor="buttonText">Button Label</FieldLabel>
            <FieldContent>
              <Input
                id="buttonText"
                placeholder="e.g., Shop Now"
                {...register("buttonText")}
              />
              <FieldError errors={[errors.buttonText]} />
            </FieldContent>
          </Field>

          {/* Button Link */}
          <Field>
            <FieldLabel htmlFor="buttonLink">Button Destination URL</FieldLabel>
            <FieldContent>
              <Input
                id="buttonLink"
                placeholder="e.g., /category/pet-food or https://..."
                {...register("buttonLink")}
              />
              <FieldError errors={[errors.buttonLink]} />
            </FieldContent>
          </Field>

          {/* Image Upload Field */}
          <Field>
            <FieldLabel htmlFor="image">
              Slider Banner Image (1920x1080)
            </FieldLabel>
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
                      width={160}
                      height={90}
                      className="h-20 w-36 rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-slate-400" />
                  )}
                  <div className="text-sm">
                    <p className="font-medium text-slate-700">
                      {selectedImage
                        ? selectedImage.name
                        : "Click to upload banner"}
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, or WebP • Exact 1920x1080 pixels • Max 5MB
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
              "Create Slider"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
