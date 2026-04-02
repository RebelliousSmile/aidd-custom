import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  detectTool,
  detectToolSync,
  TOOL_DIRECTORIES,
  ToolType,
} from '../src/index.js';

describe('Tool Detection', () => {
  const mockFs: typeof fs = {
    existsSync: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect Claude when .claude directory exists', () => {
    (mockFs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.claude');
    });

    const result = detectToolSync('/test/project', mockFs);
    expect(result).toBe('claude');
  });

  it('should detect Claude when both .claude and .github exist', () => {
    (mockFs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.claude') || p.includes('.github');
    });

    const result = detectToolSync('/test/project', mockFs);
    expect(result).toBe('claude');
  });

  it('should detect Cursor when .cursor directory exists', () => {
    (mockFs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.cursor');
    });

    const result = detectToolSync('/test/project', mockFs);
    expect(result).toBe('cursor');
  });

  it('should detect OpenCode when .opencode directory exists', () => {
    (mockFs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.opencode');
    });

    const result = detectToolSync('/test/project', mockFs);
    expect(result).toBe('opencode');
  });

  it('should detect Copilot when only .github exists', () => {
    (mockFs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.github');
    });

    const result = detectToolSync('/test/project', mockFs);
    expect(result).toBe('copilot');
  });

  it('should return null when no tool directories exist', () => {
    (mockFs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const result = detectToolSync('/test/project', mockFs);
    expect(result).toBeNull();
  });

  it('should have correct directory mappings for all tools', () => {
    expect(TOOL_DIRECTORIES.claude).toContain('.claude');
    expect(TOOL_DIRECTORIES.copilot).toContain('.github');
    expect(TOOL_DIRECTORIES.cursor).toContain('.cursor');
    expect(TOOL_DIRECTORIES.opencode).toContain('.opencode');
  });
});
