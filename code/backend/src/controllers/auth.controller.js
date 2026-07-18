import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/auth.service.js";
import { env } from "../config/env.js";

// httpOnly always; Secure and SameSite are both conditioned on NODE_ENV (02-api-contract.md
// §2.1, 03-security-architecture.md §2.3). Locally the frontend and backend share `localhost`
// (same site), so "strict" is the tightest setting that still works, and `secure` must stay
// false there since a browser refuses to store a Secure cookie at all over plain HTTP. In
// production the deployed frontend (Vercel) and backend (Render) sit on different top-level
// domains -- every request between them is cross-site, and a "strict" cookie is never sent
// cross-site at all, which would silently break refresh/logout/reload-session-restore. "none"
// is required for a cross-origin deploy, which in turn requires `secure: true` (browsers reject
// SameSite=None without it) -- already true in production since Render/Vercel both serve HTTPS.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "strict",
};

export const signupController = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.validatedBody);
  res.status(201).json({ user });
});

export const loginController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.validatedBody);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ user, accessToken });
});

export const refreshController = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.refresh(req.cookies.refreshToken);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ accessToken });
});

export const logoutController = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies.refreshToken);
  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  res.status(200).end();
});

export const logoutAllController = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  res.status(200).end();
});
