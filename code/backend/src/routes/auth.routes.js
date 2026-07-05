import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { SignupSchema, LoginSchema } from "../validators/auth.validator.js";
import {
  signupIpLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  logoutAccountLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  signupController,
  loginController,
  refreshController,
  logoutController,
  logoutAllController,
} from "../controllers/auth.controller.js";

const router = Router();

// Rate limiters run first among route-specific middleware (03-security-architecture.md §3.5).
router.post("/signup", signupIpLimiter, validateBody(SignupSchema), signupController);
router.post(
  "/login",
  loginIpLimiter,
  loginAccountLimiter,
  validateBody(LoginSchema),
  loginController
);
// Deliberately unthrottled -- the valid-token requirement is considered sufficient (§4.2).
router.post("/refresh", refreshController);
router.post("/logout", logoutAccountLimiter, logoutController);
router.post("/logout-all", logoutAccountLimiter, logoutAllController);

export default router;
