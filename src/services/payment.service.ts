import httpStatus from "http-status";
import Stripe from "stripe";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  PaymentMethod,
} from "../generated/prisma";
import prisma from "../client";
import config from "../config/config";
import logger from "../config/logger";
import ApiError from "../utils/ApiError";
import { randomBytes, timingSafeEqual } from "crypto";
import { CheckoutSessionResponse } from "../types/payment";

type CheckoutInput = {
  note?: string | null;
  deliveryAddress?: string;
  method?: "card" | "crypto";
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

const getCoinGateConfig = () => {
  if (
    !config.coingate.apiToken ||
    !config.coingate.apiUrl ||
    !config.coingate.callbackUrl ||
    !config.coingate.successUrl ||
    !config.coingate.cancelUrl
  ) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "CoinGate is not configured",
    );
  }
  return config.coingate;
};

const isPubliclyReachableUrl = (value: string) => {
  try {
    const { hostname, protocol } = new URL(value);
    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }
    const host = hostname.toLowerCase();
    return (
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "0.0.0.0" &&
      host !== "::1" &&
      !host.endsWith(".local")
    );
  } catch {
    return false;
  }
};

const createCoinGateInvoice = async (order: {
  id: number;
  subtotal: Prisma.Decimal | number;
  items: Array<{ title: string; sizeLabel: string; quantity: number }>;
}) => {
  const coingate = getCoinGateConfig();
  if (!isPubliclyReachableUrl(coingate.callbackUrl)) {
    logger.warn(
      `COINGATE_CALLBACK_URL (${coingate.callbackUrl}) is not reachable from the internet. CoinGate cannot deliver webhooks to localhost. Order status will be synced from the CoinGate API when the user fetches the order.`,
    );
  }
  // این token بعداً در webhook با مقدار برگشتی CoinGate مقایسه می‌شود.
  const callbackToken = randomBytes(32).toString("hex");

  const description = order.items
    .map((item) => `${item.quantity} x ${item.title} (${item.sizeLabel})`)
    .join(", ")
    .slice(0, 500);

  const response = await fetch(`${coingate.apiUrl}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Token ${coingate.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      order_id: String(order.id),
      price_amount: Number(order.subtotal),
      price_currency: "USD",
      receive_currency: coingate.receiveCurrency || "USD",
      title: `Order #${order.id}`,
      description: description.length >= 3 ? description : `Order #${order.id}`,
      callback_url: coingate.callbackUrl,
      success_url: coingate.successUrl.includes("?")
        ? `${coingate.successUrl}&orderId=${order.id}`
        : `${coingate.successUrl}?orderId=${order.id}`,
      cancel_url: coingate.cancelUrl,
      token: callbackToken,
    }),
  });

  const data = (await response.json()) as {
    id?: number | string;
    payment_url?: string;
    message?: string;
  };

  if (!response.ok || !data.id || !data.payment_url) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      typeof data.message === "string"
        ? data.message
        : "CoinGate did not return a payment URL",
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      coinGateOrderId: String(data.id),
      coinGateCallbackToken: callbackToken,
    },
  });

  return data.payment_url;
};

const expireOpenCheckouts = async (userId: number) => {
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
        const stripe = getStripe();
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
      paymentMethod:
        input.method === "crypto"
          ? PaymentMethod.COINGATE
          : PaymentMethod.STRIPE,
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

  if (input.method === "crypto") {
    try {
      const url = await createCoinGateInvoice(order);
      return {
        orderId: order.id,
        url,
        method: "crypto",
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
      throw error;
    }
  }

  if (!config.stripe.successUrl || !config.stripe.cancelUrl) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
        isValidOrder: false,
        cancelledAt: new Date(),
      },
    });
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe success/cancel URLs are not configured",
    );
  }

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
      method: "card",
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
            ...(Number.isInteger(orderId) && orderId > 0
              ? [{ id: orderId }]
              : []),
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

// مقایسه امن توکن callback با مقدار ذخیره‌شده در دیتابیس.
// === معمولی برای رمز مناسب نیست؛ timingSafeEqual زمان مقایسه را ثابت نگه می‌دارد.
const tokensMatch = (stored: string, received: string) => {
  const a = Buffer.from(stored);
  const b = Buffer.from(received);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
};

// فیلدهایی که CoinGate در POST به callback_url می‌فرستد.
type CoinGateCallback = {
  id?: number | string;
  order_id?: string;
  status?: string;
  token?: string;
  price_amount?: string | number;
  price_currency?: string;
};

type CoinGateOrderRecord = {
  id: number;
  userId: number;
  paymentStatus: PaymentStatus;
};

const applyCoinGateRemoteStatus = async (
  order: CoinGateOrderRecord,
  status: string,
) => {
  // paid یعنی شبکه تأیید کرده؛ فقط این‌جا سفارش را PAID کن.
  if (status === "paid") {
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
    return;
  }

  // pending / confirming را نادیده می‌گیریم؛ هنوز پول قطعی نیست.
  // success_url فقط برگشت مرورگر است و سفارش را paid نمی‌کند.
  if (status === "expired" || status === "canceled" || status === "invalid") {
    if (order.paymentStatus !== PaymentStatus.UNPAID) {
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
  }
};

type CoinGateOrderLookup = {
  id?: number | string;
  order_id?: string;
  status?: string;
  message?: string;
};

const fetchCoinGateOrder = async (coinGateOrderId: string) => {
  const coingate = getCoinGateConfig();
  const response = await fetch(
    `${coingate.apiUrl}/orders/${encodeURIComponent(coinGateOrderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${coingate.apiToken}`,
        Accept: "application/json",
      },
    },
  );

  const data = (await response.json()) as CoinGateOrderLookup;

  if (!response.ok || !data.status) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      typeof data.message === "string"
        ? data.message
        : "CoinGate order lookup failed",
    );
  }

  return data;
};

const lastCoinGateSyncAt = new Map<number, number>();
const COINGATE_SYNC_MIN_MS = 4000;

type SyncCoinGateOptions = {
  force?: boolean;
};

const syncPendingCoinGateOrder = async (
  order: {
    id: number;
    userId: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    coinGateOrderId: string | null;
  },
  options: SyncCoinGateOptions = {},
) => {
  if (
    order.paymentMethod !== PaymentMethod.COINGATE ||
    order.paymentStatus !== PaymentStatus.UNPAID ||
    !order.coinGateOrderId
  ) {
    return false;
  }

  const now = Date.now();
  const lastSyncAt = lastCoinGateSyncAt.get(order.id) ?? 0;
  if (!options.force && now - lastSyncAt < COINGATE_SYNC_MIN_MS) {
    return false;
  }
  lastCoinGateSyncAt.set(order.id, now);

  try {
    const remote = await fetchCoinGateOrder(order.coinGateOrderId);
    if (remote.order_id && Number(remote.order_id) !== order.id) {
      logger.warn(`CoinGate sync: order_id mismatch for order ${order.id}`);
      return false;
    }

    await applyCoinGateRemoteStatus(order, remote.status || "");
    return true;
  } catch (error) {
    logger.warn(
      `CoinGate sync failed for order ${order.id}: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
    return false;
  }
};

// منبع حقیقت پرداخت کریپتو: وضعیت CoinGate (webhook یا GET /orders/:id)، نه برگشت کاربر به success_url.
const handleCoinGateCallback = async (payload: CoinGateCallback) => {
  logger.info(
    `CoinGate webhook: order_id=${payload.order_id ?? "n/a"} status=${payload.status ?? "n/a"}`,
  );

  const receivedToken = payload.token;
  if (!receivedToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing CoinGate token");
  }

  // سفارش را با شناسه CoinGate یا order_id خودمان پیدا کن.
  const orderId = Number(payload.order_id);
  const order = await prisma.order.findFirst({
    where: {
      paymentMethod: PaymentMethod.COINGATE,
      OR: [
        ...(payload.id ? [{ coinGateOrderId: String(payload.id) }] : []),
        ...(Number.isInteger(orderId) && orderId > 0 ? [{ id: orderId }] : []),
      ],
    },
  });

  if (!order || !order.coinGateCallbackToken) {
    logger.warn("CoinGate webhook: order not found");
    return;
  }

  // اگر token با مقدار ذخیره‌شده یکی نباشد، پیام جعلی است.
  if (!tokensMatch(order.coinGateCallbackToken, String(receivedToken))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid CoinGate token");
  }

  if (!payload.status) {
    logger.warn(`CoinGate webhook: missing status for order ${order.id}`);
    return;
  }

  await applyCoinGateRemoteStatus(order, payload.status);
};

export default {
  createCheckoutSession,
  handleStripeEvent,
  constructWebhookEvent,
  handleCoinGateCallback,
  syncPendingCoinGateOrder,
};
