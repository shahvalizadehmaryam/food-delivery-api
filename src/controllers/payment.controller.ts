import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import paymentService from "../services/payment.service";

const createCheckoutSession = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const session = await paymentService.createCheckoutSession(userId, {
    note: req.body.note,
    deliveryAddress: req.body.deliveryAddress,
  });
  res.status(httpStatus.CREATED).send(session);
});

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

export default {
  createCheckoutSession,
  handleWebhook,
};
