import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/*.d.ts", "**/generated/"],
  },
  ...compat.extends("prettier"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "@next/next/no-img-element": "off",
    },
  },
];
