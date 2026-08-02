import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import flashDealController from "../../controllers/flashDeal.controller";
import flashDealValidation from "../../validations/flashDeal.validation";

const router = express.Router();

router
  .route("/")
  .get(auth("manageFlashDeals"), flashDealController.getAllFlashDeals)
  .post(
    auth("manageFlashDeals"),
    validate(flashDealValidation.createFlashDeal),
    flashDealController.createFlashDeal,
  );

router
  .route("/:id")
  .get(
    auth("manageFlashDeals"),
    validate(flashDealValidation.getFlashDeal),
    flashDealController.getFlashDeal,
  )
  .patch(
    auth("manageFlashDeals"),
    validate(flashDealValidation.updateFlashDeal),
    flashDealController.updateFlashDeal,
  )
  .delete(
    auth("manageFlashDeals"),
    validate(flashDealValidation.deleteFlashDeal),
    flashDealController.deleteFlashDeal,
  );

export default router;
