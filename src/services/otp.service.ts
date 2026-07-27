import crypto from "crypto";
import prisma from "../client";
import { encryptPassword, isPasswordMatch } from "../utils/encryption";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

// 1. Generate random 5-digit code
const generateOtpCode = () => String(Math.floor(10000 + Math.random() * 90000));

// 2. Send OTP (save to DB + send SMS)
const sendOtp = async (phone: string) => {
  const code = generateOtpCode();
  const hashedCode = await encryptPassword(code); // reuse bcrypt

  // Delete old OTPs for this phone
  await prisma.otp.deleteMany({ where: { phone } });

  // Save new OTP (expires in 2 minutes)
  await prisma.otp.create({
    data: {
      phone,
      code: hashedCode,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    },
  });

  // TODO: call SMS provider (Kavenegar, Ghasedak, Twilio, etc.)
  console.log(`OTP for ${phone}: ${code}`); // remove in production

  return { message: "OTP sent successfully", code };
};

// 3. Verify OTP
// consume: false keeps the code so /auth/register can use { phone, code } next
const verifyOtp = async (
  phone: string,
  code: string,
  options: { consume?: boolean } = {},
) => {
  const { consume = true } = options;

  const otpRecord = await prisma.otp.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "OTP not found. Request a new one.",
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "OTP expired. Request a new one.",
    );
  }

  const isValid = await isPasswordMatch(code, otpRecord.code);
  if (!isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP code.");
  }

  if (consume) {
    await prisma.otp.delete({ where: { id: otpRecord.id } });
  }

  return true;
};

export default { sendOtp, verifyOtp };
