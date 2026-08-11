import prisma from "../client";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifyCallback,
} from "passport-jwt";
import config from "./config";
import { TokenType } from "../generated/prisma";

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error("Invalid token type");
    }
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        name: true,
        role: true,
        isBlocked: true,
      },
      where: { id: payload.sub },
    });
    if (!user || user.isBlocked) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
