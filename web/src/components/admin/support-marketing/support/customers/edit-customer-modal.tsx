"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminCustomerSummary,
  AdminUpdateCustomerInput,
  adminUpdateCustomerSchema,
} from "@/schemas/admin/support-marketing/support/customers";
import { adminUpdateCustomerAction } from "@/actions/admin/support-marketing/support/customers";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User, Edit, Loader2, Save } from "lucide-react";

interface EditCustomerModalProps {
  customer: AdminCustomerSummary;
  trigger?: React.ReactNode;
}

export function EditCustomerModal({
  customer,
  trigger,
}: EditCustomerModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(customer.name || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [district, setDistrict] = useState(customer.district || "");
  const [address, setAddress] = useState(customer.address || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: AdminUpdateCustomerInput = {
      id: customer.id,
      name,
      phone,
      district,
      address,
    };

    const parsed = adminUpdateCustomerSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      const first = parsed.error.issues[0]?.message;
      if (first) toast.error(first);
      return;
    }

    startTransition(async () => {
      const res = await adminUpdateCustomerAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 text-gray-500 hover:text-gray-900 rounded-xl"
              title="Edit Customer"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
          )
        }
      />

      <DialogContent className="max-w-[min(94vw,560px)] rounded-3xl p-0 overflow-hidden border border-gray-200">
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-6">
          <DialogTitle className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#56C8D8]" />
            <span>Edit Customer Details</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1 font-mono">
            #{customer.code} • {customer.email}
          </DialogDescription>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Full Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
              required
            />
            {errors.name && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Phone Number
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-mono"
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                District
              </Label>
              <Select
                value={district}
                onValueChange={(val) => val && setDistrict(val)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Street Address
            </Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Delivery address..."
              rows={3}
              className="rounded-xl bg-gray-50/80 border-gray-200 text-xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 rounded-xl border-gray-200 text-xs font-bold text-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 px-6 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 cursor-pointer"
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
      </DialogContent>
    </Dialog>
  );
}
