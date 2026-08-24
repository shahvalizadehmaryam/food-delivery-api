import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import paymentService from "../services/payment.service";

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
  await paymentService.handleCoinGateCallback(req.body);
  res.status(httpStatus.OK).send({ received: true });
});

export default {
  createCheckoutSession,
  handleWebhook,
  handleCoinGateWebhook,
};
