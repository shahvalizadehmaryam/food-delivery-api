import Joi from "joi";
const placeOrder = {
  body: Joi.object().keys({
    note: Joi.string().trim().max(500).allow("", null),
    // اگر آدرس را از پروفایل می‌خوانی، این فیلد اختیاری است
    deliveryAddress: Joi.string().trim().min(5).max(500),
  }),
};
const getMyOrder = {
  params: Joi.object().keys({
    orderId: Joi.number().integer().positive().required(),
  }),
};
const cancelMyOrder = {
  params: Joi.object().keys({
    orderId: Joi.number().integer().positive().required(),
  }),
};
const listMyOrders = {
  query: Joi.object().keys({
    status: Joi.string().valid(
      "PENDING_PAYMENT",
      "PLACED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELED",
    ),
  }),
};
const adminUpdateStatus = {
  params: Joi.object().keys({
    orderId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid("PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELED")
      .required(),
  }),
};
const listAllOrders = listMyOrders;

export default {
  placeOrder,
  getMyOrder,
  cancelMyOrder,
  listMyOrders,
  listAllOrders,
  adminUpdateStatus,
};