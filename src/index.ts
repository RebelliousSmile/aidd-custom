import { z } from 'zod';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Supported AI development tool types
 */
export type ToolType = 'claude' | 'copilot' | 'cursor' | 'opencode';

/**
 * Directory structure for each tool
 */
export const TOOL_DIRECTORIES: Record<ToolType, string[]> = {
  claude: ['.claude'],
  copilot: ['.github'],
  cursor: ['.cursor'],
  opencode: ['.opencode'],
};

/**
 * Detect which AIDD tool is configured based on directory structure
 */
export function detectTool(basePath: string): ToolType | null {
  for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
    const toolType = tool as ToolType;
    const exists = dirs.some((dir) => {
      try {
        return existsSync(join(basePath, dir));
      } catch {
        return false;
      }
    });
    if (exists) {
      return toolType;
    }
  }
  return null;
}

/**
 * Detect tool synchronously with passed fs module (for testing)
 */
export function detectToolSync(basePath: string, fsModule: { existsSync: typeof import('fs')['existsSync'] }): ToolType | null {
  for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
    const toolType = tool as ToolType;
    const exists = dirs.some((dir) => fsModule.existsSync(require('path').join(basePath, dir)));
    if (exists) {
      return toolType;
    }
  }
  return null;
}

/**
 * Schema for overlay configuration
 */
export const OverlayConfigSchema = z.object({
  overlay: z.object({
    repo: z.string().min(1, 'Repository is required'),
    branch: z.string().min(1, 'Branch is required').default('main'),
  }).required(),
});

/**
 * Type for overlay configuration
 */
export type OverlayConfig = z.infer<typeof OverlayConfigSchema>;

/**
 * Validate overlay configuration from config.json
 */
export function validateConfig(config: unknown): OverlayConfig {
  return OverlayConfigSchema.parse(config);
}

/**
 * Schema for manifest entries
 */
export const ManifestEntrySchema = z.object({
  tool: z.enum(['claude', 'copilot', 'cursor', 'opencode']),
  version: z.string(),
  installedAt: z.string().datetime(),
  files: z.array(z.object({
    source: z.string(),
    destination: z.string(),
    hash: z.string(),
  })),
});

/**
 * Schema for plugin entry in manifest
 */
export const PluginEntrySchema = z.object({
  name: z.string(),
  version: z.string(),
  installedAt: z.string().datetime(),
  files: z.array(z.object({
    source: z.string(),
    destination: z.string(),
    hash: z.string(),
  })),
});

/**
 * Schema for the manifest.json file
 */
export const ManifestSchema = z.object({
  baseOverlay: ManifestEntrySchema.optional(),
  plugins: z.record(z.string(), PluginEntrySchema),
});

/**
 * Type for manifest
 */
export type Manifest = z.infer<typeof ManifestSchema>;

/**
 * Validate manifest.json
 */
export function validateManifest(manifest: unknown): Manifest {
  return ManifestSchema.parse(manifest);
}

/**
 * Schema for plugin index entry
 */
export const PluginIndexEntrySchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

/**
 * Schema for plugin index.json
 */
export const PluginIndexSchema = z.object({
  version: z.string(),
  plugins: z.array(PluginIndexEntrySchema),
});

/**
 * Type for plugin index
 */
export type PluginIndex = z.infer<typeof PluginIndexSchema>;

/**
 * Validate plugin index.json
 */
export function validatePluginIndex(index: unknown): PluginIndex {
  return PluginIndexSchema.parse(index);
}

/**
 * Schema for command file frontmatter
 */
export const CommandFrontmatterSchema = z.object({
  name: z.string().regex(/^aidd:overlay(:[\w:]+)?$/, 'Invalid command name format'),
  description: z.string().min(1),
  argumentHint: z.string().optional(),
});

/**
 * Type for command frontmatter
 */
export type CommandFrontmatter = z.infer<typeof CommandFrontmatterSchema>;

/**
 * Parse frontmatter from a markdown command file
 */
export function parseCommandFrontmatter(content: string): CommandFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml: Record<string, string> = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) yaml[key] = value;
  }

  try {
    return CommandFrontmatterSchema.parse(yaml);
  } catch {
    return null;
  }
}

/**
 * Path mapping from source to tool-specific paths
 */
export const PATH_TRANSFORMATIONS: Record<ToolType, (sourcePath: string) => string> = {
  claude: (source: string) => source.replace(/^overlay\//, '.claude/'),
  copilot: (source: string) => source.replace(/^overlay\//, '.github/'),
  cursor: (source: string) => source.replace(/^overlay\//, '.cursor/'),
  opencode: (source: string) => source,
};

/**
 * Transform a source path to the tool-specific destination path
 */
export function transformPath(sourcePath: string, tool: ToolType): string {
  const transformer = PATH_TRANSFORMATIONS[tool];
  return transformer(sourcePath);
}

/**
 * Get the custom directory for a tool
 */
export function getToolCustomDir(tool: ToolType): string {
  const dirs: Record<ToolType, string> = {
    claude: '.claude/commands/custom',
    copilot: '.github/commands',
    cursor: '.cursor/commands',
    opencode: '.opencode/commands',
  };
  return dirs[tool];
}

/**
 * Get the custom rules directory for a tool
 */
export function getToolRulesDir(tool: ToolType): string {
  const dirs: Record<ToolType, string> = {
    claude: '.claude/rules/custom',
    copilot: '.github/instructions',
    cursor: '.cursor/rules',
    opencode: '.opencode/rules',
  };
  return dirs[tool];
}

/**
 * Get the custom agents directory for a tool
 */
export function getToolAgentsDir(tool: ToolType): string {
  const dirs: Record<ToolType, string> = {
    claude: '.claude/agents',
    copilot: '.github/agents',
    cursor: '.cursor/agents',
    opencode: '.opencode/agents',
  };
  return dirs[tool];
}

/**
 * Count .md files recursively in a directory
 */
export function getFileCount(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let count = 0;
  const walk = (d: string) => {
    const items = readdirSync(d);
    for (const item of items) {
      const fullPath = join(d, item);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.md')) {
        count++;
      }
    }
  };
  walk(dirPath);
  return count;
}

/**
 * Get file counts for a plugin's directories
 */
export interface PluginCounts {
  commands: number;
  rules: number;
  templates: number;
}

export function getPluginCounts(pluginDir: string): PluginCounts {
  return {
    commands: getFileCount(join(pluginDir, 'commands')),
    rules: getFileCount(join(pluginDir, 'rules')),
    templates: getFileCount(join(pluginDir, 'templates')),
  };
}

/**
 * Validation result for file count comparison
 */
export interface ValidationResult {
  isValid: boolean;
  details: {
    category: string;
    localCount: number;
    expectedCount: number;
    overlayCount: number;
    pluginExtra: number;
  }[];
}

/**
 * Compare local files with overlay + plugins expected counts
 */
export function validateOverlaySync(
  localPaths: {
    commands: string;
    rules: string;
    agents: string;
    templates: string;
  },
  overlayPaths: {
    commands: string;
    rules: string;
    agents: string;
    templates: string;
  },
  installedPlugins: string[],
  pluginsDir: string
): ValidationResult {
  const categories = [
    { key: 'commands', name: 'Commands', pluginKey: 'commands' as const },
    { key: 'rules', name: 'Rules', pluginKey: 'rules' as const },
    { key: 'agents', name: 'Agents', pluginKey: null },
    { key: 'templates', name: 'Templates', pluginKey: 'templates' as const },
  ];

  const details: ValidationResult['details'] = [];
  let isValid = true;

  for (const cat of categories) {
    const localCount = getFileCount(localPaths[cat.key as keyof typeof localPaths]);
    const overlayCount = getFileCount(overlayPaths[cat.key as keyof typeof overlayPaths]);
    
    let pluginExtra = 0;
    if (cat.pluginKey) {
      for (const pluginName of installedPlugins) {
        const pluginDir = join(pluginsDir, pluginName);
        pluginExtra += getPluginCounts(pluginDir)[cat.pluginKey];
      }
    }

    const expectedCount = overlayCount + pluginExtra;
    
    if (localCount !== expectedCount && localCount > 0) {
      isValid = false;
    }

    details.push({
      category: cat.name,
      localCount,
      expectedCount,
      overlayCount,
      pluginExtra,
    });
  }

  return { isValid, details };
}