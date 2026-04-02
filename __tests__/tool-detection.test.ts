import { describe, it, expect, vi } from 'vitest';
import * as path from 'path';
import {
  detectTool,
  detectToolSync,
  detectAllTools,
  detectAllToolsSync,
  TOOL_DIRECTORIES,
  ToolType,
} from '../src/index.js';

describe('Tool Detection', () => {
  const existsSyncMock = vi.fn();

  it('should detect Claude when .claude directory exists', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.claude');
    });

    const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toBe('claude');
  });

  it('should detect Claude when both .claude and .github exist', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.claude') || p.includes('.github');
    });

    const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toBe('claude');
  });

  it('should detect Cursor when .cursor directory exists', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.cursor');
    });

    const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toBe('cursor');
  });

  it('should detect OpenCode when .opencode directory exists', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.opencode');
    });

    const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toBe('opencode');
  });

  it('should detect Copilot when only .github exists', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.github');
    });

    const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toBe('copilot');
  });

  it('should return null when no tool directories exist', () => {
    existsSyncMock.mockReturnValue(false);

    const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toBeNull();
  });

  it('should have correct directory mappings for all tools', () => {
    expect(TOOL_DIRECTORIES.claude).toContain('.claude');
    expect(TOOL_DIRECTORIES.copilot).toContain('.github');
    expect(TOOL_DIRECTORIES.cursor).toContain('.cursor');
    expect(TOOL_DIRECTORIES.opencode).toContain('.opencode');
  });
});

describe('Detect All Tools', () => {
  const existsSyncMock = vi.fn();

  it('should return all tools when multiple directories exist', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.claude') || p.includes('.opencode') || p.includes('.cursor');
    });

    const result = detectAllToolsSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toContain('claude');
    expect(result).toContain('opencode');
    expect(result).toContain('cursor');
    expect(result).toHaveLength(3);
  });

  it('should return single tool when only one exists', () => {
    (existsSyncMock as ReturnType<typeof vi.fn>).mockImplementation((filePath: string) => {
      const p = filePath as string;
      return p.includes('.claude');
    });

    const result = detectAllToolsSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toEqual(['claude']);
  });

  it('should return empty array when no tools exist', () => {
    existsSyncMock.mockReturnValue(false);

    const result = detectAllToolsSync('/test/project', { existsSync: existsSyncMock });
    expect(result).toHaveLength(0);
  });
});
