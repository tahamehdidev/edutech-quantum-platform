import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { UpdateProfileSchema } from "../validators/user.validator.js";
import { getMeController, updateMeController } from "../controllers/user.controller.js";

const router = Router();

router.get("/me", getMeController);
router.patch("/me", validateBody(UpdateProfileSchema), updateMeController);

export default router;
