"use client";

import React, { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UserProfileDetails,
  UpdateProfileInput,
  updateProfileSchema,
} from "@/schemas/root/account/settings";
import {
  updateUserProfileSettingsAction,
  removeUserAvatarAction,
} from "@/actions/root/account/settings";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Camera,
  Trash2,
  Lock,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AccountSettingsFormProps {
  profile: UserProfileDetails;
}

export function AccountSettingsForm({ profile }: AccountSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar || null,
  );
  const [newAvatarBase64, setNewAvatarBase64] = useState<string | null>(null);

  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [district, setDistrict] = useState(profile.district || "");
  const [address, setAddress] = useState(profile.address || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle avatar image selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setNewAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    startTransition(async () => {
      const res = await removeUserAvatarAction();
      if (res.success) {
        setAvatarPreview(null);
        setNewAvatarBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success(res.message || "Avatar removed.");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to remove avatar.");
      }
    });
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: UpdateProfileInput = {
      name,
      phone,
      district,
      address,
      avatarBase64: newAvatarBase64 || undefined,
    };

    const parsed = updateProfileSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0] as string;
        if (fieldName) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      const firstMsg = parsed.error.issues[0]?.message;
      if (firstMsg) toast.error(firstMsg);
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfileSettingsAction(formData);
      if (res.success) {
        toast.success(res.message || "Profile updated successfully! ✨");
        if (res.avatarUrl) {
          setAvatarPreview(res.avatarUrl);
        }
        setNewAvatarBase64(null);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update profile.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-7"
    >
      {/* Avatar Photo Section */}
      <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
        <div className="relative group">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-3 border-[#56C8D8] shadow-sm bg-[#EDF5FA] flex items-center justify-center">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt={name || "User Avatar"}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized={avatarPreview.startsWith("data:")}
              />
            ) : (
              <div className="text-2xl font-black text-[#56C8D8]">
                {name
                  ? name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "ML"}
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {/* Quick Camera overlay button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
            title="Change Avatar Photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Profile Picture</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              JPG, PNG, or WEBP up to 5MB. Visible across reviews and comments.
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 rounded-xl text-xs font-semibold border-gray-200 hover:bg-gray-50 gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-gray-500" />
              <span>Upload New Photo</span>
            </Button>

            {avatarPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isPending}
                className="h-8 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="space-y-5">
        {/* Full Name & Locked Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-gray-700">
              Full Name <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="pl-9.5 h-11 rounded-2xl bg-gray-50/70 border-gray-200 text-xs focus-visible:ring-[#56C8D8]"
                required
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Locked Readonly Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="email"
                className="text-xs font-bold text-gray-700"
              >
                Email Address
              </Label>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-gray-300 text-gray-500 bg-gray-100 font-bold gap-1"
              >
                <Lock className="w-2.5 h-2.5" />
                Locked
              </Badge>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="email"
                value={profile.email}
                disabled
                className="pl-9.5 pr-8 h-11 rounded-2xl bg-gray-100/80 border-gray-200 text-xs text-gray-500 font-mono cursor-not-allowed select-none"
              />
              <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-gray-400">
              Email is permanently linked to your order history and cannot be
              changed.
            </p>
          </div>
        </div>

        {/* Phone & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-gray-700">
              Contact Phone Number
            </Label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="pl-9.5 h-11 rounded-2xl bg-gray-50/70 border-gray-200 text-xs font-mono focus-visible:ring-[#56C8D8]"
              />
            </div>
            {errors.phone ? (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.phone}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400">
                Used for parcel delivery updates and courier dispatch.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="district"
              className="text-xs font-bold text-gray-700"
            >
              Default Delivery District
            </Label>
            <Select
              value={district}
              onValueChange={(val) => {
                if (val) setDistrict(val);
              }}
            >
              <SelectTrigger
                id="district"
                className="h-11 rounded-2xl bg-gray-50/70 border-gray-200 text-xs font-medium focus:ring-[#56C8D8]"
              >
                <SelectValue placeholder="Select Bangladesh District" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {BANGLADESH_DISTRICTS.map((dist) => (
                  <SelectItem key={dist} value={dist} className="text-xs">
                    {dist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.district && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.district}
              </p>
            )}
          </div>
        </div>

        {/* Default Delivery Street Address */}
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs font-bold text-gray-700">
            Default Street Address / Area
          </Label>
          <div className="relative">
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Flat / Apartment, Road / Area name..."
              rows={3}
              className="rounded-2xl bg-gray-50/70 border-gray-200 text-xs focus-visible:ring-[#56C8D8] resize-none"
            />
          </div>
          {errors.address ? (
            <p className="text-[11px] text-rose-500 font-medium">
              {errors.address}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400">
              Auto-filled during checkout to save you time when placing orders.
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>All updates are synchronized immediately.</span>
        </span>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto h-11 px-8 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 shadow-xs cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </Button>
      </div>
    </form>
  );
}
