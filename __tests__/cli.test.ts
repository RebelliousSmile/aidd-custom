import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');

vi.mock('fs');
vi.mock('child_process', () => ({
  execSync: vi.fn(() => ''),
}));

describe('CLI Logic Tests', () => {
  const mockFs = vi.mocked({ existsSync, readFileSync });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverlayConfig', () => {
    it('should fallback to default repo when no config', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const { getOverlayConfig, DEFAULT_OVERLAY_REPO } = await import('../src/config.js');
      const config = getOverlayConfig('/test/project');

      expect(config).toEqual({ repo: DEFAULT_OVERLAY_REPO, branch: 'main' });
    });

    it('should use global config if config.json exists', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        return typeof path === 'string' && path.endsWith('config.json');
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        overlay: { repo: 'project/repo', branch: 'dev' }
      }));

      const { getOverlayConfig } = await import('../src/config.js');
      const config = getOverlayConfig('/test/project');

      expect(config).toEqual({ repo: 'project/repo', branch: 'dev' });
    });

    it('should use global config if no project config', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('config.json')) return true;
        return false;
      });
      mockFs.readFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('config.json')) {
          return JSON.stringify({ overlay: { repo: 'global/repo', branch: 'master' } });
        }
        return '{}';
      });
      
      const { getOverlayConfig } = await import('../src/config.js');
      const config = getOverlayConfig('/test/project');
      
      expect(config).toEqual({ repo: 'global/repo', branch: 'master' });
    });
  });

  describe('getGlobalConfig', () => {
    it('should return null when no global config', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const { getGlobalConfig } = await import('../src/config.js');
      const config = getGlobalConfig();
      
      expect(config).toBeNull();
    });

    it('should parse global config', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        overlay: { repo: 'user/repo', branch: 'main' }
      }));
      
      const { getGlobalConfig } = await import('../src/config.js');
      const config = getGlobalConfig();
      
      expect(config).toEqual({ repo: 'user/repo', branch: 'main' });
    });
  });

  describe('DEFAULT_OVERLAY_REPO', () => {
    it('should have correct default value', async () => {
      const { DEFAULT_OVERLAY_REPO } = await import('../src/config.js');
      expect(DEFAULT_OVERLAY_REPO).toBe('RebelliousSmile/aidd-overlay');
    });
  });

  describe('hasFeature', () => {
    it('should return correct feature support', async () => {
      const { hasFeature } = await import('../src/index.js');

      expect(hasFeature('claude', 'commands')).toBe(true);
      expect(hasFeature('claude', 'agents')).toBe(true);
      expect(hasFeature('claude', 'skills')).toBe(true);

      expect(hasFeature('copilot', 'commands')).toBe(false);
      expect(hasFeature('copilot', 'agents')).toBe(false);
      expect(hasFeature('copilot', 'rules')).toBe(true);

      expect(hasFeature('cursor', 'agents')).toBe(false);
      expect(hasFeature('cursor', 'skills')).toBe(false);
    });
  });

  describe('getInstructionsFileName / getInstructionsPath', () => {
    it('should return instructions file names for all tools', async () => {
      const { getInstructionsFileName } = await import('../src/index.js');
      expect(getInstructionsFileName('claude')).toBe('CLAUDE.md');
      expect(getInstructionsFileName('opencode')).toBe('AGENTS.md');
      expect(getInstructionsFileName('copilot')).toBe('copilot-instructions.md');
      expect(getInstructionsFileName('cursor')).toBe('.mdc');
    });

    it('should return instructions paths for all tools', async () => {
      const { getInstructionsPath } = await import('../src/index.js');
      expect(getInstructionsPath('claude')).toBeNull();
      expect(getInstructionsPath('cursor')).toBe('.cursor/rules');
      expect(getInstructionsPath('copilot')).toBe('.github');
    });
  });

  describe('convertRuleToMdc', () => {
    it('should add frontmatter to rule without frontmatter', async () => {
      const { convertRuleToMdc } = await import('../src/index.js');
      
      const input = '# Coding Standards\n\nAlways use TypeScript.';
      const result = convertRuleToMdc(input, 'coding-standards.md');
      
      expect(result).toContain('---');
      expect(result).toContain('description:');
      expect(result).toContain('# Coding Standards');
    });

    it('should not modify rule with existing frontmatter', async () => {
      const { convertRuleToMdc } = await import('../src/index.js');
      
      const input = '---\ndescription: Custom\n---\n# Already has frontmatter';
      const result = convertRuleToMdc(input, 'test.md');
      
      expect(result).toBe(input);
    });
  });

  describe('convertCommandToPrompt', () => {
    it('should convert command to prompt format', async () => {
      const { convertCommandToPrompt } = await import('../src/index.js');
      
      const input = `---
name: code-review
description: Effectue une revue de code
---
Faites une revue de code complète.`;
      
      const result = convertCommandToPrompt(input, 'code-review.md');
      
      expect(result).toContain('# code review');
      expect(result).toContain('Description');
      expect(result).toContain('Effectue une revue de code');
      expect(result).toContain('Instructions');
    });
  });

  describe('convertRulesToCopilotInstructions', () => {
    it('should convert rules to copilot format with frontmatter', async () => {
      const { convertRulesToCopilotInstructions } = await import('../src/index.js');
      
      const input = '# Best Practices\n\nAlways use async/await.';
      const result = convertRulesToCopilotInstructions(input, 'best-practices.md');
      
      expect(result).toContain('---');
      expect(result).toContain('applyTo:');
      expect(result).toContain('# Best Practices');
    });
  });
});