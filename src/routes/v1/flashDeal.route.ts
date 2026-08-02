import express from "express";
import flashDealController from "../../controllers/flashDeal.controller";

const router = express.Router();

/** Public — currently active flash deals only */
router.get("/", flashDealController.getActiveFlashDeals);

export default router;
