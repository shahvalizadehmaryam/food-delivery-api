import Joi from "joi";
import usLocations from "../utils/usLocations";

// First / last name: letters, spaces, apostrophes, hyphens; must start with a letter
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;

const dobSchema = Joi.string()
  .trim()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Reject invalid calendar dates (e.g. 2024-02-31)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return helpers.error("any.invalid");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      return helpers.message({
        custom: "dob cannot be in the future",
      });
    }

    const minDob = new Date(today);
    minDob.setFullYear(minDob.getFullYear() - 13);
    if (date > minDob) {
      return helpers.message({
        custom: "User must be at least 13 years old",
      });
    }

    return value;
  })
  .messages({
    "string.pattern.base": "dob must match YYYY-MM-DD",
    "any.invalid": "dob must be a valid date in YYYY-MM-DD format",
  });

const updateMyProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(NAME_PATTERN)
        .messages({
          "string.pattern.base":
            "name must start with a letter and contain only letters, spaces, apostrophes, or hyphens",
        }),
      lastname: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(NAME_PATTERN)
        .messages({
          "string.pattern.base":
            "lastname must start with a letter and contain only letters, spaces, apostrophes, or hyphens",
        }),
      state: Joi.string()
        .trim()
        .uppercase()
        .valid(...usLocations.US_STATE_CODES)
        .messages({
          "any.only": "state must be a valid US state code",
        }),
      city: Joi.string().trim().min(1),
      address: Joi.string().trim().min(5).max(120),
      dob: dobSchema,
    })
    .min(1)
    .custom((obj, helpers) => {
      // When city is updated, state must be sent so we can validate the pair
      if (obj.city !== undefined) {
        if (!obj.state) {
          return helpers.message({
            custom: "state is required when updating city",
          });
        }
        if (!usLocations.isValidCityForState(obj.state, obj.city)) {
          return helpers.message({
            custom: "city must be a valid city for the selected state",
          });
        }
      }
      return obj;
    }),
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
