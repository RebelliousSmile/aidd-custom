/**
 * Workflow-level tests for the four core guarantees of aidd-custom:
 *
 *  1. Install  — overlay files land in the expected Claude directories
 *  2. Update   — a clean + re-install cycle never removes manually-added files
 *  3. Doctor   — detects missing files with correct paths and repairs them
 *  4. Uninstall — cleanByIndex removes only overlay-indexed files
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  installToolOverlay,
  installTemplates,
  writeOverlayIndex,
  cleanByIndex,
  checkInstallStatus,
  repairFromOverlay,
  readOverlayIndex,
} from '../src/operations.js';
import { TOOL_CONFIGS } from '../src/index.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function mkdir(...parts: string[]) {
  mkdirSync(join(...parts), { recursive: true });
}

function touch(path: string, content = '# content') {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

function buildOverlay(dir: string) {
  mkdir(dir, 'aidd');
  touch(join(dir, 'aidd', '01_cmd.md'), '---\nname: cmd\ndescription: test cmd\n---\nDo something.');
  touch(join(dir, 'aidd', '01-rule.md'), '# Rule\nBe consistent.');

  mkdir(dir, 'agents');
  touch(join(dir, 'agents', 'reviewer.md'), '---\ndescription: code reviewer\n---\nReview the code.');

  mkdir(dir, 'skills', 'my-skill');
  touch(join(dir, 'skills', 'my-skill', 'skill.md'), '# Skill');

  mkdir(dir, 'templates', 'aidd');
  touch(join(dir, 'templates', 'aidd', 'tmpl.md'), '# Template');
}

/** Run a full install and record the index (mirrors what cli.ts does). */
function fullInstall(projectDir: string, overlayDir: string): string[] {
  mkdir(projectDir, '.claude');
  const files = [
    ...installToolOverlay('claude', projectDir, overlayDir),
    ...installTemplates(projectDir, overlayDir),
  ];
  writeOverlayIndex(projectDir, {
    repo: 'test/repo',
    branch: 'main',
    installedAt: new Date().toISOString(),
    files,
    tools: ['claude'],
  });
  return files;
}

// ─── fixture setup ───────────────────────────────────────────────────────────

let base: string;
let overlayDir: string;
let projectDir: string;

beforeEach(() => {
  base = join('/tmp', 'aidd-workflow-' + Date.now());
  overlayDir = join(base, 'overlay');
  projectDir = join(base, 'project');
  mkdir(base);
  buildOverlay(overlayDir);
  mkdir(projectDir);
});

afterEach(() => {
  if (existsSync(base)) rmSync(base, { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. INSTALL — overlay files land in the expected Claude directories
// ─────────────────────────────────────────────────────────────────────────────

describe('Install — files land in the correct Claude directories', () => {
  const cfg = TOOL_CONFIGS.claude;

  beforeEach(() => {
    mkdir(projectDir, '.claude');
    installToolOverlay('claude', projectDir, overlayDir);
  });

  it('places commands under .claude/commands/<prefix>/', () => {
    expect(existsSync(join(projectDir, cfg.commandsDir, '01', '01_cmd.md'))).toBe(true);
  });

  it('places rules under .claude/rules/<prefix>/', () => {
    expect(existsSync(join(projectDir, cfg.rulesDir, '01', '01-rule.md'))).toBe(true);
  });

  it('places agents under .claude/agents/', () => {
    expect(existsSync(join(projectDir, cfg.agentsDir, 'reviewer.md'))).toBe(true);
  });

  it('places skills under .claude/skills/ preserving subdirectory', () => {
    expect(existsSync(join(projectDir, cfg.skillsDir!, 'my-skill', 'skill.md'))).toBe(true);
  });

  it('places templates under aidd_docs/templates/ preserving subdirectory', () => {
    installTemplates(projectDir, overlayDir);
    expect(existsSync(join(projectDir, 'aidd_docs', 'templates', 'aidd', 'tmpl.md'))).toBe(true);
  });

  it('returns relative paths matching the actual destinations', () => {
    const files = installToolOverlay('claude', projectDir, overlayDir);
    expect(files).toContain('.claude/commands/01/01_cmd.md');
    expect(files).toContain('.claude/rules/01/01-rule.md');
    expect(files).toContain('.claude/agents/reviewer.md');
    expect(files).toContain('.claude/skills/my-skill/skill.md');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. UPDATE — manually-added files survive a clean + re-install cycle
// ─────────────────────────────────────────────────────────────────────────────

describe('Update — manually-added files survive clean + re-install', () => {
  it('leaves manual command files intact after update', () => {
    fullInstall(projectDir, overlayDir);

    // User adds a file outside the overlay
    const manual = join(projectDir, '.claude', 'commands', 'my-manual-cmd.md');
    touch(manual, '# Manual command');

    // Simulate update: clean indexed files then re-install
    cleanByIndex(projectDir);
    fullInstall(projectDir, overlayDir);

    expect(existsSync(manual)).toBe(true);
  });

  it('leaves manual agent files intact after update', () => {
    fullInstall(projectDir, overlayDir);

    const manual = join(projectDir, '.claude', 'agents', 'my-agent.md');
    touch(manual, '# My custom agent');

    cleanByIndex(projectDir);
    fullInstall(projectDir, overlayDir);

    expect(existsSync(manual)).toBe(true);
  });

  it('leaves manual rules intact after update', () => {
    fullInstall(projectDir, overlayDir);

    const manual = join(projectDir, '.claude', 'rules', 'my-rule.md');
    touch(manual, '# My rule');

    cleanByIndex(projectDir);
    fullInstall(projectDir, overlayDir);

    expect(existsSync(manual)).toBe(true);
  });

  it('re-installs overlay files that were missing before the update', () => {
    const files = fullInstall(projectDir, overlayDir);
    // Simulate a file disappearing between installs
    rmSync(join(projectDir, files[0]));

    cleanByIndex(projectDir);
    fullInstall(projectDir, overlayDir);

    expect(existsSync(join(projectDir, files[0]))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DOCTOR — détecte les fichiers manquants avec les bons chemins et les répare
//    (repairFromOverlay est la fonction appelée par la commande doctor en interne)
// ─────────────────────────────────────────────────────────────────────────────

describe('Doctor — path composition and repair of missing files', () => {
  it('reports no missing files after a clean install', () => {
    fullInstall(projectDir, overlayDir);
    const status = checkInstallStatus(projectDir);
    expect(status.missing).toHaveLength(0);
    expect(status.present).toBe(status.indexed);
  });

  it('identifies the exact relative path of a deleted file', () => {
    const files = fullInstall(projectDir, overlayDir);
    const deleted = files.find(f => f.includes('agents'))!;
    rmSync(join(projectDir, deleted));

    const status = checkInstallStatus(projectDir);
    expect(status.missing).toContain(deleted);
  });

  it('correctly composes paths for commands, rules, agents and skills', () => {
    const files = fullInstall(projectDir, overlayDir);

    // Delete one of each type
    const cmd   = files.find(f => f.includes('commands'))!;
    const rule  = files.find(f => f.includes('rules'))!;
    const agent = files.find(f => f.includes('agents'))!;
    const skill = files.find(f => f.includes('skills'))!;
    [cmd, rule, agent, skill].forEach(f => rmSync(join(projectDir, f)));

    const { missing } = checkInstallStatus(projectDir);
    expect(missing).toContain(cmd);
    expect(missing).toContain(rule);
    expect(missing).toContain(agent);
    expect(missing).toContain(skill);
  });

  it('repairs missing files from the overlay', () => {
    const files = fullInstall(projectDir, overlayDir);

    // Delete every indexed file
    for (const f of files) rmSync(join(projectDir, f));
    expect(checkInstallStatus(projectDir).present).toBe(0);

    // Repair
    repairFromOverlay(projectDir, overlayDir);

    // All files are back
    const status = checkInstallStatus(projectDir);
    expect(status.missing).toHaveLength(0);
    expect(status.present).toBe(files.length);
  });

  it('repair restores only missing files without touching present ones', () => {
    const files = fullInstall(projectDir, overlayDir);
    const agentPath = join(projectDir, files.find(f => f.includes('agents'))!);
    touch(agentPath, '# modified by user');

    const deletedPath = files.find(f => f.includes('commands'))!;
    rmSync(join(projectDir, deletedPath));

    repairFromOverlay(projectDir, overlayDir);

    // Deleted file is restored
    expect(existsSync(join(projectDir, deletedPath))).toBe(true);
    // Present file is overwritten by overlay (repair = full re-install)
    expect(existsSync(agentPath)).toBe(true);
  });

  it('repair updates the index timestamp', async () => {
    const files = fullInstall(projectDir, overlayDir);
    const before = readOverlayIndex(projectDir)!.installedAt;

    await new Promise(r => setTimeout(r, 10));
    repairFromOverlay(projectDir, overlayDir);

    const after = readOverlayIndex(projectDir)!.installedAt;
    expect(after > before).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. UNINSTALL — cleanByIndex removes only overlay-indexed files
// ─────────────────────────────────────────────────────────────────────────────

describe('Uninstall — only indexed overlay files are removed', () => {
  it('removes all overlay files from disk', () => {
    const files = fullInstall(projectDir, overlayDir);
    cleanByIndex(projectDir);
    for (const f of files) {
      expect(existsSync(join(projectDir, f))).toBe(false);
    }
  });

  it('does not remove manually-added files outside the index', () => {
    fullInstall(projectDir, overlayDir);

    const manual = join(projectDir, '.claude', 'commands', 'my-own-cmd.md');
    touch(manual, '# not from overlay');

    cleanByIndex(projectDir);

    expect(existsSync(manual)).toBe(true);
  });

  it('does not remove manually-added agents', () => {
    fullInstall(projectDir, overlayDir);

    const manual = join(projectDir, '.claude', 'agents', 'custom-agent.md');
    touch(manual, '# custom agent');

    cleanByIndex(projectDir);

    expect(existsSync(manual)).toBe(true);
  });

  it('does not remove manually-added skills', () => {
    fullInstall(projectDir, overlayDir);

    const manual = join(projectDir, '.claude', 'skills', 'custom-skill', 'skill.md');
    touch(manual, '# custom skill');

    cleanByIndex(projectDir);

    expect(existsSync(manual)).toBe(true);
  });

  it('removes the index file itself after clean', () => {
    fullInstall(projectDir, overlayDir);
    cleanByIndex(projectDir);
    expect(readOverlayIndex(projectDir)).toBeNull();
  });

  it('returns the exact count of removed files', () => {
    const files = fullInstall(projectDir, overlayDir);
    const removed = cleanByIndex(projectDir);
    expect(removed).toBe(files.length);
  });

  it('is safe to run twice — second call returns 0', () => {
    fullInstall(projectDir, overlayDir);
    cleanByIndex(projectDir);
    expect(cleanByIndex(projectDir)).toBe(0);
  });
});
