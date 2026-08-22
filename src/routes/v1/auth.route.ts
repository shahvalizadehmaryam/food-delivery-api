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
// Create account after OTP — body: phone, code, name, lastname, state, city, address, dob
router.post(
  "/register",
  validate(authValidation.register),
  authController.register,
);
router.post(
  "/logout",
  validate(authValidation.logout),
  authController.logout,
);
router.post(
  "/refresh-tokens",
  validate(authValidation.refreshTokens),
  authController.refreshTokens,
);

export default router;
