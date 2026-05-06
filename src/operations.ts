import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createHash } from 'crypto';
import {
  type ToolType,
  getToolConfig,
  getFileCount,
  hasFeature,
} from './index.js';

// ─── index ────────────────────────────────────────────────────────────────────

export interface OverlayIndex {
  repo: string;
  branch: string;
  installedAt: string;
  files: string[];
  tools?: ToolType[];  // absent for global installs; repairFromOverlay falls back to []
}

const PROJECT_INDEX = join('.aidd', 'manifest.json');
const GLOBAL_INDEX = 'aidd-overlay.json';

function indexPath(rootDir: string, isGlobal: boolean): string {
  return isGlobal ? join(rootDir, GLOBAL_INDEX) : join(rootDir, PROJECT_INDEX);
}

function md5File(absPath: string): string {
  if (!existsSync(absPath)) return '0'.repeat(32);
  return createHash('md5').update(readFileSync(absPath)).digest('hex');
}

// Build aidd-cli v2 manifest: { version: 2, repo, tools: { [id]: { version, files, mergeFiles, excludedMcp } }, docs, scripts }
function toAiddV2(rootDir: string, index: OverlayIndex): object {
  const toolIds = index.tools ?? [];
  const toolEntries: Record<string, unknown> = {};

  // Build a set of file paths claimed by each tool based on known destination dirs
  const claimedByTool = new Map<string, Set<string>>();
  for (const tool of toolIds) {
    claimedByTool.set(tool, new Set());
  }

  for (const relPath of index.files) {
    let claimed = false;
    for (const tool of toolIds) {
      const cfg = getToolConfig(tool);
      const dirs = [cfg.commandsDir, cfg.agentsDir, cfg.rulesDir, ...(cfg.skillsDir ? [cfg.skillsDir] : [])];
      if (dirs.some(d => relPath.startsWith(d + '/') || relPath === d)) {
        claimedByTool.get(tool)!.add(relPath);
        claimed = true;
        break;
      }
    }
    // Unclaimed files (e.g. templates) go to the first tool
    if (!claimed && toolIds.length > 0) {
      claimedByTool.get(toolIds[0])!.add(relPath);
    }
  }

  for (const tool of toolIds) {
    const files = [...(claimedByTool.get(tool) ?? [])].map(relPath => ({
      relativePath: relPath,
      hash: md5File(join(rootDir, relPath)),
    }));
    toolEntries[tool] = { version: index.branch, files, mergeFiles: [], excludedMcp: [] };
  }

  return {
    version: 2,
    repo: index.repo,
    tools: toolEntries,
    docs: null,
    scripts: null,
    installedAt: index.installedAt,
  };
}

// Parse aidd-cli v2 manifest back into our OverlayIndex
function fromAiddV2(raw: Record<string, unknown>): OverlayIndex {
  const toolsRaw = (raw.tools ?? {}) as Record<string, { version?: string; files?: Array<{ relativePath: string }> }>;
  const toolIds = Object.keys(toolsRaw) as ToolType[];
  const files: string[] = toolIds.flatMap(id => (toolsRaw[id]?.files ?? []).map(f => f.relativePath));
  const branch = toolIds.length > 0 ? (toolsRaw[toolIds[0]]?.version ?? '') : '';
  return {
    repo: typeof raw.repo === 'string' ? raw.repo : '',
    branch,
    installedAt: typeof raw.installedAt === 'string' ? raw.installedAt : new Date().toISOString(),
    files,
    tools: toolIds,
  };
}

export function readOverlayIndex(rootDir: string, isGlobal = false): OverlayIndex | null {
  const p = indexPath(rootDir, isGlobal);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8')) as Record<string, unknown>;
    if (!isGlobal && raw.version === 2) return fromAiddV2(raw);
    return raw as unknown as OverlayIndex;
  } catch {
    return null;
  }
}

export function writeOverlayIndex(rootDir: string, index: OverlayIndex, isGlobal = false): void {
  const p = indexPath(rootDir, isGlobal);
  mkdirSync(dirname(p), { recursive: true });
  const payload = isGlobal ? index : toAiddV2(rootDir, index);
  writeFileSync(p, JSON.stringify(payload, null, 2));
}

export function deleteOverlayIndex(rootDir: string, isGlobal = false): void {
  const p = indexPath(rootDir, isGlobal);
  if (existsSync(p)) rmSync(p, { force: true });
}

// normalize path separators to forward slashes for cross-platform index entries
function norm(p: string): string {
  return p.split('\\').join('/');
}

function applyTransform(
  fn: ((content: string, filename: string) => string) | null,
  content: string,
  filename: string,
): string {
  return fn ? fn(content, filename) : content;
}

// ─── fs helpers ───────────────────────────────────────────────────────────────

function listAllFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  const walk = (d: string) => {
    for (const item of readdirSync(d)) {
      const fullPath = join(d, item);
      if (statSync(fullPath).isDirectory()) walk(fullPath);
      else results.push(relative(dir, fullPath));
    }
  };
  walk(dir);
  return results;
}

// Install commands from commands/ directory (flat NN_name.md files)
// and rules from rules/ directory (flat NN-name.md files)
function installAiddContent(
  tool: ToolType,
  projectRoot: string,
  overlayTempDir: string,
  installed: string[],
): void {
  const cfg = getToolConfig(tool);

  if (hasFeature(tool, 'commands') || tool === 'copilot') {
    const cmdSrc = join(overlayTempDir, 'commands');
    if (existsSync(cmdSrc)) {
      for (const file of readdirSync(cmdSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f))) {
        const match = file.match(/^(\d+)_(.+)$/)!;
        const num = match[1];
        const baseName = match[2]; // strip NN_ prefix
        const destDir = join(projectRoot, cfg.commandsDir, 'aidd', num);
        mkdirSync(destDir, { recursive: true });
        const content = readFileSync(join(cmdSrc, file), 'utf-8');
        if (tool === 'copilot') {
          const destFile = baseName.replace(/\.md$/, '.prompt.md');
          writeFileSync(join(destDir, destFile), applyTransform(cfg.transform.commands, content, file));
          installed.push(norm(join(cfg.commandsDir, 'aidd', num, destFile)));
        } else {
          writeFileSync(join(destDir, baseName), applyTransform(cfg.transform.commands, content, file));
          installed.push(norm(join(cfg.commandsDir, 'aidd', num, baseName)));
        }
      }
    }
  }

  if (hasFeature(tool, 'rules')) {
    const rulesSrc = join(overlayTempDir, 'rules');
    if (existsSync(rulesSrc)) {
      // Snapshot existing taxonomy dirs before the loop: num → single dir name (or '' if ambiguous)
      const rulesBaseDir = join(projectRoot, cfg.rulesDir);
      const taxonomyByNum = new Map<string, string>();
      if (existsSync(rulesBaseDir)) {
        for (const d of readdirSync(rulesBaseDir)) {
          if (!statSync(join(rulesBaseDir, d)).isDirectory()) continue;
          const m = d.match(/^(\d+)-/);
          if (!m) continue;
          const n = m[1];
          taxonomyByNum.set(n, taxonomyByNum.has(n) ? '' : d); // '' = ambiguous
        }
      }

      for (const file of readdirSync(rulesSrc).filter(f => f.endsWith('.md') && /^\d+-/.test(f))) {
        const match = file.match(/^(\d+)-(.+)$/)!;
        const num = match[1];
        const baseName = match[2]; // strip NN- prefix, e.g. "challenge-plan.md"
        const existing = taxonomyByNum.get(num);
        const taxonomy = existing || file.replace(/\.md$/, ''); // fallback: NN-name
        const destDir = join(projectRoot, cfg.rulesDir, taxonomy);
        mkdirSync(destDir, { recursive: true });
        const content = readFileSync(join(rulesSrc, file), 'utf-8');
        writeFileSync(join(destDir, baseName), applyTransform(cfg.transform.rules, content, file));
        installed.push(norm(join(cfg.rulesDir, taxonomy, baseName)));
      }
    }
  }
}

// ─── install ─────────────────────────────────────────────────────────────────

export function installToolOverlay(tool: ToolType, projectRoot: string, overlayTempDir: string): string[] {
  const cfg = getToolConfig(tool);
  const installed: string[] = [];

  installAiddContent(tool, projectRoot, overlayTempDir, installed);

  if (hasFeature(tool, 'agents')) {
    const srcDir = join(overlayTempDir, 'agents');
    const destDir = join(projectRoot, getToolConfig(tool).agentsDir);
    if (existsSync(srcDir)) {
      mkdirSync(destDir, { recursive: true });
      const files = readdirSync(srcDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const content = readFileSync(join(srcDir, file), 'utf-8');
        writeFileSync(join(destDir, file), applyTransform(cfg.transform.agents, content, file));
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

export function installTemplates(projectRoot: string, overlayTempDir: string): string[] {
  const srcDir = join(overlayTempDir, 'templates');
  const destDir = join(projectRoot, 'aidd_docs', 'templates');
  if (!existsSync(srcDir)) return [];
  mkdirSync(destDir, { recursive: true });
  cpSync(srcDir, destDir, { recursive: true });
  return listAllFiles(srcDir).map(f => norm(join('aidd_docs', 'templates', f)));
}

export function installGlobalOverlay(globalRoot: string, overlayTempDir: string): string[] {
  const installed: string[] = [];

  const cmdsSrc = join(overlayTempDir, 'commands');
  if (existsSync(cmdsSrc)) {
    for (const file of readdirSync(cmdsSrc).filter(f => f.endsWith('.md') && /^\d+_/.test(f))) {
      const match = file.match(/^(\d+)_(.+)$/)!;
      const num = match[1];
      const baseName = match[2];
      const destDir = join(globalRoot, 'commands', 'aidd', num);
      mkdirSync(destDir, { recursive: true });
      cpSync(join(cmdsSrc, file), join(destDir, baseName));
      installed.push(norm(join('commands', 'aidd', num, baseName)));
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

export function cleanByIndex(rootDir: string, isGlobal = false): number {
  const index = readOverlayIndex(rootDir, isGlobal);
  if (!index) return 0;

  let removed = 0;
  const dirsToCheck = new Set<string>();

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

export function repairFromOverlay(rootDir: string, overlayTempDir: string, isGlobal = false): string[] {
  const index = readOverlayIndex(rootDir, isGlobal);
  if (!index) return [];

  let files: string[];
  if (isGlobal) {
    files = installGlobalOverlay(rootDir, overlayTempDir);
  } else {
    files = [];
    for (const tool of (index.tools ?? []) as ToolType[]) {
      files.push(...installToolOverlay(tool, rootDir, overlayTempDir));
    }
    files.push(...installTemplates(rootDir, overlayTempDir));
  }

  writeOverlayIndex(rootDir, { ...index, installedAt: new Date().toISOString(), files }, isGlobal);
  return files;
}

// ─── doctor ──────────────────────────────────────────────────────────────────

export interface InstallStatus {
  notIndexed: boolean;
  repo: string | null;
  branch: string | null;
  installedAt: string | null;
  indexed: number;
  present: number;
  missing: string[];
}

export function checkInstallStatus(rootDir: string, isGlobal = false): InstallStatus {
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

interface OverlayComparison {
  indexedCount: number;
  overlayCount: number;
  inSync: boolean;
  missingFromDisk: string[];
}

// Count files the overlay would install for a given tool (mirrors installToolOverlay logic)
function countToolOverlay(tool: ToolType, overlayTempDir: string): number {
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

export function compareWithOverlay(rootDir: string, overlayTempDir: string, isGlobal = false): OverlayComparison {
  const index = readOverlayIndex(rootDir, isGlobal);
  const missingFromDisk = index
    ? index.files.filter(f => !existsSync(join(rootDir, f)))
    : [];

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
    if (existsSync(skillsSrc)) overlayCount += listAllFiles(skillsSrc).length;
  } else {
    for (const tool of (index?.tools ?? []) as ToolType[]) {
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
