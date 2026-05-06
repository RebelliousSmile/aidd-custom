import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  installToolOverlay,
  installTemplates,
  installGlobalOverlay,
  cleanByIndex,
  checkInstallStatus,
  compareWithOverlay,
  readOverlayIndex,
  writeOverlayIndex,
  deleteOverlayIndex,
} from '../src/operations.js';

// ---------- helpers ----------

function mkdir(...parts: string[]) {
  mkdirSync(join(...parts), { recursive: true });
}

function touch(path: string, content = '# test') {
  writeFileSync(path, content);
}

/**
 * Creates a minimal fake overlay directory structure mirroring the AIDD framework:
 *   overlayDir/
 *     commands/01_cmd.md   → installed as commands/aidd/01/cmd.md
 *     rules/01-rule.md     → installed as rules/01-rule/rule.md (or existing taxonomy dir)
 *     agents/agent.md
 *     skills/my-skill/skill.md
 *     templates/aidd/tmpl.md
 */
function buildOverlay(overlayDir: string) {
  mkdir(overlayDir, 'commands');
  touch(join(overlayDir, 'commands', '01_cmd.md'), '---\nname: cmd\ndescription: test\n---\nContent');

  mkdir(overlayDir, 'rules');
  touch(join(overlayDir, 'rules', '01-rule.md'));

  mkdir(overlayDir, 'agents');
  touch(join(overlayDir, 'agents', 'agent.md'), '---\ndescription: agent\n---\nContent');

  mkdir(overlayDir, 'skills', 'my-skill');
  touch(join(overlayDir, 'skills', 'my-skill', 'skill.md'));

  mkdir(overlayDir, 'templates', 'aidd');
  touch(join(overlayDir, 'templates', 'aidd', 'tmpl.md'));
}

// ---------- suite setup ----------

let base: string;
let overlayDir: string;
let projectDir: string;

beforeEach(() => {
  base = join('/tmp', 'aidd-ops-test-' + Date.now());
  overlayDir = join(base, 'overlay');
  projectDir = join(base, 'project');
  mkdir(base);
  buildOverlay(overlayDir);
  mkdir(projectDir);
});

afterEach(() => {
  if (existsSync(base)) rmSync(base, { recursive: true, force: true });
});

// ============================================================
// OverlayIndex — CRUD
// ============================================================

describe('OverlayIndex CRUD', () => {
  it('returns null when no index exists', () => {
    expect(readOverlayIndex(projectDir)).toBeNull();
  });

  it('writes and reads back an index', () => {
    const idx = { repo: 'owner/repo', branch: 'main', installedAt: '2024-01-01T00:00:00Z', files: ['a.md', 'b.md'], tools: ['claude' as const] };
    writeOverlayIndex(projectDir, idx);
    const read = readOverlayIndex(projectDir);
    expect(read).toEqual(idx);
  });

  it('deletes index file', () => {
    writeOverlayIndex(projectDir, { repo: 'r', branch: 'b', installedAt: '', files: [] });
    deleteOverlayIndex(projectDir);
    expect(readOverlayIndex(projectDir)).toBeNull();
  });

  it('writes global index at a different path', () => {
    const globalDir = join(base, 'global');
    mkdir(globalDir);
    const idx = { repo: 'g/repo', branch: 'main', installedAt: '', files: ['f.md'] };
    writeOverlayIndex(globalDir, idx, true);
    expect(readOverlayIndex(globalDir, true)).toEqual(idx);
    expect(readOverlayIndex(globalDir, false)).toBeNull();
  });
});

// ============================================================
// installToolOverlay — claude (project)
// ============================================================

describe('installToolOverlay — claude', () => {
  beforeEach(() => {
    mkdir(projectDir, '.claude');
  });

  it('copies commands to .claude/commands stripping dir suffix', () => {
    installToolOverlay('claude', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.claude', 'commands', 'aidd', '01', 'cmd.md'))).toBe(true);
  });

  it('copies rules to .claude/rules/<taxonomy>/ (fallback: NN-name)', () => {
    installToolOverlay('claude', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.claude', 'rules', '01-rule', 'rule.md'))).toBe(true);
  });

  it('merges rules into existing taxonomy dir when one NN- dir already exists', () => {
    // Pre-create an existing taxonomy directory (simulates aidd base install)
    mkdirSync(join(projectDir, '.claude', 'rules', '01-standards'), { recursive: true });
    installToolOverlay('claude', projectDir, overlayDir);
    // Rule file should land in the pre-existing 01-standards/ dir, not create 01-rule/
    expect(existsSync(join(projectDir, '.claude', 'rules', '01-standards', 'rule.md'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude', 'rules', '01-rule'))).toBe(false);
  });

  it('copies agents to .claude/agents', () => {
    installToolOverlay('claude', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.claude', 'agents', 'agent.md'))).toBe(true);
  });

  it('copies skills to .claude/skills preserving subdir', () => {
    installToolOverlay('claude', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.claude', 'skills', 'my-skill', 'skill.md'))).toBe(true);
  });

  it('returns list of installed relative paths', () => {
    const files = installToolOverlay('claude', projectDir, overlayDir);
    expect(files).toContain('.claude/commands/aidd/01/cmd.md');
    expect(files).toContain('.claude/rules/01-rule/rule.md');
    expect(files).toContain('.claude/agents/agent.md');
    expect(files).toContain('.claude/skills/my-skill/skill.md');
  });

  it('is idempotent — running twice does not error', () => {
    installToolOverlay('claude', projectDir, overlayDir);
    expect(() => installToolOverlay('claude', projectDir, overlayDir)).not.toThrow();
  });
});

// ============================================================
// installToolOverlay — opencode (project)
// ============================================================

describe('installToolOverlay — opencode', () => {
  beforeEach(() => {
    mkdir(projectDir, '.opencode');
  });

  it('copies commands to .opencode/commands stripping dir suffix', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.opencode', 'commands', 'aidd', '01', 'cmd.md'))).toBe(true);
  });

  it('copies rules to .opencode/rules/<taxonomy>/', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.opencode', 'rules', '01-rule', 'rule.md'))).toBe(true);
  });

  it('copies agents to .opencode/agents', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.opencode', 'agents', 'agent.md'))).toBe(true);
  });

  it('transforms command frontmatter to OpenCode format (name + description fields)', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    const content = readFileSync(join(projectDir, '.opencode', 'commands', 'aidd', '01', 'cmd.md'), 'utf-8');
    expect(content).toContain('name: 01_cmd');
    expect(content).toContain('description: test');
  });

  it('transforms agent frontmatter to OpenCode format (description + mode fields)', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    const content = readFileSync(join(projectDir, '.opencode', 'agents', 'agent.md'), 'utf-8');
    expect(content).toContain('description: agent');
    expect(content).toContain('mode: subagent');
  });

  it('preserves command body content after frontmatter transform', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    const content = readFileSync(join(projectDir, '.opencode', 'commands', 'aidd', '01', 'cmd.md'), 'utf-8');
    expect(content).toContain('Content');
  });

  it('preserves agent body content after frontmatter transform', () => {
    installToolOverlay('opencode', projectDir, overlayDir);
    const content = readFileSync(join(projectDir, '.opencode', 'agents', 'agent.md'), 'utf-8');
    expect(content).toContain('Content');
  });
});

// ============================================================
// installToolOverlay — cursor (project)
// ============================================================

describe('installToolOverlay — cursor', () => {
  beforeEach(() => {
    mkdir(projectDir, '.cursor');
  });

  it('copies commands to .cursor/commands stripping dir suffix', () => {
    installToolOverlay('cursor', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.cursor', 'commands', 'aidd', '01', 'cmd.md'))).toBe(true);
  });

  it('copies rules to .cursor/rules/<taxonomy>/', () => {
    installToolOverlay('cursor', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.cursor', 'rules', '01-rule', 'rule.md'))).toBe(true);
  });

  it('does not create agents (not supported)', () => {
    installToolOverlay('cursor', projectDir, overlayDir);
    expect(existsSync(join(projectDir, '.cursor', 'agents'))).toBe(false);
  });
});

// ============================================================
// installTemplates
// ============================================================

describe('installTemplates', () => {
  it('copies templates to aidd_docs/templates preserving subdir', () => {
    installTemplates(projectDir, overlayDir);
    expect(existsSync(join(projectDir, 'aidd_docs', 'templates', 'aidd', 'tmpl.md'))).toBe(true);
  });

  it('returns list of installed paths', () => {
    const files = installTemplates(projectDir, overlayDir);
    expect(files.some(f => f.includes('tmpl.md'))).toBe(true);
  });

  it('is a no-op when overlay has no templates', () => {
    rmSync(join(overlayDir, 'templates'), { recursive: true, force: true });
    const files = installTemplates(projectDir, overlayDir);
    expect(files).toHaveLength(0);
  });
});

// ============================================================
// installGlobalOverlay
// ============================================================

describe('installGlobalOverlay', () => {
  let globalDir: string;

  beforeEach(() => {
    globalDir = join(base, 'global-claude');
    mkdir(globalDir);
  });

  it('copies commands to <global>/commands stripping dir suffix', () => {
    installGlobalOverlay(globalDir, overlayDir);
    expect(existsSync(join(globalDir, 'commands', 'aidd', '01', 'cmd.md'))).toBe(true);
  });

  it('copies all agents to <global>/agents', () => {
    touch(join(overlayDir, 'agents', 'other.md'));
    installGlobalOverlay(globalDir, overlayDir);
    expect(existsSync(join(globalDir, 'agents', 'agent.md'))).toBe(true);
    expect(existsSync(join(globalDir, 'agents', 'other.md'))).toBe(true);
  });

  it('copies skills to <global>/skills preserving subdir', () => {
    installGlobalOverlay(globalDir, overlayDir);
    expect(existsSync(join(globalDir, 'skills', 'my-skill', 'skill.md'))).toBe(true);
  });

  it('does not copy rules or CLAUDE.md (project-scoped)', () => {
    installGlobalOverlay(globalDir, overlayDir);
    expect(existsSync(join(globalDir, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(globalDir, 'rules'))).toBe(false);
  });

  it('returns list of installed paths', () => {
    const files = installGlobalOverlay(globalDir, overlayDir);
    expect(files.some(f => f.includes('cmd.md'))).toBe(true);
    expect(files.some(f => f.includes('skill.md'))).toBe(true);
  });
});

// ============================================================
// cleanByIndex — project
// ============================================================

describe('cleanByIndex — project (claude)', () => {
  beforeEach(() => {
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
  });

  it('removes indexed files from disk', () => {
    cleanByIndex(projectDir);
    expect(existsSync(join(projectDir, '.claude', 'commands', 'aidd', '01', 'cmd.md'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude', 'rules', '01-rule', 'rule.md'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude', 'agents', 'agent.md'))).toBe(false);
  });

  it('removes empty directories left behind after clean', () => {
    cleanByIndex(projectDir);
    expect(existsSync(join(projectDir, '.claude', 'skills', 'my-skill'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude', 'commands', 'aidd', '01'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude', 'rules', '01-rule'))).toBe(false);
  });

  it('returns the count of removed files', () => {
    const count = cleanByIndex(projectDir);
    expect(count).toBeGreaterThan(0);
  });

  it('removes the index file after clean', () => {
    cleanByIndex(projectDir);
    expect(readOverlayIndex(projectDir)).toBeNull();
  });

  it('returns 0 when nothing to clean', () => {
    cleanByIndex(projectDir);
    expect(cleanByIndex(projectDir)).toBe(0);
  });
});

// ============================================================
// cleanByIndex — global
// ============================================================

describe('cleanByIndex — global', () => {
  let globalDir: string;

  beforeEach(() => {
    globalDir = join(base, 'global-claude');
    mkdir(globalDir);
    const files = installGlobalOverlay(globalDir, overlayDir);
    writeOverlayIndex(globalDir, {
      repo: 'test/repo',
      branch: 'main',
      installedAt: new Date().toISOString(),
      files,
    }, true);
  });

  it('removes indexed global files from disk', () => {
    cleanByIndex(globalDir, true);
    expect(existsSync(join(globalDir, 'commands', 'aidd', '01', 'cmd.md'))).toBe(false);
  });

  it('removes global index file after clean', () => {
    cleanByIndex(globalDir, true);
    expect(readOverlayIndex(globalDir, true)).toBeNull();
  });

  it('returns 0 when nothing to clean', () => {
    cleanByIndex(globalDir, true);
    expect(cleanByIndex(globalDir, true)).toBe(0);
  });
});

// ============================================================
// checkInstallStatus
// ============================================================

describe('checkInstallStatus', () => {
  beforeEach(() => {
    mkdir(projectDir, '.claude');
  });

  it('reports notIndexed=true before install', () => {
    const status = checkInstallStatus(projectDir);
    expect(status.notIndexed).toBe(true);
    expect(status.indexed).toBe(0);
    expect(status.present).toBe(0);
  });

  it('reports present=indexed after full install with no missing files', () => {
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
    const status = checkInstallStatus(projectDir);
    expect(status.notIndexed).toBe(false);
    expect(status.indexed).toBe(files.length);
    expect(status.present).toBe(files.length);
    expect(status.missing).toHaveLength(0);
  });

  it('reports missing when a file has been deleted after install', () => {
    const files = installToolOverlay('claude', projectDir, overlayDir);
    writeOverlayIndex(projectDir, {
      repo: 'test/repo',
      branch: 'main',
      installedAt: new Date().toISOString(),
      files,
      tools: ['claude'],
    });
    rmSync(join(projectDir, files[0]));
    const status = checkInstallStatus(projectDir);
    expect(status.missing).toHaveLength(1);
    expect(status.present).toBe(files.length - 1);
  });

  it('exposes repo and branch from index', () => {
    writeOverlayIndex(projectDir, {
      repo: 'owner/repo',
      branch: 'develop',
      installedAt: '2024-01-01T00:00:00Z',
      files: [],
      tools: ['claude'],
    });
    const status = checkInstallStatus(projectDir);
    expect(status.repo).toBe('owner/repo');
    expect(status.branch).toBe('develop');
  });
});

// ============================================================
// compareWithOverlay
// ============================================================

describe('compareWithOverlay', () => {
  it('inSync=true when both index and overlay are empty', () => {
    const emptyOverlay = join(base, 'empty-overlay');
    mkdir(emptyOverlay);
    const result = compareWithOverlay(projectDir, emptyOverlay);
    expect(result.inSync).toBe(true);
    expect(result.indexedCount).toBe(0);
    expect(result.overlayCount).toBe(0);
  });

  it('inSync=true after real claude install with tools recorded in index', () => {
    mkdir(projectDir, '.claude');
    const files = [
      ...installToolOverlay('claude', projectDir, overlayDir),
      ...installTemplates(projectDir, overlayDir),
    ];
    writeOverlayIndex(projectDir, {
      repo: 'r', branch: 'main', installedAt: '',
      files,
      tools: ['claude'],
    });
    const result = compareWithOverlay(projectDir, overlayDir);
    expect(result.inSync).toBe(true);
    expect(result.indexedCount).toBe(result.overlayCount);
  });

  it('inSync=false when indexed count differs from overlay count', () => {
    // 5 indexed .md but overlay only counts 6 for claude+templates — force mismatch
    writeOverlayIndex(projectDir, {
      repo: 'r', branch: 'main', installedAt: '',
      files: ['.claude/a.md', '.claude/b.md'],
      tools: ['claude'],
    });
    const result = compareWithOverlay(projectDir, overlayDir);
    expect(result.inSync).toBe(false);
  });

  it('inSync=false when files are missing from disk', () => {
    mkdir(projectDir, '.claude');
    const files = installToolOverlay('claude', projectDir, overlayDir);
    writeOverlayIndex(projectDir, {
      repo: 'r', branch: 'main', installedAt: '',
      files,
      tools: ['claude'],
    });
    // delete a file from disk
    rmSync(join(projectDir, files[0]));
    const result = compareWithOverlay(projectDir, overlayDir);
    expect(result.missingFromDisk).toHaveLength(1);
    expect(result.inSync).toBe(false);
  });

  it('global: inSync=true after real global install', () => {
    const globalDir = join(base, 'global');
    mkdir(globalDir);
    const files = installGlobalOverlay(globalDir, overlayDir);
    writeOverlayIndex(globalDir, {
      repo: 'r', branch: 'main', installedAt: '', files,
    }, true);
    const result = compareWithOverlay(globalDir, overlayDir, true);
    expect(result.inSync).toBe(true);
  });
});
