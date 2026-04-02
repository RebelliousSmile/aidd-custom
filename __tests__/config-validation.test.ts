import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  OverlayConfigSchema,
  OverlayConfig,
} from '../src/index.js';

describe('Configuration Validation', () => {
  it('should validate a valid config', () => {
    const config = {
      overlay: {
        repo: 'owner/repo',
        branch: 'main',
      },
    };

    const result = validateConfig(config);
    expect(result).toEqual(config);
  });

  it('should use default branch when not specified', () => {
    const config = {
      overlay: {
        repo: 'owner/repo',
      },
    };

    const result = validateConfig(config);
    expect(result.overlay.branch).toBe('main');
  });

  it('should reject config without repo', () => {
    const config = {
      overlay: {
        branch: 'main',
      },
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it('should reject config without overlay object', () => {
    const config = {};

    expect(() => validateConfig(config)).toThrow();
  });

  it('should reject empty repo string', () => {
    const config = {
      overlay: {
        repo: '',
        branch: 'main',
      },
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it('should reject empty branch string', () => {
    const config = {
      overlay: {
        repo: 'owner/repo',
        branch: '',
      },
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it('should parse real config from .aidd/config.json', () => {
    const config = {
      overlay: {
        repo: 'RebelliousSmile/aidd-claude-custom',
        branch: 'main',
      },
    };

    const result = validateConfig(config);
    expect(result.overlay.repo).toBe('RebelliousSmile/aidd-claude-custom');
    expect(result.overlay.branch).toBe('main');
  });
});
