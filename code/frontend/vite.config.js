import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// vitest/config's defineConfig extends Vite's own with a validated `test` key, so this is the
// one config file for both dev/build and the test runner -- no separate vitest.config.js.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
  },
});
