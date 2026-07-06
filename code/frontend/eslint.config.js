import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"], // React 17+ JSX transform -- no `import React` needed per file
  prettierConfig,
  {
    files: ["**/*.{js,jsx}"],
    // react is already registered by react.configs.flat.recommended above -- only react-hooks
    // needs registering here, since no extended config provides it.
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      // The full standard browser global set (window, document, fetch, HTMLDialogElement,
      // Event, etc.) -- a hand-maintained list kept growing one API at a time as new code
      // needed it (console, then HTMLDialogElement, then Event); this is the actual fix.
      globals: globals.browser,
    },
    rules: {
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
