import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { getToolConfig, getFileCount, hasFeature, } from './index.js';
const PROJECT_INDEX = join('.aidd', 'overlay.json');
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
// Route files from flat 'aidd/' dir: NN_ prefix → command, NN- prefix → rule
function installAiddContent(tool, projectRoot, overlayTempDir, installed) {
    const cfg = getToolConfig(tool);
    const srcDir = join(overlayTempDir, 'aidd');
    if (!existsSync(srcDir))
        return;
    const files = readdirSync(srcDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
        const cmdMatch = file.match(/^(\d+)_/);
        const ruleMatch = file.match(/^(\d+)-/);
        if (cmdMatch && hasFeature(tool, 'commands')) {
            const num = cmdMatch[1];
            const destDir = join(projectRoot, cfg.commandsDir, num);
            mkdirSync(destDir, { recursive: true });
            const content = readFileSync(join(srcDir, file), 'utf-8');
            writeFileSync(join(destDir, file), cfg.transform.commands ? cfg.transform.commands(content, file) : content);
            installed.push(norm(join(cfg.commandsDir, num, file)));
        }
        else if (cmdMatch && tool === 'copilot') {
            const num = cmdMatch[1];
            const destDir = join(projectRoot, cfg.commandsDir, num);
            mkdirSync(destDir, { recursive: true });
            const destFile = file.replace('.md', '.prompt.md');
            const content = readFileSync(join(srcDir, file), 'utf-8');
            writeFileSync(join(destDir, destFile), cfg.transform.commands ? cfg.transform.commands(content, file) : content);
            installed.push(norm(join(cfg.commandsDir, num, destFile)));
        }
        else if (ruleMatch && hasFeature(tool, 'rules')) {
            const num = ruleMatch[1];
            const destDir = join(projectRoot, cfg.rulesDir, num);
            mkdirSync(destDir, { recursive: true });
            const content = readFileSync(join(srcDir, file), 'utf-8');
            writeFileSync(join(destDir, file), cfg.transform.rules ? cfg.transform.rules(content, file) : content);
            installed.push(norm(join(cfg.rulesDir, num, file)));
        }
    }
}
// ─── install ─────────────────────────────────────────────────────────────────
export function installToolOverlay(tool, projectRoot, overlayTempDir) {
    const cfg = getToolConfig(tool);
    const installed = [];
    installAiddContent(tool, projectRoot, overlayTempDir, installed);
    if (hasFeature(tool, 'agents')) {
        const srcDir = join(overlayTempDir, 'agents');
        const destDir = join(projectRoot, getToolConfig(tool).agentsDir);
        if (existsSync(srcDir)) {
            mkdirSync(destDir, { recursive: true });
            const files = readdirSync(srcDir).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const content = readFileSync(join(srcDir, file), 'utf-8');
                writeFileSync(join(destDir, file), cfg.transform.agents ? cfg.transform.agents(content, file) : content);
                installed.push(norm(join(getToolConfig(tool).agentsDir, file)));
            }
        }
    }
    if (hasFeature(tool, 'skills') && cfg.skillsDir) {
        const srcDir = join(overlayTempDir, 'skills');
        const skillsDir = cfg.skillsDir;
        const destDir = join(projectRoot, skillsDir);
        if (existsSync(srcDir)) {
            mkdirSync(destDir, { recursive: true });
            cpSync(srcDir, destDir, { recursive: true });
            installed.push(...listAllFiles(srcDir).map(f => norm(join(skillsDir, f))));
        }
    }
    return installed;
}
export function installTemplates(projectRoot, overlayTempDir) {
    const srcDir = join(overlayTempDir, 'templates');
    const destDir = join(projectRoot, 'aidd_docs', 'templates');
    if (!existsSync(srcDir))
        return [];
    mkdirSync(destDir, { recursive: true });
    cpSync(srcDir, destDir, { recursive: true });
    return listAllFiles(srcDir).map(f => norm(join('aidd_docs', 'templates', f)));
}
export function installGlobalOverlay(globalRoot, overlayTempDir) {
    const installed = [];
    const aiddSrc = join(overlayTempDir, 'aidd');
    if (existsSync(aiddSrc)) {
        const cmdFiles = readdirSync(aiddSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f));
        for (const file of cmdFiles) {
            const num = file.match(/^(\d+)_/)[1];
            const destDir = join(globalRoot, 'commands', num);
            mkdirSync(destDir, { recursive: true });
            cpSync(join(aiddSrc, file), join(destDir, file));
            installed.push(norm(join('commands', num, file)));
        }
    }
    const agentsSrc = join(overlayTempDir, 'agents');
    const agentsDest = join(globalRoot, 'agents');
    if (existsSync(agentsSrc)) {
        mkdirSync(agentsDest, { recursive: true });
        for (const f of readdirSync(agentsSrc).filter(f => f.endsWith('.md'))) {
            cpSync(join(agentsSrc, f), join(agentsDest, f));
            installed.push(norm(join('agents', f)));
        }
    }
    const skillsSrc = join(overlayTempDir, 'skills');
    const skillsDest = join(globalRoot, 'skills');
    if (existsSync(skillsSrc)) {
        mkdirSync(skillsDest, { recursive: true });
        cpSync(skillsSrc, skillsDest, { recursive: true });
        installed.push(...listAllFiles(skillsSrc).map(f => norm(join('skills', f))));
    }
    return installed;
}
// ─── clean ───────────────────────────────────────────────────────────────────
export function cleanByIndex(rootDir, isGlobal = false) {
    const index = readOverlayIndex(rootDir, isGlobal);
    if (!index)
        return 0;
    let removed = 0;
    for (const file of index.files) {
        const fullPath = join(rootDir, file);
        if (existsSync(fullPath)) {
            rmSync(fullPath, { force: true });
            removed++;
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
    const aiddSrc = join(overlayTempDir, 'aidd');
    if (existsSync(aiddSrc)) {
        const files = readdirSync(aiddSrc).filter(f => f.endsWith('.md'));
        if (hasFeature(tool, 'commands') || tool === 'copilot') {
            count += files.filter(f => /^\d+_/.test(f)).length;
        }
        if (hasFeature(tool, 'rules')) {
            count += files.filter(f => /^\d+-/.test(f)).length;
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
    const missingFromDisk = index
        ? index.files.filter(f => !existsSync(join(rootDir, f)))
        : [];
    let overlayCount = 0;
    if (isGlobal) {
        const aiddSrc = join(overlayTempDir, 'aidd');
        if (existsSync(aiddSrc)) {
            overlayCount += readdirSync(aiddSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f)).length;
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
    return {
        indexedCount,
        overlayCount,
        inSync: indexedCount === overlayCount && missingFromDisk.length === 0,
        missingFromDisk,
    };
}
//# sourceMappingURL=operations.js.map