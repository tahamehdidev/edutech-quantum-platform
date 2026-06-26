import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: { import: importPlugin },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "warn",
    },
  },

  // --- Layering enforcement (04-application-architecture.md Section 1) ---
  // Controllers and middleware must never import a repository directly.
  // Everything must go through a service. No exceptions, mechanically enforced.
  {
    files: ["src/controllers/**/*.js", "src/middleware/**/*.js"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: ["src/controllers", "src/middleware"],
              from: ["src/repositories"],
              message:
                "Controllers and middleware must not import repositories directly — call a service instead (04-application-architecture.md Section 1).",
            },
          ],
        },
      ],
    },
  },

  // Repositories must never import a service or controller (the dependency only
  // ever flows one direction: controller -> service -> repository).
  {
    files: ["src/repositories/**/*.js"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: ["src/repositories"],
              from: ["src/services", "src/controllers"],
              message:
                "Repositories must not import services or controllers — dependencies only flow controller -> service -> repository.",
            },
          ],
        },
      ],
    },
  },
];
