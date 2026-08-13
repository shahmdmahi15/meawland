import { getAllSlidersAdminAction } from "@/actions/admin/management/store/sliders/get-all";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SlidersTable } from "@/components/admin/management/store/sliders/sliders-table";
import { SlidersActions } from "@/components/admin/management/store/sliders/sliders-actions";
import { AlertCircle, Images } from "lucide-react";

export default async function SlidersPage() {
  const res = await getAllSlidersAdminAction();

  if (!res?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to Load Sliders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res?.message ?? "An error occurred while loading sliders."}
          </p>
        </div>
      </div>
    );
  }

  const sliders = res.sliders ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Images className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Homepage Sliders
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage hero banner sliders displayed on the storefront.
            </p>
          </div>
        </div>
        <SlidersActions />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total Sliders</CardDescription>
            <CardTitle className="text-2xl">{sliders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Banner Dimensions</CardDescription>
            <CardTitle className="text-lg font-mono font-normal text-muted-foreground">
              1920 &times; 1080 px
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Supported Formats</CardDescription>
            <CardTitle className="text-lg font-normal text-muted-foreground">
              PNG, JPG, WebP
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sliders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sliders</CardTitle>
          <CardDescription>
            Manage active promotional banner sliders for your store homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SlidersTable sliders={sliders} />
        </CardContent>
      </Card>
    </div>
  );
}
