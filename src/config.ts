import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGE_ROOT = join(__dirname, '..');
const GLOBAL_CONFIG_FILE = join(PACKAGE_ROOT, 'config.json');

export const DEFAULT_OVERLAY_REPO = 'RebelliousSmile/aidd-claude-custom';

export function getGlobalConfig(): { repo: string; branch: string } | null {
  if (existsSync(GLOBAL_CONFIG_FILE)) {
    try {
      const content = readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      if (config.overlay?.repo) {
        return {
          repo: config.overlay.repo,
          branch: config.overlay.branch || 'main',
        };
      }
    } catch (e) {
    }
  }
  return null;
}

export function getOverlayConfig(projectRoot: string): { repo: string; branch: string } | null {
  const configPath = join(projectRoot, 'config', 'global.json');
  
  if (existsSync(configPath)) {
    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      if (config.overlay?.repo) {
        return {
          repo: config.overlay.repo,
          branch: config.overlay.branch || 'main',
        };
      }
    } catch (e) {
    }
  }
  
  const globalConfig = getGlobalConfig();
  if (globalConfig) return globalConfig;
  
  return { repo: DEFAULT_OVERLAY_REPO, branch: 'main' };
}