import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFileCount } from '../src/index.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('File Counting', () => {
  const testDir = '/tmp/aidd-test-' + Date.now();

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it('should return 0 for non-existent directory', () => {
    expect(getFileCount('/nonexistent')).toBe(0);
  });

  it('should count .md files recursively', () => {
    mkdirSync(join(testDir, 'subdir'));
    writeFileSync(join(testDir, 'file1.md'), '# Test');
    writeFileSync(join(testDir, 'file2.md'), '# Test');
    writeFileSync(join(testDir, 'subdir', 'file3.md'), '# Test');
    writeFileSync(join(testDir, 'subdir', 'file4.txt'), 'ignored');

    expect(getFileCount(testDir)).toBe(3);
  });

  it('should not count non-.md files', () => {
    writeFileSync(join(testDir, 'file.md'), '# Test');
    writeFileSync(join(testDir, 'file.txt'), 'ignored');
    writeFileSync(join(testDir, 'file.json'), '{}');

    expect(getFileCount(testDir)).toBe(1);
  });
});
