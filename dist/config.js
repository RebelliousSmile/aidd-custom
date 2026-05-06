import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const CONFIG_DIR = join(homedir(), '.config', 'aidd-custom');
export const GLOBAL_CONFIG_FILE = join(CONFIG_DIR, 'config.json');
export const DEFAULT_OVERLAY_REPO = 'RebelliousSmile/aidd-overlay';
function readConfig(path) {
    if (!existsSync(path))
        return null;
    try {
        const config = JSON.parse(readFileSync(path, 'utf-8'));
        if (config.overlay?.repo) {
            return { repo: config.overlay.repo, branch: config.overlay.branch || 'main' };
        }
    }
    catch { }
    return null;
}
export function getGlobalConfig() {
    return readConfig(GLOBAL_CONFIG_FILE);
}
// Priority: project (.aidd/config.json) > global (~/.config/aidd-custom/config.json) > hardcoded default
export function getOverlayConfig(projectRoot) {
    return (readConfig(join(projectRoot, '.aidd', 'config.json')) ??
        getGlobalConfig() ??
        { repo: DEFAULT_OVERLAY_REPO, branch: 'main' });
}
//# sourceMappingURL=config.js.map