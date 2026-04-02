---
name: agents
description: AI agent configuration and guidelines
---

# AGENTS.md

> IMPORTANT: On first conversation message:
>
> - say "AI-Driven Development ON - Date: {current_date}, TZ: {current_timezone}." to User.

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Watch mode - recompile on changes |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npx vitest run __tests__/tool-detection.test.ts` | Run single test file |

## Behavior Guidelines

All instructions and information above are willing to be up to date, but always remind yourself that USER can be wrong, be critical of the information provided, and verify it against the project's actual state.

- Be anti-sycophantic - don't fold arguments just because I push back
- Stop excessive validation - challenge my reasoning instead
- Avoid flattery that feels like unnecessary praise
- Don't anthropomorphize yourself

### Answering Guidelines

- Don't assume your knowledge is up to date.
- Be 100% sure of your answers.
- If unsure, say "I don't know" or ask for clarification.
- Never say "you are right!", prefer anticipating mistakes.

## Code Style Guidelines

### Imports

- Use ESM imports (`import { x } from 'module'`) - this project uses `"type": "module"` in package.json
- **Never use `require()`** - it doesn't work in ESM context
- Group imports: external first, then internal
- Use file extension `.js` for local imports (e.g., `./index.js`)

### Types

- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use `zod` for runtime validation schemas (already a dependency)

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `tool-detection.ts` |
| Functions | camelCase | `detectTool()` |
| Types/Interfaces | PascalCase | `ToolType` |
| Constants | SCREAMING_SNAKE_CASE | `TOOL_DIRECTORIES` |
| Enums | PascalCase | `ToolType = 'claude' \| 'copilot'` |

### Functions

- Use explicit return types for exported functions
- Use `try/catch` for filesystem operations that may throw
- Keep functions small and focused

### Error Handling

- Use `console.error()` for errors, `console.log()` for info
- Use `process.exit(1)` for fatal errors that should stop execution
- Provide meaningful error messages

### Code Organization

```typescript
// 1. Imports
import { z } from 'zod';
import { existsSync } from 'fs';
import { join } from 'path';

// 2. Type definitions
export type ToolType = 'claude' | 'copilot' | 'cursor' | 'opencode';

// 3. Constants
export const TOOL_DIRECTORIES: Record<ToolType, string[]> = {};

// 4. Functions
export function detectTool(basePath: string): ToolType | null {
  // ...
}
```

### Comments

- Use JSDoc for exported functions
- Keep comments concise
- Don't state the obvious

### Testing

- Tests are in `__tests__/` directory
- Use vitest framework
- Follow naming: `filename.test.ts`

## Memory Management

### Project memory

<aidd_project_memory>
</aidd_project_memory>

- If memory is not loaded above: run `ls -1tr aidd_docs/memory/` then read each file
- If needed: load files from `aidd_docs/memory/external/*` when user request it
- If needed: load files from `aidd_docs/memory/internal/*`, you have to think about it

## Project Structure

```
aidd-custom/
├── src/
│   ├── index.ts      # Core logic (detection, validation, schemas)
│   └── cli.ts        # CLI commands
├── __tests__/        # Test files
├── dist/             # Compiled JavaScript
├── .aidd/            # AIDD configuration
│   └── config.json   # Overlay configuration
└── opencode.json     # OpenCode configuration
```

## Key Dependencies

- `commander` - CLI framework
- `zod` - Schema validation
- `vitest` - Testing framework
- `typescript` - Language
