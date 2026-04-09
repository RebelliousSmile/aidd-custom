import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');
export const GLOBAL_CONFIG_FILE = join(PACKAGE_ROOT, 'config.json');
export const DEFAULT_OVERLAY_REPO = 'RebelliousSmile/aidd-claude-custom';
export function getGlobalConfig() {
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
        }
        catch (e) {
        }
    }
    return null;
}
export function getOverlayConfig(_projectRoot) {
    const globalConfig = getGlobalConfig();
    if (globalConfig)
        return globalConfig;
    return { repo: DEFAULT_OVERLAY_REPO, branch: 'main' };
}
export function getGlobalPlugins() {
    if (existsSync(GLOBAL_CONFIG_FILE)) {
        try {
            const content = readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
            const config = JSON.parse(content);
            return config.plugins || {};
        }
        catch (e) {
        }
    }
    return {};
}
export function saveGlobalPlugins(plugins) {
    let config = {};
    if (existsSync(GLOBAL_CONFIG_FILE)) {
        try {
            config = JSON.parse(readFileSync(GLOBAL_CONFIG_FILE, 'utf-8'));
        }
        catch (e) {
        }
    }
    config.plugins = plugins;
    writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(config, null, 2));
}
//# sourceMappingURL=config.js.map