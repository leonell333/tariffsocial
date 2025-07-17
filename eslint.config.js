import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import babelParser from '@babel/eslint-parser'
import react from 'eslint-plugin-react'

export default [
    {
        ignores: ['dist']
    },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            parser: babelParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                requireConfigFile: false, // important
                babelOptions: {
                    presets: ['@babel/preset-react'], // ✅ Enables JSX parsing
                },
            },
            globals: globals.browser,
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'unused-imports': unusedImports,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,

            'no-unused-vars': ['warn', {varsIgnorePattern: '^[A-Z_]'}],
            'react-refresh/only-export-components': [
                'warn',
                {allowConstantExport: true},
            ],
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'no-async-promise-executor': 'off',
            'react/no-unknown-property': 'off'
        },
    },

    {
        "settings": {
            "react": {
                "version": "detect"
            }
        }
    }
]
