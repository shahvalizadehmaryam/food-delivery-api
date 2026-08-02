import Joi from "joi";

const discountType = Joi.string().valid("percentage", "fixed");

const discountValueForType = Joi.when("discountType", {
  is: "percentage",
  then: Joi.number().greater(0).max(100).required(),
  otherwise: Joi.number().greater(0).required(),
});

/**
 * Create a flash deal.
 * Either `durationHours` OR `endsAt` is required.
 * `startsAt` defaults to "now" on the server if omitted.
 */
const createFlashDeal = {
  body: Joi.object()
    .keys({
      menuItemId: Joi.number().integer().positive().required(),
      sizeId: Joi.string().trim().valid("small", "medium", "large").allow(null),
      discountType: discountType.required(),
      discountValue: discountValueForType,
      startsAt: Joi.date().iso(),
      endsAt: Joi.date().iso(),
      durationHours: Joi.number().positive().max(168), // max 7 days
    })
    .xor("endsAt", "durationHours")
    .messages({
      "object.xor": "Provide either endsAt or durationHours, not both",
    }),
};

const getFlashDeal = {
  params: Joi.object().keys({
    id: Joi.number().integer().positive().required(),
  }),
};

const updateFlashDeal = {
  params: Joi.object().keys({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object()
    .keys({
      sizeId: Joi.string().trim().valid("small", "medium", "large").allow(null),
      discountType: discountType,
      discountValue: Joi.number().greater(0),
      startsAt: Joi.date().iso(),
      endsAt: Joi.date().iso(),
      isActive: Joi.boolean(),
    })
    .min(1)
    .with("discountValue", "discountType")
    .custom((obj, helpers) => {
      if (obj.discountType === "percentage" && obj.discountValue > 100) {
        return helpers.message({
          custom: "percentage discountValue cannot exceed 100",
        });
      }
      if (obj.startsAt && obj.endsAt && new Date(obj.endsAt) <= new Date(obj.startsAt)) {
        return helpers.message({
          custom: "endsAt must be after startsAt",
        });
      }
      return obj;
    }),
};

const deleteFlashDeal = {
  params: Joi.object().keys({
    id: Joi.number().integer().positive().required(),
  }),
};

export default {
  createFlashDeal,
  getFlashDeal,
  updateFlashDeal,
  deleteFlashDeal,
};
