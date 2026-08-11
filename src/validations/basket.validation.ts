import Joi from "joi";

const basketId = Joi.string().trim().min(10).required();

const createBasket = {
  body: Joi.object().keys({}),
};

const getBasket = {
  params: Joi.object().keys({
    basketId,
  }),
};

const addItem = {
  params: Joi.object().keys({
    basketId,
  }),
  body: Joi.object().keys({
    productId: Joi.number().integer().positive().required(),
    sizeId: Joi.string().trim().required(),
    quantity: Joi.number().integer().min(1).default(1),
  }),
};

const addItemMe = {
  body: Joi.object().keys({
    productId: Joi.number().integer().positive().required(),
    sizeId: Joi.string().trim().required(),
    quantity: Joi.number().integer().min(1).default(1),
  }),
};

const updateItem = {
  params: Joi.object().keys({
    basketId,
    itemId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object().keys({
    quantity: Joi.number().integer().min(1).required(),
  }),
};

const updateItemMe = {
  params: Joi.object().keys({
    itemId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object().keys({
    quantity: Joi.number().integer().min(1).required(),
  }),
};

const removeItem = {
  params: Joi.object().keys({
    basketId,
    itemId: Joi.number().integer().positive().required(),
  }),
};

const removeItemMe = {
  params: Joi.object().keys({
    itemId: Joi.number().integer().positive().required(),
  }),
};

const merge = {
  body: Joi.object().keys({
    guestBasketId: basketId,
  }),
};

export default {
  createBasket,
  getBasket,
  addItem,
  addItemMe,
  updateItem,
  updateItemMe,
  removeItem,
  removeItemMe,
  merge,
};