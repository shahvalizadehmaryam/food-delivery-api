import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(30)
      .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    STRIPE_SECRET_KEY: Joi.string()
      .optional()
      .allow('')
      .description('Stripe secret key (sk_test_...)'),
    STRIPE_WEBHOOK_SECRET: Joi.string()
      .optional()
      .allow('')
      .description('Stripe webhook signing secret (whsec_...)'),
    STRIPE_SUCCESS_URL: Joi.string()
      .optional()
      .allow('')
      .description('Frontend URL after successful Stripe Checkout'),
    STRIPE_CANCEL_URL: Joi.string()
      .optional()
      .allow('')
      .description('Frontend URL after canceled Stripe Checkout'),
    STRIPE_CURRENCY: Joi.string()
      .optional()
      .default('usd')
      .description('Stripe charge currency'),
    COINGATE_API_TOKEN: Joi.string()
      .optional()
      .allow('')
      .description('CoinGate API token'),
    COINGATE_API_URL: Joi.string()
      .optional()
      .allow('')
      .default('https://api-sandbox.coingate.com/v2')
      .description('CoinGate API base URL (sandbox or live)'),
    COINGATE_CALLBACK_URL: Joi.string()
      .optional()
      .allow('')
      .description('Public URL CoinGate will POST payment callbacks to'),
    COINGATE_SUCCESS_URL: Joi.string()
      .optional()
      .allow('')
      .description('Frontend URL after successful CoinGate payment'),
    COINGATE_CANCEL_URL: Joi.string()
      .optional()
      .allow('')
      .description('Frontend URL after canceled CoinGate payment'),
    COINGATE_RECEIVE_CURRENCY: Joi.string()
      .optional()
      .default('USD')
      .description('Settlement currency for CoinGate payouts')
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD
      }
    },
    from: envVars.EMAIL_FROM
  },
  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    successUrl: envVars.STRIPE_SUCCESS_URL,
    cancelUrl: envVars.STRIPE_CANCEL_URL,
    currency: envVars.STRIPE_CURRENCY
  },
  coingate: {
    apiToken: envVars.COINGATE_API_TOKEN,
    apiUrl: envVars.COINGATE_API_URL,
    callbackUrl: envVars.COINGATE_CALLBACK_URL,
    successUrl: envVars.COINGATE_SUCCESS_URL,
    cancelUrl: envVars.COINGATE_CANCEL_URL,
    receiveCurrency: envVars.COINGATE_RECEIVE_CURRENCY
  }
};
