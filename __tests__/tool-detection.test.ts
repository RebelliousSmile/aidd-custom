import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { detectTool, detectAllTools, TOOL_DIRECTORIES } from '../src/index.js';

let base: string;

beforeEach(() => {
  base = join('/tmp', 'aidd-detect-' + Date.now());
  mkdirSync(base, { recursive: true });
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

describe('detectTool', () => {
  it('returns claude when .claude exists', () => {
    mkdirSync(join(base, '.claude'));
    expect(detectTool(base)).toBe('claude');
  });

  it('returns the first match when multiple tools exist (claude wins)', () => {
    mkdirSync(join(base, '.claude'));
    mkdirSync(join(base, '.github'));
    expect(detectTool(base)).toBe('claude');
  });

  it('returns cursor when only .cursor exists', () => {
    mkdirSync(join(base, '.cursor'));
    expect(detectTool(base)).toBe('cursor');
  });

  it('returns opencode when only .opencode exists', () => {
    mkdirSync(join(base, '.opencode'));
    expect(detectTool(base)).toBe('opencode');
  });

  it('returns copilot when only .github exists', () => {
    mkdirSync(join(base, '.github'));
    expect(detectTool(base)).toBe('copilot');
  });

  it('returns null when no tool directories exist', () => {
    expect(detectTool(base)).toBeNull();
  });
});

describe('detectAllTools', () => {
  it('returns all tools whose directories exist', () => {
    mkdirSync(join(base, '.claude'));
    mkdirSync(join(base, '.opencode'));
    mkdirSync(join(base, '.cursor'));
    const result = detectAllTools(base);
    expect(result).toContain('claude');
    expect(result).toContain('opencode');
    expect(result).toContain('cursor');
    expect(result).toHaveLength(3);
  });

  it('returns a single-element array when one tool exists', () => {
    mkdirSync(join(base, '.claude'));
    expect(detectAllTools(base)).toEqual(['claude']);
  });

  it('returns empty array when no tools exist', () => {
    expect(detectAllTools(base)).toHaveLength(0);
  });
});

describe('TOOL_DIRECTORIES', () => {
  it('has entries for all four tools', () => {
    expect(TOOL_DIRECTORIES.claude).toContain('.claude');
    expect(TOOL_DIRECTORIES.copilot).toContain('.github');
    expect(TOOL_DIRECTORIES.cursor).toContain('.cursor');
    expect(TOOL_DIRECTORIES.opencode).toContain('.opencode');
  });
});
