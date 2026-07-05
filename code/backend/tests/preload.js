// Loaded via `node --test --import ./tests/preload.js` (see package.json's "test" script) --
// must set NODE_ENV before any test file imports src/config/env.js, so env.js resolves
// TEST_DATABASE_URL instead of DATABASE_URL for the whole test run (unit and integration alike).
process.env.NODE_ENV = "test";

// Separate, deliberately unusual flag (not just NODE_ENV=test) that disables rate limiting in
// rateLimit.middleware.js. Requiring two independent env vars to diverge from production
// behavior means a single misconfigured NODE_ENV can never silently weaken rate limiting in a
// real deployment -- both would have to be set wrong at once.
process.env.RATE_LIMIT_TEST_MODE = "1";
