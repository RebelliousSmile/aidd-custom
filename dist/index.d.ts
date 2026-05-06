import { z } from 'zod';
export type ToolType = 'claude' | 'copilot' | 'cursor' | 'opencode';
type TransformFn = (content: string, filename: string) => string;
export interface ToolConfig {
    commandsDir: string;
    rulesDir: string;
    agentsDir: string;
    skillsDir: string | null;
    instructions: string | null;
    instructionsPath: string | null;
    transform: {
        commands: TransformFn | null;
        rules: TransformFn | null;
        agents: TransformFn | null;
    };
}
export declare const TOOL_DIRECTORIES: Record<ToolType, string[]>;
export declare const TOOL_CONFIGS: Record<ToolType, ToolConfig>;
export declare function detectTool(basePath: string): ToolType | null;
export declare function detectAllTools(basePath: string): ToolType[];
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
export type OverlayConfig = z.infer<typeof OverlayConfigSchema>;
export declare function validateConfig(config: unknown): OverlayConfig;
export declare function hasFeature(tool: ToolType, feature: 'commands' | 'rules' | 'agents' | 'skills'): boolean;
export declare function getToolConfig(tool: ToolType): ToolConfig;
export declare function getInstructionsFileName(tool: ToolType): string | null;
export declare function getInstructionsPath(tool: ToolType): string | null;
export declare function convertRuleToMdc(content: string, filename: string): string;
export declare function convertCommandToPrompt(commandContent: string, filename: string): string;
export declare function convertRulesToCopilotInstructions(rulesContent: string, filename: string): string;
export declare function getFileCount(dirPath: string): number;
export {};
//# sourceMappingURL=index.d.ts.map