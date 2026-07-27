// src/controllers/auth.controller.ts
import catchAsync from "../utils/catchAsync";
import otpService from "../services/otp.service";
import tokenService from "../services/token.service";
import userService from "../services/user.service";
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

  // Step B first: existing users consume OTP; new users keep it for /register
  const user = await prisma.user.findUnique({ where: { phone } });

  if (user) {
    await otpService.verifyOtp(phone, code, { consume: true });

    if (user.isBlocked) {
      throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked");
    }

    const tokens = await tokenService.generateAuthTokens(user);
    return res.send({
      isRegistered: true,
      user,
      tokens,
    });
  }

  // New user → check code but do not delete (register needs { phone, code })
  await otpService.verifyOtp(phone, code, { consume: false });

  return res.send({
    isRegistered: false,
    phone,
    message: "Phone verified. Please complete registration.",
  });
});

/**
 * POST /auth/register
 * Body: phone, code, name, lastname, state, city, address, dob
 * Verifies OTP, creates the user profile, returns auth tokens.
 */
const register = catchAsync(async (req, res) => {
  const { phone, code, name, lastname, state, city, address, dob } = req.body;

  // Consume OTP so the same code cannot be reused
  await otpService.verifyOtp(phone, code, { consume: true });

  // Block duplicate phone numbers
  const existing = await userService.getUserByPhone(phone);
  if (existing) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "An account with this phone already exists",
    );
  }

  // Save profile fields collected from the registration form
  const user = await userService.createUser({
    phone,
    name,
    lastname,
    state,
    city,
    address,
    dob,
  });
  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.CREATED).send({
    user,
    tokens,
  });
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await tokenService.logout(refreshToken);
  res.status(204).send(); // 204 = success, no content
});

export default { sendOtp, verifyOtp, register, logout };
