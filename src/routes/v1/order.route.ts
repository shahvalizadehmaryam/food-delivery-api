import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import orderValidation from "../../validations/order.validation";
import orderController from "../../controllers/order.controller";

const router = express.Router();

router.post(
  "/",
  auth(),
  validate(orderValidation.placeOrder),
  orderController.placeOrder,
);

router.get(
  "/me",
  auth(),
  validate(orderValidation.listMyOrders),
  orderController.listMyOrders,
);

router.get(
  "/me/:orderId",
  auth(),
  validate(orderValidation.getMyOrder),
  orderController.getMyOrder,
);

router.patch(
  "/me/:orderId/cancel",
  auth(),
  validate(orderValidation.cancelMyOrder),
  orderController.cancelMyOrder,
);

export default router;
