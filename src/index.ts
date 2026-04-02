import { z } from 'zod';

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
    // Check if any of the tool's directories exist
    const exists = dirs.some((dir) => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(basePath, dir));
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