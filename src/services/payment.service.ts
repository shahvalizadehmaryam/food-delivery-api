import httpStatus from "http-status";
import Stripe from "stripe";
import { OrderStatus, PaymentStatus, Prisma } from "../generated/prisma";
import prisma from "../client";
import config from "../config/config";
import logger from "../config/logger";
import ApiError from "../utils/ApiError";
import { CheckoutSessionResponse } from "../types/payment";

type CheckoutInput = {
  note?: string | null;
  deliveryAddress?: string;
};

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const toCents = (value: Prisma.Decimal | number) =>
  Math.round(toNumber(value) * 100);

const getStripe = () => {
  if (!config.stripe.secretKey) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe is not configured",
    );
  }
  return new Stripe(config.stripe.secretKey);
};

const expireOpenCheckouts = async (userId: number) => {
  const stripe = getStripe();
  const openOrders = await prisma.order.findMany({
    where: {
      userId,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  for (const order of openOrders) {
    if (order.stripeCheckoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
      } catch (error) {
        logger.warn(
          `Could not expire Stripe session ${order.stripeCheckoutSessionId}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
        isValidOrder: false,
        cancelledAt: new Date(),
      },
    });
  }
};

const createCheckoutSession = async (
  userId: number,
  input: CheckoutInput,
): Promise<CheckoutSessionResponse> => {
  if (!config.stripe.successUrl || !config.stripe.cancelUrl) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe success/cancel URLs are not configured",
    );
  }

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

  await expireOpenCheckouts(userId);

  const order = await prisma.order.create({
    data: {
      userId,
      status: OrderStatus.PENDING_PAYMENT,
      subtotal,
      deliveryAddress,
      note: input.note || null,
      isValidOrder: true,
      paymentStatus: PaymentStatus.UNPAID,
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

  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(order.id),
      metadata: {
        orderId: String(order.id),
        userId: String(userId),
      },
      success_url: config.stripe.successUrl.includes("?")
        ? `${config.stripe.successUrl}&orderId=${order.id}`
        : `${config.stripe.successUrl}?orderId=${order.id}`,
      cancel_url: config.stripe.cancelUrl,
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: config.stripe.currency || "usd",
          unit_amount: toCents(item.price),
          product_data: {
            name: `${item.title} (${item.sizeLabel})`,
          },
        },
      })),
    });

    if (!session.url) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        "Stripe did not return a checkout URL",
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return {
      orderId: order.id,
      url: session.url,
    };
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
        isValidOrder: false,
        cancelledAt: new Date(),
      },
    });

    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw error;
  }
};

const markOrderPaid = async (session: Stripe.Checkout.Session) => {
  if (session.payment_status !== "paid") {
    return;
  }

  const orderId = Number(
    session.metadata?.orderId || session.client_reference_id,
  );
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const order = await prisma.order.findFirst({
    where: session.id
      ? {
          OR: [
            { stripeCheckoutSessionId: session.id },
            ...(Number.isInteger(orderId) && orderId > 0 ? [{ id: orderId }] : []),
          ],
        }
      : Number.isInteger(orderId) && orderId > 0
        ? { id: orderId }
        : { id: -1 },
  });

  if (!order) {
    logger.warn(`Stripe webhook: order not found for session ${session.id}`);
    return;
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PAID,
        isValidOrder: true,
        paidAt: new Date(),
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        cancelledAt: null,
      },
    });

    const basket = await tx.basket.findUnique({
      where: { userId: order.userId },
      select: { id: true },
    });

    if (basket) {
      await tx.basketItem.deleteMany({
        where: { basketId: basket.id },
      });
    }
  });
};

const markOrderFailed = async (session: Stripe.Checkout.Session) => {
  const order = await prisma.order.findFirst({
    where: {
      stripeCheckoutSessionId: session.id,
      paymentStatus: PaymentStatus.UNPAID,
      status: OrderStatus.PENDING_PAYMENT,
    },
  });

  if (!order) {
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.CANCELED,
      paymentStatus: PaymentStatus.FAILED,
      isValidOrder: false,
      cancelledAt: new Date(),
    },
  });
};

const handleStripeEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await markOrderPaid(event.data.object as Stripe.Checkout.Session);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await markOrderFailed(event.data.object as Stripe.Checkout.Session);
      break;
    default:
      break;
  }
};

const constructWebhookEvent = (payload: Buffer | string, signature: string) => {
  if (!config.stripe.webhookSecret) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe webhook secret is not configured",
    );
  }
  try {
    return getStripe().webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret,
    );
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Stripe signature");
  }
};

export default {
  createCheckoutSession,
  handleStripeEvent,
  constructWebhookEvent,
};
