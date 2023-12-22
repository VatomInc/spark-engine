module.exports = {
	"env": {
		"browser": true,
		"es2021": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": 12,
		"sourceType": "module"
	},
	"settings": {
		"react": {
			"version": "detect"
		}
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		// TypeScript makes this redundant
		"react/prop-types": 0,

		"@typescript-eslint/no-explicit-any": 0,
		"@typescript-eslint/explicit-module-boundary-types": 0,
		"max-len": [1, { "code": 120 }],
		"@typescript-eslint/no-inferrable-types": 0,
	}
};
