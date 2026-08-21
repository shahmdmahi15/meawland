"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import { editUserAction } from "@/actions/admin/security/users/edit";
import { getUserDetailsForEditing } from "@/actions/admin/security/users/get-details-for-editing";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import { Role } from "@/generated/prisma/enums";
import {
  userEditSchema,
  type UserEditInput,
} from "@/schemas/admin/security/users/edit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

type EditingDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: UserEditInput = {
  name: "",
  email: "",
  phone: "",
  district: BANGLADESH_DISTRICTS[0],
  address: "",
  role: Role.USER,
};

export function EditingDialog({
  userId,
  open,
  onOpenChange,
}: EditingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UserEditInput>({
    resolver: zodResolver(userEditSchema),
    defaultValues,
    mode: "onTouched",
  });

  const handleDialogChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset(defaultValues);
        setLoading(false);
      }

      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  useEffect(() => {
    if (!open) return;

    let active = true;
    async function loadUser() {
      setLoadingUser(true);
      const response = await getUserDetailsForEditing(userId);

      if (!active) return;

      if (!response.success || !response.user) {
        toast.error(response.message);
        handleDialogChange(false);
      } else {
        const district =
          BANGLADESH_DISTRICTS.find(
            (option) => option === response.user?.district,
          ) ?? BANGLADESH_DISTRICTS[0];

        reset({
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone ?? "",
          district,
          address: response.user.address ?? "",
          role: response.user.role,
        });
      }

      setLoadingUser(false);
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [handleDialogChange, open, reset, userId]);

  async function onSubmit(input: UserEditInput) {
    setLoading(true);
    const response = await editUserAction(userId, input);

    if (!response.success) {
      const fieldErrors = response.errors?.fieldErrors;
      if (fieldErrors) {
        for (const field of Object.keys(fieldErrors) as Array<
          keyof UserEditInput
        >) {
          const message = fieldErrors[field]?.[0];
          if (message) setError(field, { message });
        }
      }
      toast.error(response.message);
    } else {
      toast.success(response.message);
      handleDialogChange(false);
      window.location.reload();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update the user&apos;s name, contact details, district, and role.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field>
            <FieldLabel htmlFor="edit-user-name">Name</FieldLabel>
            <FieldContent>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="edit-user-name" {...field} />}
              />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-user-email">Email</FieldLabel>
            <FieldContent>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input id="edit-user-email" type="email" {...field} />
                )}
              />
              <FieldError errors={[errors.email]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-user-phone">Phone</FieldLabel>
            <FieldContent>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input id="edit-user-phone" {...field} />
                )}
              />
              <FieldError errors={[errors.phone]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-user-district">District</FieldLabel>
            <FieldContent>
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-user-district" className="w-full">
                      <SelectValue>
                        {field.value || "Select District"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {BANGLADESH_DISTRICTS.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.district]} />
            </FieldContent>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="edit-user-address">Address</FieldLabel>
            <FieldContent>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input id="edit-user-address" {...field} />
                )}
              />
              <FieldError errors={[errors.address]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-user-role">Role</FieldLabel>
            <FieldContent>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-user-role" className="w-full">
                      <SelectValue>{field.value || "Select Role"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Role).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.role]} />
            </FieldContent>
          </Field>

          <DialogFooter className="sm:col-span-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={loading || isSubmitting || loadingUser || !isDirty}
            >
              {(loading || isSubmitting) && (
                <LoaderCircle className="animate-spin" />
              )}
              {loadingUser
                ? "Loading..."
                : loading
                  ? "Saving..."
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
