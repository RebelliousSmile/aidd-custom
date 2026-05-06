import { z } from 'zod';
/**
 * Supported AI development tool types
 */
export type ToolType = 'claude' | 'copilot' | 'cursor' | 'opencode';
/**
 * Transformation function type
 */
export type TransformFn = (content: string, filename: string) => string;
/**
 * Tool configuration with transformation methods
 */
export interface ToolConfig {
    commandsDir: string;
    rulesDir: string;
    agentsDir: string;
    skillsDir: string | null;
    instructions: string | null;
    instructionsPath: string | null;
    configFile?: string;
    transform: {
        commands: TransformFn | null;
        rules: TransformFn | null;
        agents: TransformFn | null;
    };
}
/**
 * Directory structure for each tool
 */
export declare const TOOL_DIRECTORIES: Record<ToolType, string[]>;
/**
 * Tool configurations with specific transformation methods
 */
export declare const TOOL_CONFIGS: Record<ToolType, ToolConfig>;
/**
 * Detect which AIDD tool is configured based on directory structure
 */
export declare function detectTool(basePath: string): ToolType | null;
/**
 * Detect all AIDD tools present in the directory
 */
export declare function detectAllTools(basePath: string): ToolType[];
/**
 * Detect all tools synchronously with passed fs module (for testing)
 */
export declare function detectAllToolsSync(basePath: string, fsModule: {
    existsSync: typeof import('fs')['existsSync'];
}): ToolType[];
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
 * Get the rules directory for a tool
 */
export declare function getToolRulesDir(tool: ToolType): string;
/**
 * Get the agents directory for a tool
 */
export declare function getToolAgentsDir(tool: ToolType): string;
/**
 * Tool features support mapping (boolean capabilities only —
 * instructions/instructionsPath are in TOOL_CONFIGS to avoid duplication)
 */
export declare const TOOL_FEATURES: Record<ToolType, {
    commands: boolean;
    rules: boolean;
    agents: boolean;
    skills: boolean;
}>;
/**
 * Check if a tool supports a specific feature
 */
export declare function hasFeature(tool: ToolType, feature: 'commands' | 'rules' | 'agents' | 'skills'): boolean;
/**
 * Get instructions file name for a tool (delegates to TOOL_CONFIGS)
 */
export declare function getInstructionsFileName(tool: ToolType): string | null;
/**
 * Get instructions destination path for a tool (delegates to TOOL_CONFIGS)
 */
export declare function getInstructionsPath(tool: ToolType): string | null;
/**
 * Convert a rule file to MDC format for Cursor
 */
export declare function convertRuleToMdc(content: string, filename: string): string;
/**
 * Convert a command to Copilot prompt format
 */
export declare function convertCommandToPrompt(commandContent: string, filename: string): string;
/**
 * Convert rules content to Copilot instructions format
 */
export declare function convertRulesToCopilotInstructions(rulesContent: string, filename: string): string;
/**
 * Transform commands to OpenCode format
 */
export declare function transformCommandsToOpenCode(content: string, filename: string): string;
/**
 * Transform agents to OpenCode format
 */
export declare function transformAgentsToOpenCode(content: string, filename: string): string;
/**
 * Get tool configuration
 */
export declare function getToolConfig(tool: ToolType): ToolConfig;
/**
 * Count .md files recursively in a directory
 */
export declare function getFileCount(dirPath: string): number;
//# sourceMappingURL=index.d.ts.map