import { describe, it, expect } from 'vitest';
import { parseCommandFrontmatter } from '../src/index.js';
describe('Command Frontmatter Parsing', () => {
    it('should parse valid install.md frontmatter', () => {
        const content = `---
name: 'aidd:overlay:install'
description: 'Install base overlay and list available plugins'
argument-hint: '[--no-overlay] [--plugins-only]'
---

# Overlay Install`;
        const result = parseCommandFrontmatter(content);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('aidd:overlay:install');
        expect(result?.description).toBe('Install base overlay and list available plugins');
        expect(result?.argumentHint).toBe('[--no-overlay] [--plugins-only]');
    });
    it('should parse valid plugin/list.md frontmatter', () => {
        const content = `---
name: 'aidd:overlay:plugin:list'
description: 'List available optional plugins from the repository'
---

# Overlay Plugin List`;
        const result = parseCommandFrontmatter(content);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('aidd:overlay:plugin:list');
        expect(result?.description).toBe('List available optional plugins from the repository');
        expect(result?.argumentHint).toBeUndefined();
    });
    it('should parse valid plugin/add.md frontmatter with argument hint', () => {
        const content = `---
name: 'aidd:overlay:plugin:add'
description: 'Install a specific optional plugin'
argument-hint: '<plugin-name>'
---

# Overlay Plugin Add`;
        const result = parseCommandFrontmatter(content);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('aidd:overlay:plugin:add');
        expect(result?.argumentHint).toBe('<plugin-name>');
    });
    it('should return null for content without frontmatter', () => {
        const content = `# Just a heading

Some content`;
        const result = parseCommandFrontmatter(content);
        expect(result).toBeNull();
    });
    it('should return null for invalid command name', () => {
        const content = `---
name: 'invalid-name'
description: 'Test command'
---

# Test`;
        const result = parseCommandFrontmatter(content);
        expect(result).toBeNull();
    });
    it('should reject empty description', () => {
        const content = `---
name: 'aidd:overlay:test'
description: ''
---

# Test`;
        const result = parseCommandFrontmatter(content);
        expect(result).toBeNull();
    });
    it('should handle frontmatter with double quotes', () => {
        const content = `---
name: "aidd:overlay:update"
description: "Check for and apply overlay and plugin updates"
argument-hint: "[--dry-run] [--plugin <name>]"
---

# Overlay Update`;
        const result = parseCommandFrontmatter(content);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('aidd:overlay:update');
        expect(result?.description).toBe('Check for and apply overlay and plugin updates');
    });
});
//# sourceMappingURL=command-metadata.test.js.map