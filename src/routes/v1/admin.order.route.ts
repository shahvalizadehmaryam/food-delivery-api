import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import orderValidation from "../../validations/order.validation";
import orderController from "../../controllers/order.controller";

const router = express.Router();

router.get(
  "/",
  auth("manageOrders"),
  validate(orderValidation.listAllOrders),
  orderController.listAllOrders,
);

router.patch(
  "/:orderId/status",
  auth("manageOrders"),
  validate(orderValidation.adminUpdateStatus),
  orderController.updateStatus,
);

export default router;
