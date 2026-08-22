import { DiscountType } from "./flashDeal";

/** One line in the basket — matches frontend shape */
export type BasketItemResponse = {
  /** Database id — needed for PATCH/DELETE /items/{itemId} */
  id: number;
  basketId: string;
  productId: number;
  title: string;
  sizeLabel: string;
  price: number;
  originalPrice: number;
  discountType?: DiscountType;
  discountValue?: number;
  quantity: number;
  customizations?: undefined;
};

/** Full basket returned by API */
export type BasketResponse = {
  basketId: string;
  items: BasketItemResponse[];
};

export type AddBasketItemInput = {
  productId: number;
  sizeId: string;
  quantity?: number;
};