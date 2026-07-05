import { userRepository } from "../../src/repositories/user.repository.js";
import { refreshTokenService } from "../../src/services/refreshToken.service.js";
import { hashPassword } from "../../src/utils/hash.js";

// Only `learner` accounts can be created through the public signup flow (02-api-contract.md
// §2.1) -- instructor/admin accounts are only ever created via scripts/create-admin.js
// (03-security-architecture.md §0.1), which has no HTTP surface to drive from a supertest
// request. Integration tests that need an instructor/admin identity go straight through the
// repository + refreshTokenService instead, mirroring what create-admin.js itself does.
let counter = 0;

export async function createUserWithToken({ role = "learner", email, name } = {}) {
  counter += 1;
  const finalEmail = email ?? `test-user-${counter}-${Date.now()}@example.com`;
  const passwordHash = await hashPassword("irrelevant-password-123");
  const user = await userRepository.create({
    email: finalEmail,
    passwordHash,
    name: name ?? "Test User",
    role,
  });
  const { accessToken } = await refreshTokenService.issue({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  return { user, accessToken };
}
