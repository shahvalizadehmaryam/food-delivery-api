import httpStatus from "http-status";
import { OrderStatus, PaymentStatus, Prisma } from "../generated/prisma";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { OrderItemResponse, OrderResponse } from "../types/order";

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

type PlaceOrderInput = {
  note?: string | null;
  deliveryAddress?: string;
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CANCELED],
  [OrderStatus.PLACED]: [OrderStatus.PREPARING, OrderStatus.CANCELED],
  [OrderStatus.PREPARING]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELED]: [],
};

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const toOrderResponse = (order: OrderWithItems): OrderResponse => ({
  id: order.id,
  status: order.status,
  subtotal: toNumber(order.subtotal),
  deliveryAddress: order.deliveryAddress,
  note: order.note,
  isValidOrder: order.isValidOrder,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  stripeCheckoutSessionId: order.stripeCheckoutSessionId,
  coinGateOrderId: order.coinGateOrderId,
  paidAt: order.paidAt,
  placedAt: order.placedAt,
  updatedAt: order.updatedAt,
  items: order.items.map(
    (item): OrderItemResponse => ({
      productId: item.productId,
      title: item.title,
      sizeId: item.sizeId,
      sizeLabel: item.sizeLabel,
      price: toNumber(item.price),
      originalPrice: toNumber(item.originalPrice),
      quantity: item.quantity,
    }),
  ),
});

const placeOrder = async (
  userId: number,
  input: PlaceOrderInput,
): Promise<OrderResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, address: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const basket = await prisma.basket.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!basket || basket.items.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Basket is empty");
  }

  const deliveryAddress =
    input.deliveryAddress?.trim() || user.address?.trim() || "";

  if (!deliveryAddress) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Delivery address is required");
  }

  const subtotal = basket.items.reduce((sum, item) => {
    return sum + toNumber(item.price) * item.quantity;
  }, 0);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.PLACED,
        subtotal,
        deliveryAddress,
        note: input.note || null,
        isValidOrder: true,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
        items: {
          create: basket.items.map((item) => ({
            productId: item.productId,
            title: item.title,
            sizeId: item.sizeId,
            sizeLabel: item.sizeLabel,
            price: item.price,
            originalPrice: item.originalPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await tx.basketItem.deleteMany({
      where: { basketId: basket.id },
    });

    return created;
  });

  return toOrderResponse(order);
};

const listMyOrders = async (
  userId: number,
  status?: OrderStatus,
): Promise<OrderResponse[]> => {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      isValidOrder: true,
      ...(status ? { status } : {}),
    },
    include: { items: true },
    orderBy: { placedAt: "desc" },
  });

  return orders.map(toOrderResponse);
};

const getMyOrder = async (
  userId: number,
  orderId: number,
): Promise<OrderResponse> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, isValidOrder: true },
    include: { items: true },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  return toOrderResponse(order);
};

const cancelMyOrder = async (
  userId: number,
  orderId: number,
): Promise<OrderResponse> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, isValidOrder: true },
    include: { items: true },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (
    order.status !== OrderStatus.PLACED &&
    order.status !== OrderStatus.PENDING_PAYMENT
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Order cannot be canceled");
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.CANCELED,
      isValidOrder: false,
      cancelledAt: new Date(),
    },
    include: { items: true },
  });

  return toOrderResponse(updated);
};

const listAllOrders = async (
  status?: OrderStatus,
): Promise<OrderResponse[]> => {
  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    include: { items: true },
    orderBy: { placedAt: "desc" },
  });

  return orders.map(toOrderResponse);
};

const updateOrderStatus = async (
  orderId: number,
  nextStatus: OrderStatus,
): Promise<OrderResponse> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, isValidOrder: true },
    include: { items: true },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (!ALLOWED_TRANSITIONS[order.status].includes(nextStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status transition");
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: nextStatus,
      ...(nextStatus === OrderStatus.CANCELED
        ? { isValidOrder: false, cancelledAt: new Date() }
        : {}),
    },
    include: { items: true },
  });

  return toOrderResponse(updated);
};

export default {
  placeOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  listAllOrders,
  updateOrderStatus,
};
