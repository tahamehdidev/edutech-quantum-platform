// Explicit /vitest entrypoint (not the plain "@testing-library/jest-dom" import), since it hooks
// into Vitest's own expect rather than assuming a global `expect` -- this project doesn't enable
// vitest's `globals: true`, so test files import `test`/`expect` explicitly (App.test.jsx).
import "@testing-library/jest-dom/vitest";
