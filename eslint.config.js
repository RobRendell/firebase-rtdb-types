import js from '@eslint/js'
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx,js}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser
        },
        plugins: {
            'simple-import-sort': eslintPluginSimpleImportSort
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": "error",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error"
        },
    },
)
