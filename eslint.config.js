import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        // Only lint first-party source files; exclude vendored minified libraries.
        files: ["js/*.js"],
        ignores: [
            "js/tabulator.min.js",
            "js/luxon.min.js",
            "js/jsonpath-0.8.0.js",
        ],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                // Browser globals
                ...globals.browser,
                // Vendored globals loaded via <script> tags
                Tabulator: "readonly",
                luxon: "readonly",
                jsonPath: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-undef": "error",
            "no-console": "off",
            "eqeqeq": ["error", "always"],
            "no-var": "error",
            "prefer-const": "warn",
        },
    },
];
