// src/controllers/auth.controller.ts
import catchAsync from "../utils/catchAsync";
import otpService from "../services/otp.service";
import tokenService from "../services/token.service";
import prisma from "../client";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";

const sendOtp = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const result = await otpService.sendOtp(phone);
  res.send(result);
});

const verifyOtp = catchAsync(async (req, res) => {
  const { phone, code } = req.body;

  // Step A: verify OTP is correct
  await otpService.verifyOtp(phone, code);

  // Step B: check if user exists
  const user = await prisma.user.findUnique({ where: { phone } });

  if (user) {
    if (user.isBlocked) {
      throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked");
    }

    // Existing user → login
    const tokens = await tokenService.generateAuthTokens(user);
    return res.send({
      isRegistered: true,
      user,
      tokens,
    });
  }

  // New user → frontend should go to register
  return res.send({
    isRegistered: false,
    phone,
    message: "Phone verified. Please complete registration.",
  });
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await tokenService.logout(refreshToken);
  res.status(204).send(); // 204 = success, no content
});

export default { sendOtp, verifyOtp, logout };
