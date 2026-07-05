import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/auth.service.js";
import { env } from "../config/env.js";

// httpOnly/Secure/SameSite=Strict per 02-api-contract.md §2.1 -- never readable by client-side
// JS, never attached to a cross-site request. `secure` is conditioned on NODE_ENV rather than
// always true: a browser will refuse to store a Secure cookie at all over plain HTTP, which would
// silently break login/refresh during local dev (http://localhost, no TLS). Production always
// runs behind HTTPS (03-security-architecture.md §6.2), so this never weakens the production
// guarantee -- it only avoids breaking the non-HTTPS local/CI environment.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
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
