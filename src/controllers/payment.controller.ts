import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import paymentService from "../services/payment.service";
import orderService from "../services/order.service";

const createCheckoutSession = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const session = await paymentService.createCheckoutSession(userId, {
    note: req.body.note,
    deliveryAddress: req.body.deliveryAddress,
    method: req.body.method,
  });
  res.status(httpStatus.CREATED).send(session);
});

// Stripe این روت را صدا می‌زند، نه کاربر. بدون JWT.
const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    res.status(httpStatus.BAD_REQUEST).send({ message: "Missing Stripe signature" });
    return;
  }

  const event = paymentService.constructWebhookEvent(req.body, signature);
  await paymentService.handleStripeEvent(event);
  res.status(httpStatus.OK).send({ received: true });
});

// CoinGate این روت را صدا می‌زند، نه کاربر. بدون JWT.
// اعتبارسنجی با token داخل body است، نه هدر Stripe.
const handleCoinGateWebhook = catchAsync(async (req, res) => {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
  const queryToken = req.query.token;
  const bodyToken = body.token;
  const token =
    typeof bodyToken === "string" || typeof bodyToken === "number"
      ? String(bodyToken)
      : typeof queryToken === "string"
        ? queryToken
        : undefined;
  await paymentService.handleCoinGateCallback({
    ...body,
    token,
  });
  res.status(httpStatus.OK).send({ received: true });
});

// فرانت بعد از برگشت از CoinGate این را صدا می‌زند تا وضعیت را از API CoinGate بگیرد.
// success_url خودش سفارش را paid نمی‌کند.
const syncOrderPayment = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const order = await orderService.getMyOrder(
    userId,
    Number(req.params.orderId),
    { forcePaymentSync: true },
  );
  res.send(order);
});

export default {
  createCheckoutSession,
  handleWebhook,
  handleCoinGateWebhook,
  syncOrderPayment,
};
