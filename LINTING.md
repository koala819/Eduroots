# ESLint Configuration for Eduroots

This project uses ESLint as the sole linting and code formatting tool, with a modern configuration based on ESLint's "flat config" format.

## Features

- Uses ESLint's flat configuration format (eslint.config.js)
- Strict rules for code formatting and quality
- Full TypeScript support
- Detection of unused imports
- Next.js-specific rules

## Available Commands

```bash
# Run ESLint to check the code
pnpm lint

# Run ESLint and automatically fix problems
pnpm lint:fix
```

## Main Style Rules

- Single quotes
- No semicolons
- 2-space indentation
- Trailing commas in multiline lists
- 100-character line length limit
- Consistent spacing in objects and arrays

## Recommended VS Code Extension

For a better development experience, install the ESLint extension for VS Code and configure it to automatically fix issues on save:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## Disabling ESLint for a Specific Line

If necessary, you can disable ESLint for a specific line:

```typescript
// eslint-disable-next-line
const foo = 'bar'
```

Or for a specific rule:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getUnknownData()
```
