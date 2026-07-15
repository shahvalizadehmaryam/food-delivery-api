import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import { Role } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';

type AuthUser = {
  id: number;
  name: string | null;
  role: Role;
};

const auth =
  (...requiredRights: string[]): RequestHandler =>
  (req, res, next) => {
    passport.authenticate(
      'jwt',
      { session: false },
      (err: Error | null, user: AuthUser | false | undefined) => {
        // 1. Authentication check: is the token valid?
        if (err || !user) {
          return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
        }
        req.user = user;

        // 2. Authorization check: does the user have the required rights?
        if (requiredRights.length) {
          const userRights = roleRights.get(user.role) ?? [];
          const hasRequiredRights = requiredRights.every((right) =>
            userRights.includes(right),
          );
          if (!hasRequiredRights) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
          }
        }

        next();
      },
    )(req, res, next);
  };

export default auth;