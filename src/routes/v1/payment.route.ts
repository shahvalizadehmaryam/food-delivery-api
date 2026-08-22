import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import paymentValidation from "../../validations/payment.validation";
import paymentController from "../../controllers/payment.controller";

const router = express.Router();

router.post(
  "/checkout",
  auth(),
  validate(paymentValidation.createCheckoutSession),
  paymentController.createCheckoutSession,
);

export default router;
