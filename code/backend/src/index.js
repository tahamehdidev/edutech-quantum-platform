import { app } from "./app.js";
import { env } from "./config/env.js";
import { initDummyHash } from "./utils/hash.js";
import { initSentry } from "./utils/sentry.js";

initSentry();

// Must succeed before the server starts accepting connections (03-security-architecture.md
// §1.2) -- if computing the dummy hash fails, the server must fail to start entirely rather than
// silently skip the timing-safety measure it backs. An unhandled rejection here at the top level
// of an ES module crashes the process, which is the desired behavior.
await initDummyHash();

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
});
