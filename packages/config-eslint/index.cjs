module.exports = {
  extends: ["next", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksConditionals: true,
        checksVoidReturn: false,
      },
    ],
    "@typescript-eslint/no-floating-promises": "error",
  },
};
