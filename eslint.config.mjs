import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config([
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["**/*.ts"]
    }, 
    {
        ignores: ["dist/*", "esbuild.js", ".vscode-test.mjs", ".eslint.config.mjs"]
    },
    {
        plugins: {
            "@typescript-eslint": typescriptEslint
        },
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module"
        },
        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
        }
    }
]);
