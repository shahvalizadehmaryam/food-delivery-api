import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import morgan from './config/morgan';
import xss from './middlewares/xss';
import { jwtStrategy } from './config/passport';
import { authLimiter } from './middlewares/rateLimiter';
import routes from './routes/v1/index.js';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';
import paymentController from './controllers/payment.controller';

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(
  helmet(
    config.env === 'development'
      ? { contentSecurityPolicy: false }
      : {}
  )
);

// Stripe webhook needs the raw body for signature verification.
app.post(
  '/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('/{*splat}', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// health / welcome (avoids scary 404 when opening http://localhost:PORT/)
app.get('/', (_req, res) => {
  res.status(httpStatus.OK).send({
    message: 'Order Food API is running',
    docs: config.env === 'development' ? '/v1/docs' : undefined,
  });
});

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
