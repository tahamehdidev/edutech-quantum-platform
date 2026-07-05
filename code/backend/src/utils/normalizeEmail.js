// One shared rule, used everywhere an email is a lookup or rate-limit key (signup dup-check,
// login lookup, login rate-limiter key) -- 03-security-architecture.md §1.4. Without this in
// exactly one place, the DB's UNIQUE constraint and the rate limiter's key could disagree about
// whether "Attacker@x.com" and "attacker@x.com" are the same account.
export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
