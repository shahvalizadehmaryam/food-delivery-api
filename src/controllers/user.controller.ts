import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import userService from "../services/user.service";
import ApiError from "../utils/ApiError";

const getMyProfile = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;

  const user = await userService.getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  res.send(user);
});

const updateMyProfile = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const { dob, ...rest } = req.body;
  const data = {
    ...rest,
    ...(dob !== undefined ? { dob: new Date(dob) } : {}),
  };
  const user = await userService.updateUserById(userId, data);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  res.send(users);
});

const blockUser = catchAsync(async (req, res) => {
  const userId = Number(req.params.id);
  const currentUserId = (req.user as { id: number }).id;

  if (userId === currentUserId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot block your own account",
    );
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.isBlocked) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User is already blocked");
  }

  const blockedUser = await userService.blockUserById(userId);
  res.send(blockedUser);
});

const updateUserById = catchAsync(async (req, res) => {
  const userId = Number(req.params.id);
  const currentUserId = (req.user as { id: number }).id;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  // Optional safety: prevent admin from changing their own role/block status
  if (
    userId === currentUserId &&
    (req.body.role || req.body.isBlocked !== undefined)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot change your own role or block status",
    );
  }
  const updatedUser = await userService.updateUserById(userId, req.body);
  res.send(updatedUser);
});

export default {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  blockUser,
  updateUserById,
};
