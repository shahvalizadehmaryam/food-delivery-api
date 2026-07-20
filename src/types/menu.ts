export type MenuItemSize = {
    id: string;
    label: string;
    price: number;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
  };
  
  export type MenuItem = {
    id: number;
    title: string;
    description: string;
    image: string;
    sizes: MenuItemSize[];
  };
  
  export type MenuSection = {
    id: string;
    title: string;
    items: MenuItem[];
  };
  
  export type MenuItemWithCategory = MenuItem & {
    category: string;
  };