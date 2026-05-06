import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createHash } from 'crypto';
import { getToolConfig, getFileCount, hasFeature, } from './index.js';
const PROJECT_INDEX = join('.aidd', 'aidd-custom.json');
const GLOBAL_INDEX = 'aidd-overlay.json';
function indexPath(rootDir, isGlobal) {
    return isGlobal ? join(rootDir, GLOBAL_INDEX) : join(rootDir, PROJECT_INDEX);
}
export function readOverlayIndex(rootDir, isGlobal = false) {
    const p = indexPath(rootDir, isGlobal);
    if (!existsSync(p))
        return null;
    try {
        return JSON.parse(readFileSync(p, 'utf-8'));
    }
    catch {
        return null;
    }
}
export function writeOverlayIndex(rootDir, index, isGlobal = false) {
    const p = indexPath(rootDir, isGlobal);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(index, null, 2));
}
export function deleteOverlayIndex(rootDir, isGlobal = false) {
    const p = indexPath(rootDir, isGlobal);
    if (existsSync(p))
        rmSync(p, { force: true });
}
// normalize path separators to forward slashes for cross-platform index entries
function norm(p) {
    return p.split('\\').join('/');
}
function applyTransform(fn, content, filename) {
    return fn ? fn(content, filename) : content;
}
function hashContent(content) {
    return createHash('sha1').update(content).digest('hex');
}
// ─── fs helpers ───────────────────────────────────────────────────────────────
function listAllFiles(dir) {
    if (!existsSync(dir))
        return [];
    const results = [];
    const walk = (d) => {
        for (const item of readdirSync(d)) {
            const fullPath = join(d, item);
            if (statSync(fullPath).isDirectory())
                walk(fullPath);
            else
                results.push(relative(dir, fullPath));
        }
    };
    walk(dir);
    return results;
}
// Install commands and rules from overlay; write=false for dry-run hash capture
function installAiddContent(tool, projectRoot, overlayTempDir, installed, hashes, write = true) {
    const cfg = getToolConfig(tool);
    if (hasFeature(tool, 'commands') || tool === 'copilot') {
        const cmdSrc = join(overlayTempDir, 'commands');
        if (existsSync(cmdSrc)) {
            for (const file of readdirSync(cmdSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f))) {
                const match = file.match(/^(\d+)_(.+)$/);
                const num = match[1];
                const baseName = match[2]; // strip NN_ prefix
                const destDir = join(projectRoot, cfg.commandsDir, 'aidd', num);
                const content = readFileSync(join(cmdSrc, file), 'utf-8');
                const transformed = applyTransform(cfg.transform.commands, content, file);
                if (tool === 'copilot') {
                    const destFile = baseName.replace(/\.md$/, '.prompt.md');
                    if (write) {
                        mkdirSync(destDir, { recursive: true });
                        writeFileSync(join(destDir, destFile), transformed);
                    }
                    const key = norm(join(cfg.commandsDir, 'aidd', num, destFile));
                    installed.push(key);
                    if (hashes)
                        hashes[key] = hashContent(transformed);
                }
                else {
                    if (write) {
                        mkdirSync(destDir, { recursive: true });
                        writeFileSync(join(destDir, baseName), transformed);
                    }
                    const key = norm(join(cfg.commandsDir, 'aidd', num, baseName));
                    installed.push(key);
                    if (hashes)
                        hashes[key] = hashContent(transformed);
                }
            }
        }
    }
    if (hasFeature(tool, 'rules')) {
        const rulesSrc = join(overlayTempDir, 'rules');
        if (existsSync(rulesSrc)) {
            // Snapshot existing taxonomy dirs before the loop: num → single dir name (or '' if ambiguous)
            const rulesBaseDir = join(projectRoot, cfg.rulesDir);
            const taxonomyByNum = new Map();
            if (existsSync(rulesBaseDir)) {
                for (const d of readdirSync(rulesBaseDir)) {
                    if (!statSync(join(rulesBaseDir, d)).isDirectory())
                        continue;
                    const m = d.match(/^(\d+)-/);
                    if (!m)
                        continue;
                    const n = m[1];
                    taxonomyByNum.set(n, taxonomyByNum.has(n) ? '' : d); // '' = ambiguous
                }
            }
            for (const file of readdirSync(rulesSrc).filter(f => f.endsWith('.md') && /^\d+-/.test(f))) {
                const match = file.match(/^(\d+)-(.+)$/);
                const num = match[1];
                const baseName = match[2]; // strip NN- prefix, e.g. "challenge-plan.md"
                const existing = taxonomyByNum.get(num);
                const taxonomy = existing || file.replace(/\.md$/, ''); // fallback: NN-name
                const destDir = join(projectRoot, cfg.rulesDir, taxonomy);
                const content = readFileSync(join(rulesSrc, file), 'utf-8');
                const transformed = applyTransform(cfg.transform.rules, content, file);
                if (write) {
                    mkdirSync(destDir, { recursive: true });
                    writeFileSync(join(destDir, baseName), transformed);
                }
                const key = norm(join(cfg.rulesDir, taxonomy, baseName));
                installed.push(key);
                if (hashes)
                    hashes[key] = hashContent(transformed);
            }
        }
    }
}
// ─── install ─────────────────────────────────────────────────────────────────
export function installToolOverlay(tool, projectRoot, overlayTempDir, hashes, write = true) {
    const cfg = getToolConfig(tool);
    const installed = [];
    installAiddContent(tool, projectRoot, overlayTempDir, installed, hashes, write);
    if (hasFeature(tool, 'agents')) {
        const srcDir = join(overlayTempDir, 'agents');
        const destDir = join(projectRoot, getToolConfig(tool).agentsDir);
        if (existsSync(srcDir)) {
            if (write)
                mkdirSync(destDir, { recursive: true });
            const files = readdirSync(srcDir).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const content = readFileSync(join(srcDir, file), 'utf-8');
                const transformed = applyTransform(cfg.transform.agents, content, file);
                if (write)
                    writeFileSync(join(destDir, file), transformed);
                const key = norm(join(getToolConfig(tool).agentsDir, file));
                installed.push(key);
                if (hashes)
                    hashes[key] = hashContent(transformed);
            }
        }
    }
    if (hasFeature(tool, 'skills') && cfg.skillsDir) {
        const srcDir = join(overlayTempDir, 'skills');
        const skillsDir = cfg.skillsDir;
        const destDir = join(projectRoot, skillsDir);
        if (existsSync(srcDir)) {
            const skillFiles = listAllFiles(srcDir);
            for (const f of skillFiles) {
                const srcPath = join(srcDir, f);
                const key = norm(join(skillsDir, f));
                const raw = readFileSync(srcPath);
                if (write) {
                    const dest = join(destDir, f);
                    mkdirSync(dirname(dest), { recursive: true });
                    writeFileSync(dest, raw);
                }
                installed.push(key);
                if (hashes)
                    hashes[key] = hashContent(raw);
            }
        }
    }
    return installed;
}
export function installTemplates(projectRoot, overlayTempDir, hashes, write = true) {
    const srcDir = join(overlayTempDir, 'templates');
    const destDir = join(projectRoot, 'aidd_docs', 'templates');
    if (!existsSync(srcDir))
        return [];
    const files = listAllFiles(srcDir);
    const installed = [];
    for (const f of files) {
        const raw = readFileSync(join(srcDir, f));
        const key = norm(join('aidd_docs', 'templates', f));
        if (write) {
            const dest = join(destDir, f);
            mkdirSync(dirname(dest), { recursive: true });
            writeFileSync(dest, raw);
        }
        installed.push(key);
        if (hashes)
            hashes[key] = hashContent(raw);
    }
    return installed;
}
export function installGlobalOverlay(globalRoot, overlayTempDir, hashes, write = true) {
    const installed = [];
    const cmdsSrc = join(overlayTempDir, 'commands');
    if (existsSync(cmdsSrc)) {
        for (const file of readdirSync(cmdsSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f))) {
            const match = file.match(/^(\d+)_(.+)$/);
            const num = match[1];
            const baseName = match[2];
            const destDir = join(globalRoot, 'commands', 'aidd', num);
            const content = readFileSync(join(cmdsSrc, file), 'utf-8');
            if (write) {
                mkdirSync(destDir, { recursive: true });
                writeFileSync(join(destDir, baseName), content);
            }
            const key = norm(join('commands', 'aidd', num, baseName));
            installed.push(key);
            if (hashes)
                hashes[key] = hashContent(content);
        }
    }
    const agentsSrc = join(overlayTempDir, 'agents');
    const agentsDest = join(globalRoot, 'agents');
    if (existsSync(agentsSrc)) {
        if (write)
            mkdirSync(agentsDest, { recursive: true });
        for (const f of readdirSync(agentsSrc).filter(f => f.endsWith('.md'))) {
            const content = readFileSync(join(agentsSrc, f), 'utf-8');
            if (write)
                writeFileSync(join(agentsDest, f), content);
            const key = norm(join('agents', f));
            installed.push(key);
            if (hashes)
                hashes[key] = hashContent(content);
        }
    }
    const skillsSrc = join(overlayTempDir, 'skills');
    const skillsDest = join(globalRoot, 'skills');
    if (existsSync(skillsSrc)) {
        const skillFiles = listAllFiles(skillsSrc);
        for (const f of skillFiles) {
            const raw = readFileSync(join(skillsSrc, f));
            if (write) {
                const dest = join(skillsDest, f);
                mkdirSync(dirname(dest), { recursive: true });
                writeFileSync(dest, raw);
            }
            const key = norm(join('skills', f));
            installed.push(key);
            if (hashes)
                hashes[key] = hashContent(raw);
        }
    }
    return installed;
}
// ─── clean ───────────────────────────────────────────────────────────────────
export function cleanByIndex(rootDir, isGlobal = false) {
    const index = readOverlayIndex(rootDir, isGlobal);
    if (!index)
        return 0;
    let removed = 0;
    const dirsToCheck = new Set();
    for (const file of index.files) {
        const fullPath = join(rootDir, file);
        // Collect parent dirs unconditionally — file may have been manually deleted
        let dir = dirname(fullPath);
        while (dir.startsWith(rootDir) && dir !== rootDir) {
            dirsToCheck.add(dir);
            dir = dirname(dir);
        }
        if (existsSync(fullPath)) {
            rmSync(fullPath, { force: true });
            removed++;
        }
    }
    // Remove empty dirs deepest-first
    for (const dir of [...dirsToCheck].sort((a, b) => b.length - a.length)) {
        if (existsSync(dir) && readdirSync(dir).length === 0) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
    deleteOverlayIndex(rootDir, isGlobal);
    return removed;
}
// ─── repair ──────────────────────────────────────────────────────────────────
export function repairFromOverlay(rootDir, overlayTempDir, isGlobal = false) {
    const index = readOverlayIndex(rootDir, isGlobal);
    if (!index)
        return [];
    let files;
    if (isGlobal) {
        files = installGlobalOverlay(rootDir, overlayTempDir);
    }
    else {
        files = [];
        for (const tool of (index.tools ?? [])) {
            files.push(...installToolOverlay(tool, rootDir, overlayTempDir));
        }
        files.push(...installTemplates(rootDir, overlayTempDir));
    }
    writeOverlayIndex(rootDir, { ...index, installedAt: new Date().toISOString(), files }, isGlobal);
    return files;
}
// ─── rehash ───────────────────────────────────────────────────────────────────
export function rehashFromDisk(rootDir, isGlobal = false) {
    const index = readOverlayIndex(rootDir, isGlobal);
    if (!index)
        return { updated: 0, missing: 0 };
    const hashes = {};
    let missing = 0;
    for (const file of index.files) {
        const fullPath = join(rootDir, file);
        if (!existsSync(fullPath)) {
            missing++;
            continue;
        }
        hashes[file] = hashContent(readFileSync(fullPath));
    }
    writeOverlayIndex(rootDir, { ...index, hashes }, isGlobal);
    return { updated: Object.keys(hashes).length, missing };
}
export function checkInstallStatus(rootDir, isGlobal = false) {
    const index = readOverlayIndex(rootDir, isGlobal);
    if (!index) {
        return { notIndexed: true, repo: null, branch: null, installedAt: null, indexed: 0, present: 0, missing: [] };
    }
    const missing = index.files.filter(f => !existsSync(join(rootDir, f)));
    return {
        notIndexed: false,
        repo: index.repo,
        branch: index.branch,
        installedAt: index.installedAt,
        indexed: index.files.length,
        present: index.files.length - missing.length,
        missing,
    };
}
// Count files the overlay would install for a given tool (mirrors installToolOverlay logic)
function countToolOverlay(tool, overlayTempDir) {
    const cfg = getToolConfig(tool);
    let count = 0;
    if (hasFeature(tool, 'commands') || tool === 'copilot') {
        const cmdSrc = join(overlayTempDir, 'commands');
        if (existsSync(cmdSrc)) {
            count += readdirSync(cmdSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f)).length;
        }
    }
    if (hasFeature(tool, 'rules')) {
        const rulesSrc = join(overlayTempDir, 'rules');
        if (existsSync(rulesSrc)) {
            count += readdirSync(rulesSrc).filter(f => f.endsWith('.md') && /^\d+-/.test(f)).length;
        }
    }
    if (hasFeature(tool, 'agents')) {
        const agentsSrc = join(overlayTempDir, 'agents');
        if (existsSync(agentsSrc)) {
            count += readdirSync(agentsSrc).filter(f => f.endsWith('.md')).length;
        }
    }
    if (hasFeature(tool, 'skills') && cfg.skillsDir) {
        const skillsSrc = join(overlayTempDir, 'skills');
        if (existsSync(skillsSrc)) {
            count += listAllFiles(skillsSrc).length;
        }
    }
    return count;
}
export function compareWithOverlay(rootDir, overlayTempDir, isGlobal = false) {
    const index = readOverlayIndex(rootDir, isGlobal);
    const storedHashes = index?.hashes ?? {};
    const noHashBaseline = index != null && (index.hashes == null || Object.keys(index.hashes).length === 0);
    const missingFromDisk = index
        ? index.files.filter(f => !existsSync(join(rootDir, f)))
        : [];
    // Compute what hashes the overlay would produce now (dry-run, no writes)
    const overlayHashes = {};
    if (isGlobal) {
        installGlobalOverlay(rootDir, overlayTempDir, overlayHashes, false);
    }
    else {
        for (const tool of (index?.tools ?? [])) {
            installToolOverlay(tool, rootDir, overlayTempDir, overlayHashes, false);
        }
        installTemplates(rootDir, overlayTempDir, overlayHashes, false);
    }
    // Count overlay files (for the count check)
    let overlayCount = 0;
    if (isGlobal) {
        const cmdsSrc = join(overlayTempDir, 'commands');
        if (existsSync(cmdsSrc)) {
            overlayCount += readdirSync(cmdsSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f)).length;
        }
        const agentsSrc = join(overlayTempDir, 'agents');
        if (existsSync(agentsSrc)) {
            overlayCount += readdirSync(agentsSrc).filter(f => f.endsWith('.md')).length;
        }
        const skillsSrc = join(overlayTempDir, 'skills');
        if (existsSync(skillsSrc))
            overlayCount += listAllFiles(skillsSrc).length;
    }
    else {
        for (const tool of (index?.tools ?? [])) {
            overlayCount += countToolOverlay(tool, overlayTempDir);
        }
        overlayCount += getFileCount(join(overlayTempDir, 'templates'));
    }
    const indexedCount = index?.files.length ?? 0;
    // Per-file content diff (only when we have a hash baseline)
    const locallyModified = [];
    const overlayUpdated = [];
    if (!noHashBaseline) {
        for (const file of index?.files ?? []) {
            if (!existsSync(join(rootDir, file)))
                continue; // already in missingFromDisk
            const storedHash = storedHashes[file];
            if (!storedHash)
                continue;
            const currentHash = hashContent(readFileSync(join(rootDir, file)));
            if (currentHash !== storedHash) {
                locallyModified.push(file);
            }
            if (overlayHashes[file] && overlayHashes[file] !== storedHash) {
                overlayUpdated.push(file);
            }
        }
    }
    return {
        indexedCount,
        overlayCount,
        inSync: indexedCount === overlayCount && missingFromDisk.length === 0 && locallyModified.length === 0 && overlayUpdated.length === 0,
        missingFromDisk,
        locallyModified,
        overlayUpdated,
        noHashBaseline,
    };
}
//# sourceMappingURL=operations.js.map