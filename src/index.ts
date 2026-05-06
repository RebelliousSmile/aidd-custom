import { z } from 'zod';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export type ToolType = 'claude' | 'copilot' | 'cursor' | 'opencode';

export type TransformFn = (content: string, filename: string) => string;

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

export const TOOL_DIRECTORIES: Record<ToolType, string[]> = {
  claude:   ['.claude'],
  copilot:  ['.github'],
  cursor:   ['.cursor'],
  opencode: ['.opencode'],
};

export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  claude: {
    commandsDir: '.claude/commands',
    rulesDir: '.claude/rules',
    agentsDir: '.claude/agents',
    skillsDir: '.claude/skills',
    instructions: 'CLAUDE.md',
    instructionsPath: null,
    transform: { commands: null, rules: null, agents: null },
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
    transform: { commands: null, rules: convertRuleToMdc, agents: null },
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

// ─── tool detection ───────────────────────────────────────────────────────────

function toolDirsExist(basePath: string, dirs: string[]): boolean {
  return dirs.some(dir => {
    try { return existsSync(join(basePath, dir)); }
    catch { return false; }
  });
}

export function detectTool(basePath: string): ToolType | null {
  for (const [tool, dirs] of Object.entries(TOOL_DIRECTORIES)) {
    if (toolDirsExist(basePath, dirs)) return tool as ToolType;
  }
  return null;
}

export function detectAllTools(basePath: string): ToolType[] {
  return (Object.entries(TOOL_DIRECTORIES) as [ToolType, string[]][])
    .filter(([, dirs]) => toolDirsExist(basePath, dirs))
    .map(([tool]) => tool);
}

// ─── config schema ────────────────────────────────────────────────────────────

export const OverlayConfigSchema = z.object({
  overlay: z.object({
    repo: z.string().min(1, 'Repository is required'),
    branch: z.string().min(1, 'Branch is required').default('main'),
  }).required(),
});

export type OverlayConfig = z.infer<typeof OverlayConfigSchema>;

export function validateConfig(config: unknown): OverlayConfig {
  return OverlayConfigSchema.parse(config);
}

// ─── tool metadata ────────────────────────────────────────────────────────────

export const TOOL_FEATURES: Record<ToolType, {
  commands: boolean;
  rules: boolean;
  agents: boolean;
  skills: boolean;
}> = {
  claude:   { commands: true,  rules: true,  agents: true,  skills: true  },
  opencode: { commands: true,  rules: true,  agents: true,  skills: true  },
  cursor:   { commands: true,  rules: true,  agents: false, skills: false },
  copilot:  { commands: false, rules: true,  agents: false, skills: false },
};

export function hasFeature(tool: ToolType, feature: 'commands' | 'rules' | 'agents' | 'skills'): boolean {
  return TOOL_FEATURES[tool][feature];
}

export function getToolConfig(tool: ToolType): ToolConfig {
  return TOOL_CONFIGS[tool];
}

export function getInstructionsFileName(tool: ToolType): string | null {
  return TOOL_CONFIGS[tool].instructions;
}

export function getInstructionsPath(tool: ToolType): string | null {
  return TOOL_CONFIGS[tool].instructionsPath;
}

// ─── format transforms ────────────────────────────────────────────────────────

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && value) result[key] = value;
  }
  return result;
}

function extractBody(content: string): string {
  const bodyStart = content.indexOf('---', 3);
  return bodyStart > -1 ? content.slice(bodyStart + 3).trim() : content;
}

export function convertRuleToMdc(content: string, filename: string): string {
  if (content.startsWith('---')) return content;
  const name = filename.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const description = content.slice(0, 200).split('\n')[0].replace(/^#*\s*/, '');
  return `---\ndescription: ${description || name}\n---\n# ${name}\n\n${content}\n`;
}

export function convertCommandToPrompt(commandContent: string, filename: string): string {
  const name = filename.replace(/\.md$/, '').replace(/-/g, ' ');
  const descriptionMatch = commandContent.match(/description:\s*(.+)/);
  const description = descriptionMatch ? descriptionMatch[1] : name;
  const body = extractBody(commandContent);
  return `# ${name}\n\n## Description\n${description}\n\n## Instructions\n${body}\n`;
}

export function convertRulesToCopilotInstructions(rulesContent: string, filename: string): string {
  const name = filename.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `---\napplyTo: "**"\n---\n# ${name}\n\n${rulesContent}\n`;
}

export function transformCommandsToOpenCode(content: string, filename: string): string {
  const fm = parseFrontmatter(content);
  const name = filename.replace(/\.md$/, '');
  const description = fm.description || name;
  const argumentHint = fm['argument-hint'] || '';
  const body = extractBody(content);
  return [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    argumentHint ? `argument-hint: ${argumentHint}` : '',
    '---',
    '',
    body,
  ].filter(Boolean).join('\n');
}

export function transformAgentsToOpenCode(content: string, filename: string): string {
  const fm = parseFrontmatter(content);
  const name = filename.replace(/\.md$/, '');
  const description = fm.description || `Agent for ${name}`;
  const header = [
    '---',
    `description: ${description}`,
    `mode: ${fm.mode || 'subagent'}`,
    fm.model ? `model: ${fm.model}` : '',
    fm.temperature ? `temperature: ${fm.temperature}` : '',
    '---',
    '',
  ].filter(Boolean).join('\n');
  return `${header}\n${extractBody(content)}`;
}

// ─── file utilities ───────────────────────────────────────────────────────────

export function getFileCount(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let count = 0;
  const walk = (d: string) => {
    for (const item of readdirSync(d)) {
      const full = join(d, item);
      if (statSync(full).isDirectory()) walk(full);
      else if (item.endsWith('.md')) count++;
    }
  };
  walk(dirPath);
  return count;
}
