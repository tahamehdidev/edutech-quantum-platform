// 03-security-architecture.md §0.1 -- the only way to create an instructor/admin account. Runs
// outside the HTTP application entirely, never exposed over the network. Usage:
//   npm run create-admin -- <email> <name> <instructor|admin>
import "dotenv/config";
import crypto from "node:crypto";
import { userRepository } from "../src/repositories/user.repository.js";
import { auditLogService } from "../src/services/auditLog.service.js";
import { hashPassword } from "../src/utils/hash.js";
import { normalizeEmail } from "../src/utils/normalizeEmail.js";

const [, , emailArg, nameArg, roleArg] = process.argv;

if (!emailArg || !nameArg || !roleArg) {
  console.error("Usage: npm run create-admin -- <email> <name> <instructor|admin>");
  process.exit(1);
}
if (!["instructor", "admin"].includes(roleArg)) {
  console.error(`Invalid role "${roleArg}" -- must be "instructor" or "admin".`);
  process.exit(1);
}

async function main() {
  const email = normalizeEmail(emailArg);
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new Error(`A user with email ${email} already exists.`);
  }

  // Same hashing config as the signup endpoint -- a mismatch here would create an account that
  // can't authenticate through the normal /auth/login flow (03-security-architecture.md §0.1).
  const generatedPassword = crypto.randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(generatedPassword);
  const user = await userRepository.create({ email, passwordHash, name: nameArg, role: roleArg });

  // This script has no controller to log through -- it writes its own audit entry directly, the
  // moment the account is created (03-security-architecture.md §8.4). user_id is the *newly
  // created* account, consistent with every other entry's meaning; the weaker, unverified signal
  // of who ran the script goes in metadata instead.
  await auditLogService.record({
    userId: user.id,
    action: "user.role_assigned_via_seed_script",
    resourceType: "User",
    resourceId: user.id,
    metadata: { assignedRole: roleArg, ranBy: process.env.USER ?? process.env.USERNAME ?? "unknown" },
  });

  console.log(`Created ${roleArg} account: ${email}`);
  console.log(`Generated password (shown once -- share out-of-band): ${generatedPassword}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
