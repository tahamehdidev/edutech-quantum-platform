import { userRepository } from "../repositories/user.repository.js";
import { NotFoundError } from "../errors/index.js";

// password_hash is never returned in any response, from any endpoint (02-api-contract.md §2.3) --
// this is the one shape every caller (including auth.service.js) converts a raw User row through
// before it reaches a controller.
export function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async function getById(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError("User not found.");
  return toPublicUser(user);
}

async function updateProfile(id, { name }) {
  const user = await userRepository.updateName(id, name);
  if (!user) throw new NotFoundError("User not found.");
  return toPublicUser(user);
}

// toPublicUser is deliberately not included here -- every caller (auth.service.js) imports the
// named export directly, so exposing it a second way via this object would just be dead surface.
export const userService = { getById, updateProfile };
