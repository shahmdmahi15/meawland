import { NavbarAccount } from "@/actions/auth/get-me";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Role } from "@/generated/prisma/enums";
import {
  Users,
  ChevronRight,
  Logs,
  House,
  ShoppingCart,
  Warehouse,
  Tags,
  User,
  Store,
  Search,
  Scan,
  ChartColumnDecreasing,
  ChartLine,
  Heart,
} from "lucide-react";
import Link from "next/link";

const adminNavigations = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Admin",
        url: "/admin",
        icon: House,
        items: [],
      },
      {
        title: "Account",
        url: "/account",
        icon: User,
        items: [],
      },
      {
        title: "Search",
        url: "/admin/search",
        icon: Search,
        items: [],
      },
      {
        title: "Scan",
        url: "/admin/scan",
        icon: Scan,
        items: [],
      },
    ],
  },
  {
    name: "Management",
    items: [
      {
        title: "Inventory",
        url: "#",
        icon: Warehouse,
        items: [
          {
            title: "New Product",
            url: "/admin/management/inventory/new-product",
          },
          {
            title: "All Products",
            url: "/admin/management/inventory/all-products",
          },
          {
            title: "Combo Products",
            url: "/admin/management/inventory/combo-products",
          },
          {
            title: "Modify Stock",
            url: "/admin/management/inventory/modify-stock",
          },
        ],
      },
      {
        title: "Store",
        url: "#",
        icon: Store,
        items: [
          {
            title: "Sub Categories",
            url: "/admin/management/store/sub-categories",
          },
          {
            title: "Brands",
            url: "/admin/management/store/brands",
          },
          {
            title: "Sliders",
            url: "/admin/management/store/sliders",
          },
        ],
      },
      {
        title: "Orders",
        url: "#",
        icon: ShoppingCart,
        items: [
          {
            title: "New Order",
            url: "/admin/management/orders/new-order",
          },
          {
            title: "All Orders",
            url: "/admin/management/orders/all-orders",
          },
          {
            title: "Web Orders",
            url: "/admin/management/orders/web-orders",
          },
          {
            title: "Other Orders",
            url: "/admin/management/orders/other-orders",
          },
        ],
      },
      {
        title: "Offers",
        url: "#",
        icon: Tags,
        items: [
          {
            title: "Coupons",
            url: "/admin/management/offers/coupons",
          },
          {
            title: "Campaigns",
            url: "/admin/management/offers/campaigns",
          },
        ],
      },
      {
        title: "Customers",
        url: "/admin/management/customers",
        icon: Users,
        items: [],
      },
    ],
  },
  {
    name: "Reports",
    items: [
      {
        title: "Product Reports",
        url: "#",
        icon: ChartColumnDecreasing,
        items: [
          {
            title: "Best Selling",
            url: "/admin/reports/product-reports/best-selling",
          },
          {
            title: "Low Stocks",
            url: "/admin/reports/product-reports/low-stocks",
          },
        ],
      },
      {
        title: "Order Reports",
        url: "#",
        icon: ChartLine,
        items: [
          {
            title: "Division Wise",
            url: "/admin/reports/order-reports/division-wise",
          },
          {
            title: "District Wise",
            url: "/admin/reports/order-reports/district-wise",
          },
        ],
      },
      {
        title: "Customer Reports",
        url: "#",
        icon: Heart,
        items: [
          {
            title: "Top Customers",
            url: "/admin/reports/customer-reports/top-customers",
          },
          {
            title: "New Customers",
            url: "/admin/reports/order-reports/new-customers",
          },
        ],
      },
    ],
  },
];

const ownerNavigations = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Admin",
        url: "/admin",
        icon: House,
        items: [],
      },
      {
        title: "Account",
        url: "/account",
        icon: User,
        items: [],
      },
      {
        title: "Search",
        url: "/admin/search",
        icon: Search,
        items: [],
      },
      {
        title: "Scan",
        url: "/admin/scan",
        icon: Scan,
        items: [],
      },
    ],
  },
  {
    name: "Management",
    items: [
      {
        title: "Inventory",
        url: "#",
        icon: Warehouse,
        items: [
          {
            title: "New Product",
            url: "/admin/management/inventory/new-product",
          },
          {
            title: "All Products",
            url: "/admin/management/inventory/all-products",
          },
          {
            title: "Combo Products",
            url: "/admin/management/inventory/combo-products",
          },
          {
            title: "Modify Stock",
            url: "/admin/management/inventory/modify-stock",
          },
        ],
      },
      {
        title: "Store",
        url: "#",
        icon: Store,
        items: [
          {
            title: "Sub Categories",
            url: "/admin/management/store/sub-categories",
          },
          {
            title: "Brands",
            url: "/admin/management/store/brands",
          },
          {
            title: "Sliders",
            url: "/admin/management/store/sliders",
          },
        ],
      },
      {
        title: "Orders",
        url: "#",
        icon: ShoppingCart,
        items: [
          {
            title: "New Order",
            url: "/admin/management/orders/new-order",
          },
          {
            title: "All Orders",
            url: "/admin/management/orders/all-orders",
          },
          {
            title: "Web Orders",
            url: "/admin/management/orders/web-orders",
          },
          {
            title: "Other Orders",
            url: "/admin/management/orders/other-orders",
          },
        ],
      },
      {
        title: "Offers",
        url: "#",
        icon: Tags,
        items: [
          {
            title: "Coupons",
            url: "/admin/management/offers/coupons",
          },
          {
            title: "Campaigns",
            url: "/admin/management/offers/campaigns",
          },
        ],
      },
      {
        title: "Customers",
        url: "/admin/management/customers",
        icon: Users,
        items: [],
      },
    ],
  },
  {
    name: "Reports",
    items: [
      {
        title: "Product Reports",
        url: "#",
        icon: ChartColumnDecreasing,
        items: [
          {
            title: "Best Selling",
            url: "/admin/reports/product-reports/best-selling",
          },
          {
            title: "Low Stocks",
            url: "/admin/reports/product-reports/low-stocks",
          },
        ],
      },
      {
        title: "Order Reports",
        url: "#",
        icon: ChartLine,
        items: [
          {
            title: "Division Wise",
            url: "/admin/reports/order-reports/division-wise",
          },
          {
            title: "District Wise",
            url: "/admin/reports/order-reports/district-wise",
          },
        ],
      },
      {
        title: "Customer Reports",
        url: "#",
        icon: Heart,
        items: [
          {
            title: "Top Customers",
            url: "/admin/reports/customer-reports/top-customers",
          },
          {
            title: "New Customers",
            url: "/admin/reports/order-reports/new-customers",
          },
        ],
      },
    ],
  },
  {
    name: "Security",
    items: [
      {
        title: "Users",
        url: "/admin/security/users",
        icon: Users,
        items: [],
      },
      {
        title: "Audit Logs",
        url: "/admin/security/audit-logs",
        icon: Logs,
        items: [],
      },
    ],
  },
];

export function AdminSidebarContent({ user }: { user: NavbarAccount }) {
  const navigations =
    user.role === Role.OWNER ? ownerNavigations : adminNavigations;
  return (
    <SidebarContent>
      {navigations.map((navigation, index) => (
        <SidebarGroup key={index}>
          <SidebarGroupLabel>{navigation.name}</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.items.map((item) =>
              item.items.length === 0 ? (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="flex items-center"
                  >
                    {item.icon && <item.icon />}
                    <Link href={item.url}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <Collapsible
                  key={item.title}
                  className="group/collapsible"
                  render={
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        }
                      />
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                render={
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                }
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  }
                />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
