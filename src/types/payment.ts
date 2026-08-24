export type PaymentMethodInput = "card" | "crypto";

export type CheckoutSessionResponse = {
  orderId: number;
  url: string;
  method: PaymentMethodInput;
};
