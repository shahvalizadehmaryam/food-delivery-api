// Shared TypeScript types for menu API responses.
// Keep these in sync with Swagger schemas in src/docs/components.yml.

/** One size option (Small / Medium / Large) with optional discount */
export type MenuItemSize = {
  id: string;
  label: string;
  price: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  /** Price after discount (static or flash). Omitted when there is no discount. */
  finalPrice?: number;
  /** Present only while a flash deal is active for this size */
  flashDeal?: {
    id: number;
    endsAt: Date;
  };
};

/** A single food item shown as a card in the menu grid */
export type MenuItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  sizes: MenuItemSize[];
};

/** A menu category section (Burgers, Fries, etc.) */
export type MenuSection = {
  id: string;
  title: string;
  items: MenuItem[];
};

/** Useful for item-detail endpoints — item plus its category name */
export type MenuItemWithCategory = MenuItem & {
  category: string;
};
