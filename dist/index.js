import { z } from 'zod';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
/**
 * Directory structure for each tool
 */
export const TOOL_DIRECTORIES = {
    claude: ['.claude'],
    copilot: ['.github'],
    cursor: ['.cursor'],
    opencode: ['.opencode'],
};
/**
 * Tool configurations with specific transformation methods
 */
export const TOOL_CONFIGS = {
    claude: {
        commandsDir: '.claude/commands',
        rulesDir: '.claude/rules',
        agentsDir: '.claude/agents',
        skillsDir: '.claude/skills',
        instructions: 'CLAUDE.md',
        instructionsPath: null,
        transform: {
            commands: null,
            rules: null,
            agents: null,
        },
    },
    opencode: {
        commandsDir: '.opencode/commands',
        rulesDir: '.opencode/rules',
        agentsDir: '.opencode/agents',
        skillsDir: '.opencode/skills',
        instructions: 'AGENTS.md',
        instructionsPath: null,
        configFile: 'opencode.json',
        transform: {
            commands: transformCommandsToOpenCode,
            rules: null,
            agents: transformAgentsToOpenCode,
        },
    },
    cursor: {
        commandsDir: '.cursor/commands',
        rulesDir: '.cursor/rules',
        agentsDir: '.cursor/agents',
        skillsDir: null,
        instructions: '.mdc',
        instructionsPath: '.cursor/rules',
        transform: {
            commands: null,
            rules: convertRuleToMdc,
            agents: null,
        },
    },
    copilot: {
        commandsDir: '.github/prompts',
        rulesDir: '.github/instructions',
        agentsDir: '.github/agents',
        skillsDir: null,
        instructions: 'copilot-instructions.md',
        instructionsPath: '.github',
        transform: {
            commands: convertCommandToPrompt,
            rules: convertRulesToCopilotInstructions,
            agents: null,
        },
    },
};
/**
 * Detect which AIDD tool is configured based on directory structure
 */
export function detectTool(basePath) {
    for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
        const toolType = tool;
        const exists = dirs.some((dir) => {
            try {
                return existsSync(join(basePath, dir));
            }
            catch {
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
 * Detect all AIDD tools present in the directory
 */
export function detectAllTools(basePath) {
    const tools = [];
    for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
        const toolType = tool;
        const exists = dirs.some((dir) => {
            try {
                return existsSync(join(basePath, dir));
            }
            catch {
                return false;
            }
        });
        if (exists) {
            tools.push(toolType);
        }
    }
    return tools;
}
/**
 * Detect all tools synchronously with passed fs module (for testing)
 */
export function detectAllToolsSync(basePath, fsModule) {
    const tools = [];
    for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
        const toolType = tool;
        const exists = dirs.some((dir) => fsModule.existsSync(join(basePath, dir)));
        if (exists) {
            tools.push(toolType);
        }
    }
    return tools;
}
/**
 * Detect tool synchronously with passed fs module (for testing)
 */
export function detectToolSync(basePath, fsModule) {
    for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
        const toolType = tool;
        const exists = dirs.some((dir) => fsModule.existsSync(join(basePath, dir)));
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
 * Validate overlay configuration from config.json
 */
export function validateConfig(config) {
    return OverlayConfigSchema.parse(config);
}
/**
 * Path mapping from source to tool-specific paths
 */
export const PATH_TRANSFORMATIONS = {
    claude: (source) => source.replace(/^overlay\//, '.claude/'),
    copilot: (source) => source.replace(/^overlay\//, '.github/'),
    cursor: (source) => source.replace(/^overlay\//, '.cursor/'),
    opencode: (source) => source,
};
/**
 * Transform a source path to the tool-specific destination path
 */
export function transformPath(sourcePath, tool) {
    const transformer = PATH_TRANSFORMATIONS[tool];
    return transformer(sourcePath);
}
/**
 * Get the custom directory for a tool
 */
export function getToolCustomDir(tool) {
    return TOOL_CONFIGS[tool].commandsDir;
}
/**
 * Get the rules directory for a tool
 */
export function getToolRulesDir(tool) {
    return TOOL_CONFIGS[tool].rulesDir;
}
/**
 * Get the agents directory for a tool
 */
export function getToolAgentsDir(tool) {
    return TOOL_CONFIGS[tool].agentsDir;
}
/**
 * Tool features support mapping (boolean capabilities only —
 * instructions/instructionsPath are in TOOL_CONFIGS to avoid duplication)
 */
export const TOOL_FEATURES = {
    claude: { commands: true, rules: true, agents: true, skills: true },
    opencode: { commands: true, rules: true, agents: true, skills: true },
    cursor: { commands: true, rules: true, agents: false, skills: false },
    copilot: { commands: false, rules: true, agents: false, skills: false },
};
/**
 * Check if a tool supports a specific feature
 */
export function hasFeature(tool, feature) {
    return TOOL_FEATURES[tool][feature];
}
/**
 * Get instructions file name for a tool (delegates to TOOL_CONFIGS)
 */
export function getInstructionsFileName(tool) {
    return TOOL_CONFIGS[tool].instructions;
}
/**
 * Get instructions destination path for a tool (delegates to TOOL_CONFIGS)
 */
export function getInstructionsPath(tool) {
    return TOOL_CONFIGS[tool].instructionsPath;
}
/**
 * Convert a rule file to MDC format for Cursor
 */
export function convertRuleToMdc(content, filename) {
    const name = filename.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const hasFrontmatter = content.startsWith('---');
    if (hasFrontmatter) {
        return content;
    }
    const description = content.slice(0, 200).split('\n')[0].replace(/^#*\s*/, '');
    return `---
description: ${description || name}
---
# ${name}

${content}
`;
}
/**
 * Convert a command to Copilot prompt format
 */
export function convertCommandToPrompt(commandContent, filename) {
    const name = filename.replace(/\.md$/, '').replace(/-/g, ' ');
    const descriptionMatch = commandContent.match(/description:\s*(.+)/);
    const description = descriptionMatch ? descriptionMatch[1] : name;
    const bodyStart = commandContent.indexOf('---', 3);
    const body = bodyStart > -1 ? commandContent.slice(bodyStart + 3).trim() : commandContent;
    return `# ${name}

## Description
${description}

## Instructions
${body}
`;
}
/**
 * Convert rules content to Copilot instructions format
 */
export function convertRulesToCopilotInstructions(rulesContent, filename) {
    const name = filename.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `---
applyTo: "**"
---
# ${name}

${rulesContent}
`;
}
/**
 * Transform commands to OpenCode format
 */
export function transformCommandsToOpenCode(content, filename) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let frontmatter = {};
    if (frontmatterMatch) {
        const lines = frontmatterMatch[1].split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key && value)
                frontmatter[key] = value;
        }
    }
    const name = filename.replace(/\.md$/, '');
    const description = frontmatter.description || name;
    const argumentHint = frontmatter['argument-hint'] || '';
    const bodyStart = content.indexOf('---', 3);
    const body = bodyStart > -1 ? content.slice(bodyStart + 3).trim() : content;
    const newFrontmatter = [
        '---',
        `name: ${name}`,
        `description: ${description}`,
        argumentHint ? `argument-hint: ${argumentHint}` : '',
        '---',
        '',
        body,
    ].filter(Boolean).join('\n');
    return newFrontmatter;
}
/**
 * Transform agents to OpenCode format
 */
export function transformAgentsToOpenCode(content, filename) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let frontmatter = {};
    if (frontmatterMatch) {
        const lines = frontmatterMatch[1].split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key && value)
                frontmatter[key] = value;
        }
    }
    const name = filename.replace(/\.md$/, '');
    const description = frontmatter.description || `Agent for ${name}`;
    const newFrontmatter = [
        '---',
        `description: ${description}`,
        frontmatter.mode ? `mode: ${frontmatter.mode}` : 'mode: subagent',
        frontmatter.model ? `model: ${frontmatter.model}` : '',
        frontmatter.temperature ? `temperature: ${frontmatter.temperature}` : '',
        '---',
        '',
    ].filter(Boolean).join('\n');
    const bodyStart = content.indexOf('---', 3);
    const body = bodyStart > -1 ? content.slice(bodyStart + 3).trim() : content;
    return `${newFrontmatter}\n${body}`;
}
/**
 * Get tool configuration
 */
export function getToolConfig(tool) {
    return TOOL_CONFIGS[tool];
}
/**
 * Count .md files recursively in a directory
 */
export function getFileCount(dirPath) {
    if (!existsSync(dirPath))
        return 0;
    let count = 0;
    const walk = (d) => {
        const items = readdirSync(d);
        for (const item of items) {
            const fullPath = join(d, item);
            if (statSync(fullPath).isDirectory()) {
                walk(fullPath);
            }
            else if (item.endsWith('.md')) {
                count++;
            }
        }
    };
    walk(dirPath);
    return count;
}
//# sourceMappingURL=index.js.map