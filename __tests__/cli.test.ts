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
      
      const { getOverlayConfig } = await import('../src/config.js');
      const config = getOverlayConfig('/test/project');
      
      expect(config).toEqual({ repo: 'RebelliousSmile/aidd-claude-custom', branch: 'main' });
    });

    it('should use project config if exists', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        return typeof path === 'string' && path.includes('config/global.json');
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
      expect(DEFAULT_OVERLAY_REPO).toBe('RebelliousSmile/aidd-claude-custom');
    });
  });
});