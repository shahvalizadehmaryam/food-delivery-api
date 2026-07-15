import Joi from "joi";

const updateMyProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(50),
    })
    .min(1), // at least one field must be sent
};

const blockUser = {
  params: Joi.object().keys({
    id: Joi.number().integer().positive().required(),
  }),
};

// update user by id only for admin
const updateUserById = {
  params: Joi.object().keys({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(50),
      role: Joi.string().valid("USER", "ADMIN"),
      isBlocked: Joi.boolean(),
    })
    .min(1),
};

export default { updateMyProfile, blockUser, updateUserById };
