import Joi from "joi";

const createCheckoutSession = {
  body: Joi.object().keys({
    note: Joi.string().trim().max(500).allow("", null),
    deliveryAddress: Joi.string().trim().min(5).max(500),
    method: Joi.string().valid("card", "crypto").default("card"),
  }),
};

const syncOrderPayment = {
  params: Joi.object().keys({
    orderId: Joi.number().integer().positive().required(),
  }),
};

export default {
  createCheckoutSession,
  syncOrderPayment,
};
