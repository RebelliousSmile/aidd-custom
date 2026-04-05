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
        commandsDir: '.claude/commands/custom',
        rulesDir: '.claude/rules/custom',
        agentsDir: '.claude/agents/custom',
        templatesDir: 'aidd_docs/templates/custom',
        instructions: 'CLAUDE.md',
        instructionsPath: null,
        transform: {
            commands: null,
            rules: null,
            agents: null,
        },
    },
    opencode: {
        commandsDir: '.opencode/commands/aidd/custom',
        rulesDir: '.opencode/rules/custom',
        agentsDir: '.opencode/agents/custom',
        templatesDir: 'aidd_docs/templates/custom',
        instructions: 'AGENTS.md',
        instructionsPath: null,
        configFile: 'opencode.json',
        transform: {
            commands: transformCommandsToOpenCode,
            rules: transformRulesToOpenCode,
            agents: transformAgentsToOpenCode,
        },
    },
    cursor: {
        commandsDir: '.cursor/commands',
        rulesDir: '.cursor/rules',
        agentsDir: '.cursor/agents',
        templatesDir: 'aidd_docs/templates/custom',
        instructions: '.mdc',
        instructionsPath: '.cursor/rules',
        transform: {
            commands: transformCommandsToCursor,
            rules: convertRuleToMdc,
            agents: null,
        },
    },
    copilot: {
        commandsDir: '.github/prompts/custom',
        rulesDir: '.github/instructions/custom',
        agentsDir: '.github/agents',
        templatesDir: 'aidd_docs/templates/custom',
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
 * Validate overlay configuration from config.json
 */
export function validateConfig(config) {
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
 * Validate manifest.json
 */
export function validateManifest(manifest) {
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
 * Validate plugin index.json
 */
export function validatePluginIndex(index) {
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
 * Parse frontmatter from a markdown command file
 */
export function parseCommandFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match)
        return null;
    const yaml = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1)
            continue;
        const key = line.slice(0, colonIndex).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key)
            yaml[key] = value;
    }
    try {
        return CommandFrontmatterSchema.parse(yaml);
    }
    catch {
        return null;
    }
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
    const dirs = {
        claude: '.claude/commands/custom',
        copilot: '.github/prompts/custom',
        cursor: '.cursor/commands',
        opencode: '.opencode/commands/aidd/custom',
    };
    return dirs[tool];
}
/**
 * Get the custom rules directory for a tool
 */
export function getToolRulesDir(tool) {
    const dirs = {
        claude: '.claude/rules/custom',
        copilot: '.github/instructions',
        cursor: '.cursor/rules',
        opencode: '.opencode/rules',
    };
    return dirs[tool];
}
/**
 * Get the agents directory for a tool
 */
export function getToolAgentsDir(tool) {
    const dirs = {
        claude: '.claude/agents',
        copilot: '.github/agents',
        cursor: '.cursor/agents',
        opencode: '.opencode/agents',
    };
    return dirs[tool];
}
/**
 * Tool features support mapping
 */
export const TOOL_FEATURES = {
    claude: {
        commands: true,
        rules: true,
        agents: true,
        skills: true,
        instructions: 'CLAUDE.md',
        instructionsPath: null,
    },
    opencode: {
        commands: true,
        rules: true,
        agents: true,
        skills: true,
        instructions: 'AGENTS.md',
        instructionsPath: null,
    },
    cursor: {
        commands: true,
        rules: true,
        agents: false,
        skills: false,
        instructions: '.mdc',
        instructionsPath: '.cursor/rules',
    },
    copilot: {
        commands: false,
        rules: true,
        agents: false,
        skills: false,
        instructions: 'copilot-instructions.md',
        instructionsPath: '.github',
    },
};
/**
 * Check if a tool supports a specific feature
 */
export function hasFeature(tool, feature) {
    return TOOL_FEATURES[tool][feature];
}
/**
 * Get instructions file name for a tool
 */
export function getInstructionsFileName(tool) {
    return TOOL_FEATURES[tool].instructions;
}
/**
 * Get instructions destination path for a tool
 */
export function getInstructionsPath(tool) {
    return TOOL_FEATURES[tool].instructionsPath;
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

## Quand utiliser
- Lorsque vous avez besoin de: ${name.toLowerCase()}

## Contexte additionnel
- Utiliser les standards de codage du projet
- Vérifier la sécurité et performance
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
 * Transform rules to OpenCode format
 */
export function transformRulesToOpenCode(content, filename) {
    return content;
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
 * Transform commands to Cursor format
 */
export function transformCommandsToCursor(content, filename) {
    return content;
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
export function getPluginCounts(pluginDir) {
    return {
        commands: getFileCount(join(pluginDir, 'commands')),
        rules: getFileCount(join(pluginDir, 'rules')),
        agents: getFileCount(join(pluginDir, 'agents')),
        templates: getFileCount(join(pluginDir, 'templates')),
    };
}
/**
 * Compare local files with overlay + plugins expected counts
 */
export function validateOverlaySync(localPaths, overlayPaths, installedPlugins, pluginsDir) {
    const categories = [
        { key: 'commands', name: 'Commands', pluginKey: 'commands' },
        { key: 'rules', name: 'Rules', pluginKey: 'rules' },
        { key: 'agents', name: 'Agents', pluginKey: 'agents' },
        { key: 'templates', name: 'Templates', pluginKey: 'templates' },
    ];
    const details = [];
    let isValid = true;
    for (const cat of categories) {
        const localCount = getFileCount(localPaths[cat.key]);
        const overlayCount = getFileCount(overlayPaths[cat.key]);
        let pluginExtra = 0;
        if (cat.pluginKey) {
            for (const pluginName of installedPlugins) {
                const pluginDir = join(pluginsDir, pluginName);
                const pluginCount = getPluginCounts(pluginDir)[cat.pluginKey];
                if (cat.key === 'templates') {
                    const overlayFiles = new Set(readdirSync(overlayPaths.templates).filter(f => f.endsWith('.md')));
                    const pluginFiles = existsSync(join(pluginDir, 'templates'))
                        ? readdirSync(join(pluginDir, 'templates')).filter(f => f.endsWith('.md'))
                        : [];
                    const uniqueFromPlugin = pluginFiles.filter(f => !overlayFiles.has(f));
                    pluginExtra += uniqueFromPlugin.length;
                }
                else {
                    pluginExtra += pluginCount;
                }
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
//# sourceMappingURL=index.js.map