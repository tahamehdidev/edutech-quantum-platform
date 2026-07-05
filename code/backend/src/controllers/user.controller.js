import { asyncHandler } from "../utils/asyncHandler.js";
import { userService } from "../services/user.service.js";

export const getMeController = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);
  res.status(200).json({ user });
});

export const updateMeController = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.validatedBody);
  res.status(200).json({ user });
});
