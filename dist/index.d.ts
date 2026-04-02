import { z } from 'zod';
/**
 * Supported AI development tool types
 */
export type ToolType = 'claude' | 'copilot' | 'cursor' | 'opencode';
/**
 * Directory structure for each tool
 */
export declare const TOOL_DIRECTORIES: Record<ToolType, string[]>;
/**
 * Detect which AIDD tool is configured based on directory structure
 */
export declare function detectTool(basePath: string): ToolType | null;
/**
 * Detect tool synchronously with passed fs module (for testing)
 */
export declare function detectToolSync(basePath: string, fsModule: {
    existsSync: typeof import('fs')['existsSync'];
}): ToolType | null;
/**
 * Schema for overlay configuration
 */
export declare const OverlayConfigSchema: z.ZodObject<{
    overlay: z.ZodObject<{
        repo: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        repo: string;
        branch: string;
    }, {
        repo: string;
        branch?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    overlay: {
        repo: string;
        branch: string;
    };
}, {
    overlay: {
        repo: string;
        branch?: string | undefined;
    };
}>;
/**
 * Type for overlay configuration
 */
export type OverlayConfig = z.infer<typeof OverlayConfigSchema>;
/**
 * Validate overlay configuration from config.json
 */
export declare function validateConfig(config: unknown): OverlayConfig;
/**
 * Schema for manifest entries
 */
export declare const ManifestEntrySchema: z.ZodObject<{
    tool: z.ZodEnum<["claude", "copilot", "cursor", "opencode"]>;
    version: z.ZodString;
    installedAt: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        destination: z.ZodString;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        source: string;
        destination: string;
        hash: string;
    }, {
        source: string;
        destination: string;
        hash: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tool: "claude" | "copilot" | "cursor" | "opencode";
    version: string;
    installedAt: string;
    files: {
        source: string;
        destination: string;
        hash: string;
    }[];
}, {
    tool: "claude" | "copilot" | "cursor" | "opencode";
    version: string;
    installedAt: string;
    files: {
        source: string;
        destination: string;
        hash: string;
    }[];
}>;
/**
 * Schema for plugin entry in manifest
 */
export declare const PluginEntrySchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    installedAt: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        destination: z.ZodString;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        source: string;
        destination: string;
        hash: string;
    }, {
        source: string;
        destination: string;
        hash: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: string;
    installedAt: string;
    files: {
        source: string;
        destination: string;
        hash: string;
    }[];
    name: string;
}, {
    version: string;
    installedAt: string;
    files: {
        source: string;
        destination: string;
        hash: string;
    }[];
    name: string;
}>;
/**
 * Schema for the manifest.json file
 */
export declare const ManifestSchema: z.ZodObject<{
    baseOverlay: z.ZodOptional<z.ZodObject<{
        tool: z.ZodEnum<["claude", "copilot", "cursor", "opencode"]>;
        version: z.ZodString;
        installedAt: z.ZodString;
        files: z.ZodArray<z.ZodObject<{
            source: z.ZodString;
            destination: z.ZodString;
            hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            source: string;
            destination: string;
            hash: string;
        }, {
            source: string;
            destination: string;
            hash: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        tool: "claude" | "copilot" | "cursor" | "opencode";
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
    }, {
        tool: "claude" | "copilot" | "cursor" | "opencode";
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
    }>>;
    plugins: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        installedAt: z.ZodString;
        files: z.ZodArray<z.ZodObject<{
            source: z.ZodString;
            destination: z.ZodString;
            hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            source: string;
            destination: string;
            hash: string;
        }, {
            source: string;
            destination: string;
            hash: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
        name: string;
    }, {
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
        name: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    plugins: Record<string, {
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
        name: string;
    }>;
    baseOverlay?: {
        tool: "claude" | "copilot" | "cursor" | "opencode";
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
    } | undefined;
}, {
    plugins: Record<string, {
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
        name: string;
    }>;
    baseOverlay?: {
        tool: "claude" | "copilot" | "cursor" | "opencode";
        version: string;
        installedAt: string;
        files: {
            source: string;
            destination: string;
            hash: string;
        }[];
    } | undefined;
}>;
/**
 * Type for manifest
 */
export type Manifest = z.infer<typeof ManifestSchema>;
/**
 * Validate manifest.json
 */
export declare function validateManifest(manifest: unknown): Manifest;
/**
 * Schema for plugin index entry
 */
export declare const PluginIndexEntrySchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    version: string;
    name: string;
    description?: string | undefined;
    author?: string | undefined;
    dependencies?: string[] | undefined;
}, {
    version: string;
    name: string;
    description?: string | undefined;
    author?: string | undefined;
    dependencies?: string[] | undefined;
}>;
/**
 * Schema for plugin index.json
 */
export declare const PluginIndexSchema: z.ZodObject<{
    version: z.ZodString;
    plugins: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        version: string;
        name: string;
        description?: string | undefined;
        author?: string | undefined;
        dependencies?: string[] | undefined;
    }, {
        version: string;
        name: string;
        description?: string | undefined;
        author?: string | undefined;
        dependencies?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: string;
    plugins: {
        version: string;
        name: string;
        description?: string | undefined;
        author?: string | undefined;
        dependencies?: string[] | undefined;
    }[];
}, {
    version: string;
    plugins: {
        version: string;
        name: string;
        description?: string | undefined;
        author?: string | undefined;
        dependencies?: string[] | undefined;
    }[];
}>;
/**
 * Type for plugin index
 */
export type PluginIndex = z.infer<typeof PluginIndexSchema>;
/**
 * Validate plugin index.json
 */
export declare function validatePluginIndex(index: unknown): PluginIndex;
/**
 * Schema for command file frontmatter
 */
export declare const CommandFrontmatterSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    argumentHint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    argumentHint?: string | undefined;
}, {
    name: string;
    description: string;
    argumentHint?: string | undefined;
}>;
/**
 * Type for command frontmatter
 */
export type CommandFrontmatter = z.infer<typeof CommandFrontmatterSchema>;
/**
 * Parse frontmatter from a markdown command file
 */
export declare function parseCommandFrontmatter(content: string): CommandFrontmatter | null;
/**
 * Path mapping from source to tool-specific paths
 */
export declare const PATH_TRANSFORMATIONS: Record<ToolType, (sourcePath: string) => string>;
/**
 * Transform a source path to the tool-specific destination path
 */
export declare function transformPath(sourcePath: string, tool: ToolType): string;
/**
 * Get the custom directory for a tool
 */
export declare function getToolCustomDir(tool: ToolType): string;
/**
 * Get the custom rules directory for a tool
 */
export declare function getToolRulesDir(tool: ToolType): string;
/**
 * Get the custom agents directory for a tool
 */
export declare function getToolAgentsDir(tool: ToolType): string;
//# sourceMappingURL=index.d.ts.map