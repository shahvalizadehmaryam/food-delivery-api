export type OrderItemResponse = {
  productId: number;
  title: string;
  sizeId: string;
  sizeLabel: string;
  price: number;
  originalPrice: number;
  quantity: number;
};

export type OrderResponse = {
  id: number;
  status: string;
  items: OrderItemResponse[];
  subtotal: number;
  deliveryAddress: string;
  note?: string | null;
  isValidOrder: boolean;
  placedAt: Date;
  updatedAt: Date;
};
