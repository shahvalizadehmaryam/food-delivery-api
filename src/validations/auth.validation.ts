import Joi from "joi";
import usLocations from "../utils/usLocations";

// First / last name: letters, spaces, apostrophes, hyphens; must start with a letter
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;

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

const register = {
  body: Joi.object().keys({
    // Phone + OTP from previous verify step
    phone: Joi.string()
      .pattern(/^[2-9]\d{9}$/)
      .required(),
    code: Joi.string().length(5).required(),

    // First name: trimmed, 2–50 chars, letters (+ spaces/'/-), starts with a letter
    name: Joi.string().trim().min(2).max(50).pattern(NAME_PATTERN).required().messages({
      "string.pattern.base":
        "name must start with a letter and contain only letters, spaces, apostrophes, or hyphens",
    }),

    // Last name: same rules as first name
    lastname: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(NAME_PATTERN)
      .required()
      .messages({
        "string.pattern.base":
          "lastname must start with a letter and contain only letters, spaces, apostrophes, or hyphens",
      }),

    // State: must be a valid US state code (e.g. "CA")
    state: Joi.string()
      .trim()
      .uppercase()
      .valid(...usLocations.US_STATE_CODES)
      .required()
      .messages({
        "any.only": "state must be a valid US state code",
      }),

    // City: required and must belong to the selected state
    city: Joi.string()
      .trim()
      .min(1)
      .required()
      .custom((value, helpers) => {
        const state = helpers.state.ancestors[0]?.state as string | undefined;
        if (!state || !usLocations.isValidCityForState(state, value)) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.invalid": "city must be a valid city for the selected state",
      }),

    // Address: trimmed, 5–120 characters
    address: Joi.string().trim().min(5).max(120).required(),

    // DOB: YYYY-MM-DD, not in the future, user must be at least 13
    dob: Joi.string()
      .trim()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
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

        // Cannot be in the future
        if (date > today) {
          return helpers.message({
            custom: "dob cannot be in the future",
          });
        }

        // Must be at least 13 years old
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
      }),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export default {
  sendOtp,
  verifyOtp,
  register,
  logout,
  refreshTokens,
};
