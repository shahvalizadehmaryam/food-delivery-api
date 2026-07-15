import express from "express";
import authValidation from "../../validations/auth.validation";
import authController from "../../controllers/auth.controller";
import validate from "../../middlewares/validate";

const router = express.Router();

// src/routes/v1/auth.route.ts
router.post(
  "/send-otp",
  validate(authValidation.sendOtp),
  authController.sendOtp,
);
router.post(
  "/verify-otp",
  validate(authValidation.verifyOtp),
  authController.verifyOtp,
);
router.post(
  "/logout",
  validate(authValidation.logout),
  authController.logout,
);

export default router;
