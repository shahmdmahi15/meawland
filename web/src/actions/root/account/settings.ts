"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64, uploadFile, deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import {
  UserProfileDetails,
  UpdateProfileInput,
  updateProfileSchema,
} from "@/schemas/root/account/settings";

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

/**
 * Get current customer profile details.
 */
export async function getUserProfileSettingsAction(): Promise<{
  success: boolean;
  message?: string;
  profile?: UserProfileDetails;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return {
        success: false,
        message: "Please sign in to view account settings.",
      };
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        district: true,
        address: true,
        role: true,
        googleId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User account not found.",
      };
    }

    const resolvedAvatar = await safeGetImageBase64(user.avatar);

    return {
      success: true,
      profile: {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        avatar: resolvedAvatar || null,
        phone: user.phone,
        district: user.district,
        address: user.address,
        role: user.role,
        hasGoogleLinked: Boolean(user.googleId),
        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    console.error("[Action.Customer.Settings.GetProfile] Error:", error);
    return {
      success: false,
      message: "Failed to load account settings.",
    };
  }
}

/**
 * Updates customer profile details without touching email or code.
 */
export async function updateUserProfileSettingsAction(
  input: UpdateProfileInput,
): Promise<{
  success: boolean;
  message?: string;
  avatarUrl?: string | null;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return {
        success: false,
        message: "Please sign in to update account settings.",
      };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid profile data.",
      };
    }

    const { name, phone, district, address, avatarBase64 } = parsed.data;

    let newAvatarKey: string | undefined = undefined;

    // If new avatar uploaded in base64 format (data:image/...)
    if (avatarBase64 && avatarBase64.startsWith("data:image/")) {
      try {
        const matches = avatarBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const extension = contentType.includes("png")
            ? "png"
            : contentType.includes("webp")
              ? "webp"
              : "jpg";

          const key = `avatars/user-${sessionUser.id}-${Date.now()}.${extension}`;
          const uploadRes = await uploadFile({
            key,
            body: buffer,
            contentType,
          });

          if (uploadRes.success) {
            newAvatarKey = key;
          }
        }
      } catch (uploadErr) {
        console.error(
          "[Action.Customer.Settings] Avatar upload failed:",
          uploadErr,
        );
      }
    }

    const updateData: {
      name: string;
      phone: string | null;
      district: string | null;
      address: string | null;
      avatar?: string;
    } = {
      name,
      phone: phone || null,
      district: district || null,
      address: address || null,
    };

    if (newAvatarKey) {
      updateData.avatar = newAvatarKey;
    }

    await db.user.update({
      where: { id: sessionUser.id },
      data: updateData,
    });

    revalidatePath("/account");
    revalidatePath("/account/settings");

    let resolvedAvatar: string | null = null;
    if (newAvatarKey) {
      resolvedAvatar = await safeGetImageBase64(newAvatarKey);
    }

    return {
      success: true,
      message: "Profile settings updated successfully!",
      avatarUrl: resolvedAvatar,
    };
  } catch (error) {
    console.error("[Action.Customer.Settings.UpdateProfile] Error:", error);
    return {
      success: false,
      message: "Failed to update profile settings.",
    };
  }
}

/**
 * Removes custom user avatar and resets to default.
 */
export async function removeUserAvatarAction(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return { success: false, message: "Unauthorized" };
    }

    const existing = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { avatar: true },
    });

    if (existing?.avatar && !existing.avatar.startsWith("http")) {
      try {
        await deleteFile({ key: existing.avatar });
      } catch {
        // Non-fatal
      }
    }

    await db.user.update({
      where: { id: sessionUser.id },
      data: { avatar: null },
    });

    revalidatePath("/account");
    revalidatePath("/account/settings");

    return {
      success: true,
      message: "Avatar photo removed.",
    };
  } catch (error) {
    console.error("[Action.Customer.Settings.RemoveAvatar] Error:", error);
    return {
      success: false,
      message: "Failed to remove avatar.",
    };
  }
}
