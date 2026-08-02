// Shared TypeScript types for flash deal API responses.
// Keep in sync with Swagger schemas in src/docs/components.yml.

export type DiscountType = "percentage" | "fixed";

/** One flash deal as returned by the API */
export type FlashDeal = {
  id: number;
  menuItemId: number;
  sizeId: string | null;
  discountType: DiscountType;
  discountValue: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Present when the deal is joined with its menu item (list/detail) */
  menuItem?: {
    id: number;
    title: string;
    image: string;
  };
};

/** Active deal attached to a menu size in GET /menu */
export type ActiveFlashDealInfo = {
  id: number;
  discountType: DiscountType;
  discountValue: number;
  endsAt: Date;
  finalPrice: number;
};
