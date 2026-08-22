import jwt from "jsonwebtoken";
import moment, { Moment } from "moment";
import httpStatus from "http-status";
import config from "../config/config";
import ApiError from "../utils/ApiError";
import { Token, TokenType } from "../generated/prisma";
import prisma from "../client";
import { AuthTokensResponse } from "../types/response";

/**
 * Generate token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (
  userId: number,
  expires: Moment,
  type: TokenType,
  secret = config.jwt.secret,
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (
  token: string,
  userId: number,
  expires: Moment,
  type: TokenType,
  blacklisted = false,
): Promise<Token> => {
  const createdToken = prisma.token.create({
    data: {
      token,
      userId: userId,
      expires: expires.toDate(),
      type,
      blacklisted,
    },
  });
  return createdToken;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }

  if (payload.type !== type) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
  }

  const userId = Number(payload.sub);
  const tokenData = await prisma.token.findFirst({
    where: { token, type, userId, blacklisted: false },
  });
  if (!tokenData) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Token not found');
  }
  return tokenData;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (user: {
  id: number;
}): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes",
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    TokenType.ACCESS,
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days",
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    TokenType.REFRESH,
  );
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    TokenType.REFRESH,
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};


const logout = async (refreshToken: string) => {
  const tokenData = await verifyToken(refreshToken, TokenType.REFRESH);
  await prisma.token.update({
    where: { id: tokenData.id },
    data: { blacklisted: true },
  });
};

/**
 * Swap a still-valid refresh token for a new access + refresh pair.
 * The old refresh token is deleted so it cannot be reused.
 */
const refreshAuth = async (
  refreshToken: string,
): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, TokenType.REFRESH);
    const user = await prisma.user.findUnique({
      where: { id: refreshTokenDoc.userId },
      select: { id: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      throw new Error("User not found");
    }

    await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
    return generateAuthTokens(user);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  logout,
  refreshAuth,
};
