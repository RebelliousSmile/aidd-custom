import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFileCount, getPluginCounts, validateOverlaySync } from '../src/index.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('File Counting', () => {
  const testDir = '/tmp/aidd-test-' + Date.now();
  
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });
  
  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  it('should return 0 for non-existent directory', () => {
    expect(getFileCount('/nonexistent')).toBe(0);
  });
  
  it('should count .md files recursively', () => {
    mkdirSync(join(testDir, 'subdir'));
    writeFileSync(join(testDir, 'file1.md'), '# Test');
    writeFileSync(join(testDir, 'file2.md'), '# Test');
    writeFileSync(join(testDir, 'subdir', 'file3.md'), '# Test');
    writeFileSync(join(testDir, 'subdir', 'file4.txt'), '# Test'); // should not count
    
    expect(getFileCount(testDir)).toBe(3);
  });
  
  it('should not count files in non-md format', () => {
    writeFileSync(join(testDir, 'file.md'), '# Test');
    writeFileSync(join(testDir, 'file.txt'), '# Test');
    writeFileSync(join(testDir, 'file.json'), '{}');
    
    expect(getFileCount(testDir)).toBe(1);
  });
});

describe('Plugin Counts', () => {
  const testDir = '/tmp/aidd-plugin-test-' + Date.now();
  
  beforeEach(() => {
    mkdirSync(join(testDir, 'commands'), { recursive: true });
    mkdirSync(join(testDir, 'rules'), { recursive: true });
    mkdirSync(join(testDir, 'templates'), { recursive: true });
  });
  
  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  it('should return 0 for empty plugin', () => {
    const counts = getPluginCounts(testDir);
    expect(counts.commands).toBe(0);
    expect(counts.rules).toBe(0);
    expect(counts.templates).toBe(0);
  });
  
  it('should count files in each category', () => {
    writeFileSync(join(testDir, 'commands', 'cmd1.md'), '# Cmd');
    writeFileSync(join(testDir, 'rules', 'rule1.md'), '# Rule');
    writeFileSync(join(testDir, 'templates', 'tmpl1.md'), '# Tmpl');
    
    const counts = getPluginCounts(testDir);
    expect(counts.commands).toBe(1);
    expect(counts.rules).toBe(1);
    expect(counts.templates).toBe(1);
  });
});

describe('Overlay Validation', () => {
  const testBase = '/tmp/aidd-validation-test-' + Date.now();
  const overlayDir = join(testBase, 'overlay');
  const localDir = join(testBase, 'local');
  const pluginsDir = join(testBase, 'plugins');
  
  beforeEach(() => {
    // Create overlay structure
    mkdirSync(join(overlayDir, 'commands', 'custom'), { recursive: true });
    mkdirSync(join(overlayDir, 'rules', 'custom'), { recursive: true });
    mkdirSync(join(overlayDir, 'agents'), { recursive: true });
    mkdirSync(join(overlayDir, 'templates', 'custom'), { recursive: true });
    
    // Create local structure
    mkdirSync(join(localDir, 'commands', 'custom'), { recursive: true });
    mkdirSync(join(localDir, 'rules', 'custom'), { recursive: true });
    mkdirSync(join(localDir, 'agents', 'custom'), { recursive: true });
    mkdirSync(join(localDir, 'templates'), { recursive: true });
    
    // Create plugin structure
    mkdirSync(join(pluginsDir, 'myplugin', 'commands'), { recursive: true });
    mkdirSync(join(pluginsDir, 'myplugin', 'rules'), { recursive: true });
    mkdirSync(join(pluginsDir, 'myplugin', 'templates'), { recursive: true });
  });
  
  afterEach(() => {
    if (existsSync(testBase)) {
      rmSync(testBase, { recursive: true, force: true });
    }
  });
  
  it('should detect sync when counts match (overlay only)', () => {
    writeFileSync(join(overlayDir, 'commands', 'custom', 'cmd1.md'), '# Cmd');
    writeFileSync(join(localDir, 'commands', 'custom', 'cmd1.md'), '# Cmd');
    
    const result = validateOverlaySync(
      {
        commands: join(localDir, 'commands', 'custom'),
        rules: join(localDir, 'rules', 'custom'),
        agents: join(localDir, 'agents', 'custom'),
        templates: join(localDir, 'templates'),
      },
      {
        commands: join(overlayDir, 'commands', 'custom'),
        rules: join(overlayDir, 'rules', 'custom'),
        agents: join(overlayDir, 'agents'),
        templates: join(overlayDir, 'templates', 'custom'),
      },
      [],
      pluginsDir
    );
    
    expect(result.isValid).toBe(true);
    expect(result.details[0].localCount).toBe(1);
    expect(result.details[0].expectedCount).toBe(1);
  });
  
  it('should detect sync when counts match (overlay + plugin)', () => {
    // Overlay has 1 cmd, plugin has 1 cmd
    writeFileSync(join(overlayDir, 'commands', 'custom', 'cmd1.md'), '# Cmd');
    writeFileSync(join(pluginsDir, 'myplugin', 'commands', 'cmd2.md'), '# Cmd');
    // Local has both
    writeFileSync(join(localDir, 'commands', 'custom', 'cmd1.md'), '# Cmd');
    writeFileSync(join(localDir, 'commands', 'custom', 'cmd2.md'), '# Cmd');
    
    const result = validateOverlaySync(
      {
        commands: join(localDir, 'commands', 'custom'),
        rules: join(localDir, 'rules', 'custom'),
        agents: join(localDir, 'agents', 'custom'),
        templates: join(localDir, 'templates'),
      },
      {
        commands: join(overlayDir, 'commands', 'custom'),
        rules: join(overlayDir, 'rules', 'custom'),
        agents: join(overlayDir, 'agents'),
        templates: join(overlayDir, 'templates', 'custom'),
      },
      ['myplugin'],
      pluginsDir
    );
    
    expect(result.isValid).toBe(true);
    expect(result.details[0].localCount).toBe(2);
    expect(result.details[0].expectedCount).toBe(2);
    expect(result.details[0].pluginExtra).toBe(1);
  });
  
  it('should detect mismatch when local has extra files', () => {
    // Overlay has 1, local has 2
    writeFileSync(join(overlayDir, 'commands', 'custom', 'cmd1.md'), '# Cmd');
    writeFileSync(join(localDir, 'commands', 'custom', 'cmd1.md'), '# Cmd');
    writeFileSync(join(localDir, 'commands', 'custom', 'stale.md'), '# Stale');
    
    const result = validateOverlaySync(
      {
        commands: join(localDir, 'commands', 'custom'),
        rules: join(localDir, 'rules', 'custom'),
        agents: join(localDir, 'agents', 'custom'),
        templates: join(localDir, 'templates'),
      },
      {
        commands: join(overlayDir, 'commands', 'custom'),
        rules: join(overlayDir, 'rules', 'custom'),
        agents: join(overlayDir, 'agents'),
        templates: join(overlayDir, 'templates', 'custom'),
      },
      [],
      pluginsDir
    );
    
    expect(result.isValid).toBe(false);
    expect(result.details[0].localCount).toBe(2);
    expect(result.details[0].expectedCount).toBe(1);
  });
  
  it('should ignore missing directories (0 files)', () => {
    const result = validateOverlaySync(
      {
        commands: join(localDir, 'commands', 'custom'),
        rules: join(localDir, 'rules', 'custom'),
        agents: join(localDir, 'agents', 'custom'),
        templates: join(localDir, 'templates'),
      },
      {
        commands: join(overlayDir, 'commands', 'custom'),
        rules: join(overlayDir, 'rules', 'custom'),
        agents: join(overlayDir, 'agents'),
        templates: join(overlayDir, 'templates', 'custom'),
      },
      [],
      pluginsDir
    );
    
    // No files in any dir = valid (not considered stale)
    expect(result.isValid).toBe(true);
    expect(result.details[0].localCount).toBe(0);
  });
});