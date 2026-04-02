import { describe, it, expect } from 'vitest';
import {
  transformPath,
  getToolCustomDir,
  PATH_TRANSFORMATIONS,
  ToolType,
} from '../src/index.js';

describe('Path Transformation', () => {
  describe('transformPath', () => {
    it('should transform overlay paths to .claude for Claude tool', () => {
      expect(transformPath('overlay/commands/test.md', 'claude')).toBe('.claude/commands/test.md');
      expect(transformPath('overlay/rules/test.md', 'claude')).toBe('.claude/rules/test.md');
    });

    it('should transform overlay paths to .github for Copilot tool', () => {
      expect(transformPath('overlay/commands/test.md', 'copilot')).toBe('.github/commands/test.md');
      expect(transformPath('overlay/rules/test.md', 'copilot')).toBe('.github/rules/test.md');
    });

    it('should transform overlay paths to .cursor for Cursor tool', () => {
      expect(transformPath('overlay/commands/test.md', 'cursor')).toBe('.cursor/commands/test.md');
      expect(transformPath('overlay/rules/test.md', 'cursor')).toBe('.cursor/rules/test.md');
    });

    it('should keep overlay paths for OpenCode tool', () => {
      expect(transformPath('overlay/commands/test.md', 'opencode')).toBe('overlay/commands/test.md');
      expect(transformPath('overlay/rules/test.md', 'opencode')).toBe('overlay/rules/test.md');
    });
  });

  describe('getToolCustomDir', () => {
    it('should return correct custom directory for Claude', () => {
      expect(getToolCustomDir('claude')).toBe('.claude/commands/custom');
    });

    it('should return correct custom directory for Copilot', () => {
      expect(getToolCustomDir('copilot')).toBe('.github/commands');
    });

    it('should return correct custom directory for Cursor', () => {
      expect(getToolCustomDir('cursor')).toBe('.cursor/commands');
    });

    it('should return correct custom directory for OpenCode', () => {
      expect(getToolCustomDir('opencode')).toBe('.opencode/commands');
    });
  });

  describe('PATH_TRANSFORMATIONS', () => {
    it('should have transformers for all tool types', () => {
      const tools: ToolType[] = ['claude', 'copilot', 'cursor', 'opencode'];
      tools.forEach((tool) => {
        expect(PATH_TRANSFORMATIONS[tool]).toBeDefined();
        expect(typeof PATH_TRANSFORMATIONS[tool]).toBe('function');
      });
    });

    it('should correctly transform all example paths for Claude', () => {
      const transformer = PATH_TRANSFORMATIONS.claude;
      expect(transformer('overlay/agents/test.md')).toBe('.claude/agents/test.md');
      expect(transformer('overlay/rules/test.md')).toBe('.claude/rules/test.md');
      expect(transformer('overlay/skills/test.md')).toBe('.claude/skills/test.md');
    });
  });
});
