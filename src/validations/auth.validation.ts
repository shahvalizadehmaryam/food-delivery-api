import Joi from "joi";

const sendOtp = {
  body: Joi.object().keys({
    phone: Joi.string()
      .pattern(/^[2-9]\d{9}$/)
      .required(),
  }),
};
const verifyOtp = {
  body: Joi.object().keys({
    phone: Joi.string()
      .pattern(/^[2-9]\d{9}$/)
      .required(),
    code: Joi.string().length(5).required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export default {
  sendOtp,
  verifyOtp,
  logout,
};
