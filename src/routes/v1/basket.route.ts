import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import basketValidation from "../../validations/basket.validation";
import basketController from "../../controllers/basket.controller";

const router = express.Router();

// Guest: create empty basket
router.post(
  "/",
  validate(basketValidation.createBasket),
  basketController.createBasket,
);

// Logged-in routes MUST be before /:basketId
router.get("/me", auth(), basketController.getMyBasket);

router.post(
  "/me/items",
  auth(),
  validate(basketValidation.addItemMe),
  basketController.addItemMe,
);

router.patch(
  "/me/items/:itemId",
  auth(),
  validate(basketValidation.updateItemMe),
  basketController.updateItemMe,
);

router.delete(
  "/me/items/:itemId",
  auth(),
  validate(basketValidation.removeItemMe),
  basketController.removeItemMe,
);

router.post(
  "/merge",
  auth(),
  validate(basketValidation.merge),
  basketController.merge,
);

// Guest routes by basketId
router.get(
  "/:basketId",
  validate(basketValidation.getBasket),
  basketController.getBasket,
);

router.post(
  "/:basketId/items",
  validate(basketValidation.addItem),
  basketController.addItem,
);

router.patch(
  "/:basketId/items/:itemId",
  validate(basketValidation.updateItem),
  basketController.updateItem,
);

router.delete(
  "/:basketId/items/:itemId",
  validate(basketValidation.removeItem),
  basketController.removeItem,
);

export default router;