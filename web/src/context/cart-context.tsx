"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useTransition,
  useCallback,
} from "react";
import { toast } from "sonner";
import {
  getCartAction,
  addToCartAction,
  updateCartItemQuantityAction,
  removeCartItemAction,
  clearCartAction,
  type CartData,
} from "@/actions/store/cart";
import type { AddToCartInput } from "@/schemas/store/cart";

const INITIAL_CART_DATA: CartData = {
  id: null,
  isTemporary: true,
  items: [],
  itemCount: 0,
  distinctCount: 0,
  subtotal: 0,
  originalSubtotal: 0,
  totalDiscount: 0,
  deliveryFee: 0,
  isFreeDelivery: false,
  freeDeliveryThreshold: 2000,
  amountNeededForFreeDelivery: 2000,
  freeDeliveryProgress: 0,
  grandTotal: 0,
  isCheckoutDisabled: true,
  checkoutDisableReason: "Your cart is empty.",
};

interface CartContextType {
  cart: CartData;
  isLoading: boolean;
  isPending: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addToCart: (
    input: AddToCartInput,
    openDrawerAfter?: boolean,
  ) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode;
  initialCart?: CartData;
}) {
  const [cart, setCart] = useState<CartData>(initialCart || INITIAL_CART_DATA);
  const [isLoading, setIsLoading] = useState(!initialCart);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const refreshCart = useCallback(async () => {
    try {
      const freshCart = await getCartAction();
      setCart(freshCart);
    } catch (error) {
      console.error("[CartContext.refreshCart] Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial cart if not provided from server component
  useEffect(() => {
    if (!initialCart) {
      refreshCart();
    }
  }, [initialCart, refreshCart]);

  const addToCart = useCallback(
    async (input: AddToCartInput, openDrawerAfter = true): Promise<boolean> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const res = await addToCartAction(input);
            if (res.success && res.cart) {
              setCart(res.cart);
              toast.success(res.message, {
                action: {
                  label: "View Cart",
                  onClick: () => setIsDrawerOpen(true),
                },
              });
              if (openDrawerAfter) {
                setIsDrawerOpen(true);
              }
              resolve(true);
            } else {
              toast.error(res.message || "Could not add item to cart.");
              resolve(false);
            }
          } catch {
            toast.error("An error occurred while adding to cart.");
            resolve(false);
          }
        });
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number): Promise<boolean> => {
      // Optimistic update
      setCart((prev) => {
        const item = prev.items.find((i) => i.id === cartItemId);
        if (!item) return prev;
        const clampedQty = Math.max(1, quantity);
        const updatedItems = prev.items.map((i) =>
          i.id === cartItemId
            ? {
                ...i,
                quantity: clampedQty,
                lineTotal: i.unitPrice * clampedQty,
              }
            : i,
        );
        const subtotal = updatedItems.reduce((acc, i) => acc + i.lineTotal, 0);
        return {
          ...prev,
          items: updatedItems,
          itemCount: updatedItems.reduce((acc, i) => acc + i.quantity, 0),
          subtotal,
          grandTotal:
            subtotal +
            (subtotal >= prev.freeDeliveryThreshold ? 0 : prev.deliveryFee),
        };
      });

      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const res = await updateCartItemQuantityAction({
              cartItemId,
              quantity,
            });
            if (res.success && res.cart) {
              setCart(res.cart);
              resolve(true);
            } else {
              toast.error(res.message || "Failed to update quantity.");
              await refreshCart();
              resolve(false);
            }
          } catch {
            toast.error("Failed to update cart.");
            await refreshCart();
            resolve(false);
          }
        });
      });
    },
    [refreshCart],
  );

  const removeItem = useCallback(
    async (cartItemId: string): Promise<boolean> => {
      // Optimistic update
      setCart((prev) => {
        const updatedItems = prev.items.filter((i) => i.id !== cartItemId);
        const subtotal = updatedItems.reduce((acc, i) => acc + i.lineTotal, 0);
        return {
          ...prev,
          items: updatedItems,
          itemCount: updatedItems.reduce((acc, i) => acc + i.quantity, 0),
          distinctCount: updatedItems.length,
          subtotal,
          grandTotal:
            subtotal +
            (subtotal >= prev.freeDeliveryThreshold ? 0 : prev.deliveryFee),
        };
      });

      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const res = await removeCartItemAction({ cartItemId });
            if (res.success && res.cart) {
              setCart(res.cart);
              toast.info(res.message);
              resolve(true);
            } else {
              toast.error(res.message || "Failed to remove item.");
              await refreshCart();
              resolve(false);
            }
          } catch {
            toast.error("Failed to remove item.");
            await refreshCart();
            resolve(false);
          }
        });
      });
    },
    [refreshCart],
  );

  const clearCart = useCallback(async (): Promise<boolean> => {
    setCart((prev) => ({
      ...INITIAL_CART_DATA,
      freeDeliveryThreshold: prev.freeDeliveryThreshold,
    }));

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const res = await clearCartAction();
          if (res.success && res.cart) {
            setCart(res.cart);
            toast.info("Cart has been cleared.");
            resolve(true);
          } else {
            toast.error(res.message || "Failed to clear cart.");
            await refreshCart();
            resolve(false);
          }
        } catch {
          toast.error("Failed to clear cart.");
          await refreshCart();
          resolve(false);
        }
      });
    });
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isPending,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
