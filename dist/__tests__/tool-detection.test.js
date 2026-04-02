import { describe, it, expect, vi } from 'vitest';
import { detectToolSync, TOOL_DIRECTORIES, } from '../src/index.js';
describe('Tool Detection', () => {
    const existsSyncMock = vi.fn();
    it('should detect Claude when .claude directory exists', () => {
        existsSyncMock.mockImplementation((filePath) => {
            const p = filePath;
            return p.includes('.claude');
        });
        const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
        expect(result).toBe('claude');
    });
    it('should detect Claude when both .claude and .github exist', () => {
        existsSyncMock.mockImplementation((filePath) => {
            const p = filePath;
            return p.includes('.claude') || p.includes('.github');
        });
        const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
        expect(result).toBe('claude');
    });
    it('should detect Cursor when .cursor directory exists', () => {
        existsSyncMock.mockImplementation((filePath) => {
            const p = filePath;
            return p.includes('.cursor');
        });
        const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
        expect(result).toBe('cursor');
    });
    it('should detect OpenCode when .opencode directory exists', () => {
        existsSyncMock.mockImplementation((filePath) => {
            const p = filePath;
            return p.includes('.opencode');
        });
        const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
        expect(result).toBe('opencode');
    });
    it('should detect Copilot when only .github exists', () => {
        existsSyncMock.mockImplementation((filePath) => {
            const p = filePath;
            return p.includes('.github');
        });
        const result = detectToolSync('/test/project', { existsSync: existsSyncMock });
        expect(result).toBe('copilot');
    });
    it('should return null when no tool directories exist', () => {
        mockFs.existsSync.mockReturnValue(false);
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
//# sourceMappingURL=tool-detection.test.js.map