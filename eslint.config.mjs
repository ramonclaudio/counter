import convexPlugin from "@convex-dev/eslint-plugin";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["convex/_generated/**", "ios/**", "dist/**", ".expo/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-compiler": reactCompiler },
    rules: { "react-compiler/react-compiler": "error" },
  },
  ...convexPlugin.configs.recommended,
  {
    files: ["convex/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
