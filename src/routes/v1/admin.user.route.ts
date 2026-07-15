import express from "express";
import auth from "../../middlewares/auth";
import userController from "../../controllers/user.controller";
import validate from "../../middlewares/validate";
import userValidation from "../../validations/user.validation";

const router = express.Router();

router.get("/", auth("getUsers"), userController.getAllUsers);

router.patch(
  "/:id/block",
  auth("manageUsers"),
  validate(userValidation.blockUser),
  userController.blockUser,
);

router.patch(
  "/:id",
  auth("manageUsers"),
  validate(userValidation.updateUserById),
  userController.updateUserById,
);

export default router;
