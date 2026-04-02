import { describe, it, expect } from 'vitest';
import { validateManifest, validatePluginIndex } from '../src/index.js';

describe('Manifest Schema Validation', () => {
  describe('validateManifest', () => {
    it('should validate a complete manifest', () => {
      const manifest = {
        baseOverlay: {
          tool: 'claude',
          version: '1.0.0',
          installedAt: '2024-01-15T10:30:00Z',
          files: [
            { source: 'overlay/commands/test.md', destination: '.claude/commands/test.md', hash: 'abc123' },
          ],
        },
        plugins: {
          'my-plugin': {
            name: 'my-plugin',
            version: '1.0.0',
            installedAt: '2024-01-15T10:30:00Z',
            files: [
              { source: 'plugins/my-plugin/file.md', destination: '.claude/commands/custom/file.md', hash: 'def456' },
            ],
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.baseOverlay?.tool).toBe('claude');
      expect(result.plugins['my-plugin'].name).toBe('my-plugin');
    });

    it('should allow manifest without baseOverlay', () => {
      const manifest = {
        plugins: {
          'my-plugin': {
            name: 'my-plugin',
            version: '1.0.0',
            installedAt: '2024-01-15T10:30:00Z',
            files: [],
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.baseOverlay).toBeUndefined();
      expect(result.plugins['my-plugin']).toBeDefined();
    });

    it('should reject manifest with invalid tool', () => {
      const manifest = {
        baseOverlay: {
          tool: 'invalid-tool',
          version: '1.0.0',
          installedAt: '2024-01-15T10:30:00Z',
          files: [],
        },
        plugins: {},
      };

      expect(() => validateManifest(manifest)).toThrow();
    });

    it('should reject manifest with invalid date format', () => {
      const manifest = {
        baseOverlay: {
          tool: 'claude',
          version: '1.0.0',
          installedAt: 'not-a-date',
          files: [],
        },
        plugins: {},
      };

      expect(() => validateManifest(manifest)).toThrow();
    });

    it('should reject manifest with missing required fields', () => {
      const manifest = {
        baseOverlay: {
          tool: 'claude',
          // missing version
          installedAt: '2024-01-15T10:30:00Z',
          files: [],
        },
        plugins: {},
      };

      expect(() => validateManifest(manifest)).toThrow();
    });
  });

  describe('validatePluginIndex', () => {
    it('should validate a complete plugin index', () => {
      const index = {
        version: '1.0.0',
        plugins: [
          { name: 'plugin-1', version: '1.0.0', description: 'First plugin' },
          { name: 'plugin-2', version: '2.1.0', description: 'Second plugin', author: 'Test Author' },
        ],
      };

      const result = validatePluginIndex(index);
      expect(result.version).toBe('1.0.0');
      expect(result.plugins).toHaveLength(2);
      expect(result.plugins[0].name).toBe('plugin-1');
    });

    it('should allow optional fields in plugin entries', () => {
      const index = {
        version: '1.0.0',
        plugins: [
          { name: 'minimal-plugin', version: '1.0.0' },
        ],
      };

      const result = validatePluginIndex(index);
      expect(result.plugins[0].description).toBeUndefined();
      expect(result.plugins[0].author).toBeUndefined();
    });

    it('should validate plugin dependencies', () => {
      const index = {
        version: '1.0.0',
        plugins: [
          { name: 'plugin-with-deps', version: '1.0.0', dependencies: ['dep1', 'dep2'] },
        ],
      };

      const result = validatePluginIndex(index);
      expect(result.plugins[0].dependencies).toEqual(['dep1', 'dep2']);
    });

    it('should reject index without version', () => {
      const index = {
        plugins: [{ name: 'plugin', version: '1.0.0' }],
      };

      expect(() => validatePluginIndex(index)).toThrow();
    });

    it('should reject index without plugins array', () => {
      const index = {
        version: '1.0.0',
      };

      expect(() => validatePluginIndex(index)).toThrow();
    });

    it('should reject plugin without name', () => {
      const index = {
        version: '1.0.0',
        plugins: [{ version: '1.0.0' }],
      };

      expect(() => validatePluginIndex(index)).toThrow();
    });
  });
});