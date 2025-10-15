/**
 * Shared ESLint configuration for the Luxury Heritage monorepo.
 */
export default {
  root: true,
  extends: ["next/core-web-vitals"],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: process.cwd()
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off"
  }
};
