import express from "express";
import auth from "../../middlewares/auth";
import userController from "../../controllers/user.controller";
import validate from "../../middlewares/validate";
import userValidation from "../../validations/user.validation";

const router = express.Router();

router.get("/my-profile", auth(), userController.getMyProfile);

router.patch(
  "/my-profile",
  auth(),
  validate(userValidation.updateMyProfile),
  userController.updateMyProfile,
);

export default router;
