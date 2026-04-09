#!/usr/bin/env node
import { Command } from 'commander';
import { detectTool, detectAllTools, getToolCustomDir, getToolRulesDir, getToolAgentsDir, getToolConfig, getFileCount, getPluginCounts, validateOverlaySync, hasFeature, } from './index.js';
import { getOverlayConfig, getGlobalConfig, getGlobalPlugins, saveGlobalPlugins, GLOBAL_CONFIG_FILE } from './config.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync, rmSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const program = new Command();
program
    .name('aidd-custom')
    .description('Custom AIDD overlay CLI — manage custom overlay and plugins')
    .version('1.0.0');
program
    .command('setup')
    .description('Configure global overlay repository')
    .option('-r, --repo <repo>', 'GitHub repository (e.g., username/overlay-repo)')
    .option('-b, --branch <branch>', 'Branch name', 'main')
    .action(async (options) => {
    if (!options.repo) {
        const globalConfig = getGlobalConfig();
        if (globalConfig) {
            console.log('Current configuration:');
            console.log(`  Repository: ${globalConfig.repo}`);
            console.log(`  Branch: ${globalConfig.branch}`);
        }
        else {
            console.log('No configuration found.');
            console.log('Run: aidd-custom setup -r username/overlay-repo');
        }
        return;
    }
    const config = {
        overlay: {
            repo: options.repo,
            branch: options.branch,
        },
    };
    writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`Configuration updated:`);
    console.log(`  Repository: ${options.repo}`);
    console.log(`  Branch: ${options.branch}`);
});
program
    .command('install')
    .description('Install base overlay and list available plugins')
    .option('--no-overlay', 'Skip base overlay installation')
    .option('--plugins-only', 'Install plugins only')
    .action(async (options) => {
    console.log('Installing aidd-custom overlay...\n');
    const tools = detectAllTools(process.cwd());
    if (tools.length === 0) {
        console.error('Error: No AIDD tool detected (.claude, .github, .cursor, .opencode)');
        process.exit(1);
    }
    console.log(`Detected tools: ${tools.join(', ')}\n`);
    if (!options.pluginsOnly && !options.noOverlay) {
        const projectRoot = process.cwd();
        const overlayConfig = getOverlayConfig(projectRoot);
        if (!overlayConfig) {
            console.log('No overlay configured. Run: aidd-custom setup');
            console.log('Creating tool directories without overlay...\n');
            for (const tool of tools) {
                const customDir = getToolCustomDir(tool);
                const fullPath = join(projectRoot, customDir);
                if (!existsSync(fullPath)) {
                    mkdirSync(fullPath, { recursive: true });
                    console.log(`Created: ${customDir}`);
                }
            }
            return;
        }
        console.log(`Installing overlay from ${overlayConfig.repo} (branch: ${overlayConfig.branch})`);
        const tempDir = join(projectRoot, '.cache', 'aidd-custom', 'overlay-temp');
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }
        mkdirSync(tempDir, { recursive: true });
        try {
            const repoUrl = `https://github.com/${overlayConfig.repo}.git`;
            execSync(`git clone --depth 1 --branch ${overlayConfig.branch} ${repoUrl} "${tempDir}"`, {
                cwd: projectRoot,
                stdio: 'pipe',
            });
            for (const tool of tools) {
                console.log(`\n=== Installing for ${tool} ===`);
                const toolConfig = getToolConfig(tool);
                if (hasFeature(tool, 'commands')) {
                    const customDir = toolConfig.commandsDir;
                    const fullPath = join(projectRoot, customDir);
                    const sourcePath = join(tempDir, 'commands', 'custom');
                    if (existsSync(sourcePath)) {
                        if (!existsSync(fullPath)) {
                            mkdirSync(fullPath, { recursive: true });
                        }
                        const transformFn = toolConfig.transform.commands;
                        const files = readdirSync(sourcePath).filter(f => f.endsWith('.md'));
                        for (const file of files) {
                            const srcFile = join(sourcePath, file);
                            const destFile = join(fullPath, file);
                            const content = readFileSync(srcFile, 'utf-8');
                            if (transformFn) {
                                const transformed = transformFn(content, file);
                                writeFileSync(destFile, transformed);
                            }
                            else {
                                cpSync(srcFile, destFile);
                            }
                        }
                        const count = files.length;
                        console.log(`Installed: ${customDir} (${count} files)`);
                    }
                }
                if (hasFeature(tool, 'rules')) {
                    const rulesDestPath = join(projectRoot, toolConfig.rulesDir);
                    const rulesSourcePath = join(tempDir, 'rules', 'custom');
                    if (existsSync(rulesSourcePath)) {
                        if (!existsSync(rulesDestPath)) {
                            mkdirSync(rulesDestPath, { recursive: true });
                        }
                        const transformFn = toolConfig.transform.rules;
                        const files = readdirSync(rulesSourcePath).filter(f => f.endsWith('.md'));
                        for (const file of files) {
                            const srcFile = join(rulesSourcePath, file);
                            const destFile = join(rulesDestPath, file);
                            const content = readFileSync(srcFile, 'utf-8');
                            if (transformFn) {
                                const transformed = transformFn(content, file);
                                writeFileSync(destFile, transformed);
                            }
                            else {
                                cpSync(srcFile, destFile);
                            }
                        }
                        const count = files.length;
                        console.log(`Installed: ${rulesDestPath} (${count} files)`);
                    }
                }
                if (hasFeature(tool, 'agents')) {
                    const agentsDestPath = join(projectRoot, toolConfig.agentsDir);
                    const agentsSourcePath = join(tempDir, 'agents');
                    if (existsSync(agentsSourcePath)) {
                        if (!existsSync(agentsDestPath)) {
                            mkdirSync(agentsDestPath, { recursive: true });
                        }
                        const transformFn = toolConfig.transform.agents;
                        const files = readdirSync(agentsSourcePath).filter(f => f.endsWith('.md') && f.startsWith('custom-'));
                        for (const file of files) {
                            const srcFile = join(agentsSourcePath, file);
                            const destFile = join(agentsDestPath, file);
                            const content = readFileSync(srcFile, 'utf-8');
                            if (transformFn) {
                                const transformed = transformFn(content, file);
                                writeFileSync(destFile, transformed);
                            }
                            else {
                                cpSync(srcFile, destFile);
                            }
                        }
                        if (files.length > 0) {
                            console.log(`Installed: ${agentsDestPath} (${files.length} files)`);
                        }
                    }
                }
                if (hasFeature(tool, 'skills')) {
                    const skillsSourcePath = join(tempDir, 'skills');
                    const skillsDir = tool === 'claude' ? '.claude/skills' : '.opencode/skills';
                    const skillsDestPath = join(projectRoot, skillsDir);
                    if (existsSync(skillsSourcePath)) {
                        if (!existsSync(skillsDestPath)) {
                            mkdirSync(skillsDestPath, { recursive: true });
                        }
                        cpSync(skillsSourcePath, skillsDestPath, { recursive: true });
                        const count = getFileCount(skillsDestPath);
                        console.log(`Installed: ${skillsDir} (${count} skills)`);
                    }
                }
                const instructionsFile = toolConfig.instructions;
                const instructionsPath = toolConfig.instructionsPath;
                if (tool === 'copilot') {
                    const copilotInstructionsPath = join(projectRoot, '.github', 'copilot-instructions.md');
                    if (!existsSync(copilotInstructionsPath) && !existsSync(join(projectRoot, '.github', 'instructions'))) {
                        console.log('Skipping Copilot (no .github/copilot-instructions.md or .github/instructions/)');
                    }
                    else {
                        const promptsSourcePath = join(tempDir, 'prompts', 'custom');
                        const promptsDestPath = join(projectRoot, toolConfig.commandsDir);
                        if (existsSync(promptsSourcePath)) {
                            if (!existsSync(promptsDestPath)) {
                                mkdirSync(promptsDestPath, { recursive: true });
                            }
                            const files = readdirSync(promptsSourcePath).filter(f => f.endsWith('.md'));
                            for (const file of files) {
                                const srcFile = join(promptsSourcePath, file);
                                const destFile = join(promptsDestPath, file);
                                cpSync(srcFile, destFile);
                            }
                            console.log(`Installed: ${toolConfig.commandsDir} (${files.length} prompts)`);
                        }
                        else {
                            const commandsSourcePath = join(tempDir, 'commands', 'custom');
                            if (existsSync(commandsSourcePath)) {
                                const transformFn = toolConfig.transform.commands;
                                mkdirSync(promptsDestPath, { recursive: true });
                                const files = readdirSync(commandsSourcePath).filter(f => f.endsWith('.md'));
                                for (const file of files) {
                                    const srcFile = join(commandsSourcePath, file);
                                    const destFile = join(promptsDestPath, file.replace('.md', '.prompt.md'));
                                    const content = readFileSync(srcFile, 'utf-8');
                                    if (transformFn) {
                                        const transformed = transformFn(content, file);
                                        writeFileSync(destFile, transformed);
                                    }
                                    else {
                                        cpSync(srcFile, destFile);
                                    }
                                }
                                console.log(`Installed: ${toolConfig.commandsDir} (${files.length} converted prompts)`);
                            }
                        }
                    }
                }
                if (instructionsFile && instructionsPath) {
                    let sourceInstructions = null;
                    if (tool === 'copilot') {
                        sourceInstructions = join(tempDir, 'instructions', 'copilot-instructions.md');
                    }
                    else {
                        sourceInstructions = join(tempDir, 'instructions', instructionsFile);
                    }
                    if (sourceInstructions && existsSync(sourceInstructions)) {
                        const destPath = join(projectRoot, instructionsPath, instructionsFile);
                        const destDir = join(projectRoot, instructionsPath);
                        if (!existsSync(destDir)) {
                            mkdirSync(destDir, { recursive: true });
                        }
                        cpSync(sourceInstructions, destPath);
                        console.log(`Installed: ${instructionsPath}/${instructionsFile}`);
                    }
                }
                else if (instructionsFile) {
                    const sourceInstructions = join(tempDir, 'instructions', instructionsFile);
                    if (existsSync(sourceInstructions)) {
                        const destPath = join(projectRoot, instructionsFile);
                        cpSync(sourceInstructions, destPath);
                        console.log(`Installed: ${instructionsFile} (project root)`);
                    }
                }
                const configFile = toolConfig.configFile;
                if (configFile) {
                    const sourceConfig = join(tempDir, 'instructions', configFile);
                    if (existsSync(sourceConfig)) {
                        const destConfig = join(projectRoot, configFile);
                        cpSync(sourceConfig, destConfig);
                        console.log(`Installed: ${configFile} (project root)`);
                    }
                }
            }
            const templatesSourcePath = join(tempDir, 'templates', 'custom');
            const templatesDestPath = join(projectRoot, 'aidd_docs/templates/custom');
            if (existsSync(templatesSourcePath)) {
                if (!existsSync(join(projectRoot, 'aidd_docs', 'templates'))) {
                    mkdirSync(join(projectRoot, 'aidd_docs', 'templates'), { recursive: true });
                }
                if (!existsSync(templatesDestPath)) {
                    mkdirSync(templatesDestPath, { recursive: true });
                }
                cpSync(templatesSourcePath, templatesDestPath, { recursive: true });
                const count = getFileCount(templatesDestPath);
                console.log(`\nInstalled: templates to aidd_docs/templates/custom (${count} files)`);
            }
            rmSync(tempDir, { recursive: true, force: true });
        }
        catch (e) {
            console.error(`Error installing overlay: ${e}`);
            if (existsSync(tempDir)) {
                rmSync(tempDir, { recursive: true, force: true });
            }
        }
    }
    console.log('\nRun "aidd-custom plugin list" to see available plugins');
});
program
    .command('clean')
    .description('Remove all overlay files')
    .action(async () => {
    const projectRoot = process.cwd();
    console.log('Cleaning overlay files...\n');
    const tools = detectAllTools(projectRoot);
    if (tools.length === 0) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tools: ${tools.join(', ')}\n`);
    const overlayConfig = getOverlayConfig(projectRoot);
    const templatesDir = 'aidd_docs/templates/custom';
    let cleaned = 0;
    for (const tool of tools) {
        const customDir = getToolCustomDir(tool);
        const rulesDir = getToolRulesDir(tool);
        const agentsDir = getToolAgentsDir(tool);
        if (hasFeature(tool, 'commands') && existsSync(join(projectRoot, customDir))) {
            const count = getFileCount(join(projectRoot, customDir));
            rmSync(join(projectRoot, customDir), { recursive: true, force: true });
            console.log(`Removed: ${customDir} (${count} files)`);
            cleaned++;
        }
        if (hasFeature(tool, 'rules') && existsSync(join(projectRoot, rulesDir))) {
            const count = getFileCount(join(projectRoot, rulesDir));
            rmSync(join(projectRoot, rulesDir), { recursive: true, force: true });
            console.log(`Removed: ${rulesDir} (${count} files)`);
            cleaned++;
        }
        if (hasFeature(tool, 'agents') && existsSync(join(projectRoot, agentsDir))) {
            const agentsFiles = readdirSync(join(projectRoot, agentsDir)).filter(f => f.startsWith('custom-') && f.endsWith('.md'));
            let count = 0;
            for (const file of agentsFiles) {
                rmSync(join(projectRoot, agentsDir, file), { force: true });
                count++;
            }
            if (count > 0) {
                console.log(`Removed: ${agentsDir} (${count} custom-* files)`);
                cleaned++;
            }
        }
        if (hasFeature(tool, 'skills')) {
            const skillsDir = tool === 'claude' ? '.claude/skills' : '.opencode/skills';
            if (existsSync(join(projectRoot, skillsDir))) {
                const count = getFileCount(join(projectRoot, skillsDir));
                rmSync(join(projectRoot, skillsDir), { recursive: true, force: true });
                console.log(`Removed: ${skillsDir} (${count} skills)`);
                cleaned++;
            }
        }
        if (tool === 'copilot') {
            const copilotInstructionsDir = join(projectRoot, '.github', 'instructions', 'custom');
            if (existsSync(copilotInstructionsDir)) {
                const count = getFileCount(copilotInstructionsDir);
                rmSync(copilotInstructionsDir, { recursive: true, force: true });
                console.log(`Removed: .github/instructions/custom (${count} files)`);
                cleaned++;
            }
            const copilotPromptsDir = join(projectRoot, '.github', 'prompts', 'custom');
            if (existsSync(copilotPromptsDir)) {
                const count = getFileCount(copilotPromptsDir);
                rmSync(copilotPromptsDir, { recursive: true, force: true });
                console.log(`Removed: .github/prompts/custom (${count} files)`);
                cleaned++;
            }
            const copilotInstructionsFile = join(projectRoot, '.github', 'copilot-instructions.md');
            if (existsSync(copilotInstructionsFile)) {
                rmSync(copilotInstructionsFile, { force: true });
                console.log(`Removed: .github/copilot-instructions.md`);
                cleaned++;
            }
        }
        if (tool === 'cursor') {
            const cursorInstructionsDir = join(projectRoot, '.cursor', 'rules');
            if (existsSync(cursorInstructionsDir)) {
                const count = getFileCount(cursorInstructionsDir);
                rmSync(cursorInstructionsDir, { recursive: true, force: true });
                console.log(`Removed: .cursor/rules (${count} files)`);
                cleaned++;
            }
        }
    }
    if (existsSync(join(projectRoot, templatesDir))) {
        const count = getFileCount(join(projectRoot, templatesDir));
        rmSync(join(projectRoot, templatesDir), { recursive: true, force: true });
        console.log(`Removed: ${templatesDir} (${count} files)`);
        cleaned++;
    }
    const plugins = getGlobalPlugins();
    if (Object.keys(plugins).length > 0) {
        saveGlobalPlugins({});
        console.log('Reset plugins configuration');
    }
    if (cleaned === 0) {
        console.log('No overlay files found');
    }
    else {
        console.log(`\nCleaned ${cleaned} item(s)`);
    }
});
program
    .command('doctor')
    .description('Verify installation health (checks for stale files)')
    .action(async () => {
    const projectRoot = process.cwd();
    console.log('Running health checks...\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tool: ${tool}`);
    console.log(`Project: ${projectRoot}\n`);
    console.log('=== Installation Status ===');
    const overlayConfig = getOverlayConfig(projectRoot);
    if (!overlayConfig) {
        console.log('Status: NOT INSTALLED');
        console.log('Run: aidd-custom install or aidd-custom setup');
        return;
    }
    const customDir = getToolCustomDir(tool);
    const rulesDir = getToolRulesDir(tool);
    const agentsDir = getToolAgentsDir(tool);
    const templatesDir = 'aidd_docs/templates/custom';
    const pluginsConfig = getGlobalPlugins();
    const checks = [
        { path: customDir, name: 'Commands' },
        { path: rulesDir, name: 'Rules' },
        { path: agentsDir, name: 'Agents' },
        { path: templatesDir, name: 'Templates' },
    ];
    console.log('');
    for (const check of checks) {
        const fullPath = join(projectRoot, check.path);
        if (existsSync(fullPath)) {
            const localCount = getFileCount(fullPath);
            console.log(`✓ ${check.name}: installed (${localCount} files)`);
        }
        else {
            console.log(`✗ ${check.name}: missing`);
        }
    }
    const installedPlugins = Object.entries(pluginsConfig)
        .filter(([_, v]) => v.installed)
        .map(([name]) => name);
    if (installedPlugins.length > 0) {
        console.log(`\n=== Installed Plugins (${installedPlugins.length}) ===`);
        for (const plugin of installedPlugins) {
            console.log(`  - ${plugin}`);
        }
    }
    if (overlayConfig) {
        console.log('\n=== File Count Validation ===');
        console.log('Fetching overlay to compare counts...\n');
        const tempDir = join(projectRoot, '.cache', 'aidd-custom', 'doctor-temp');
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }
        mkdirSync(tempDir, { recursive: true });
        try {
            const repoUrl = `https://github.com/${overlayConfig.repo}.git`;
            execSync(`git clone --depth 1 --branch ${overlayConfig.branch} ${repoUrl} "${tempDir}"`, {
                cwd: projectRoot,
                stdio: 'pipe',
            });
            const validation = validateOverlaySync({
                commands: join(projectRoot, customDir),
                rules: join(projectRoot, rulesDir),
                agents: join(projectRoot, agentsDir),
                templates: join(projectRoot, templatesDir),
            }, {
                commands: join(tempDir, 'commands', 'custom'),
                rules: join(tempDir, 'rules', 'custom'),
                agents: join(tempDir, 'agents'),
                templates: join(tempDir, 'templates', 'custom'),
            }, installedPlugins, join(tempDir, 'plugins'));
            let hasMismatch = false;
            console.log('File breakdown by source:');
            for (const detail of validation.details) {
                const pluginBreakdown = [];
                for (const pluginName of installedPlugins) {
                    const pluginDir = join(tempDir, 'plugins', pluginName);
                    if (existsSync(join(pluginDir, 'plugin.json'))) {
                        const pluginCounts = getPluginCounts(pluginDir);
                        const key = detail.category.toLowerCase();
                        if (pluginCounts[key] > 0) {
                            pluginBreakdown.push(`${pluginName}: ${pluginCounts[key]}`);
                        }
                    }
                }
                const pluginStr = pluginBreakdown.length > 0 ? ` + [${pluginBreakdown.join(', ')}]` : '';
                if (detail.localCount !== detail.expectedCount && detail.localCount > 0) {
                    console.log(`⚠ ${detail.category}: local=${detail.localCount}, overlay=${detail.overlayCount}${pluginStr}`);
                    hasMismatch = true;
                }
                else if (detail.localCount === detail.expectedCount && detail.localCount > 0) {
                    console.log(`✓ ${detail.category}: local=${detail.localCount}, overlay=${detail.overlayCount}${pluginStr}`);
                }
            }
            if (hasMismatch) {
                console.log('\n⚠ Stale files detected - run "clean" then "install" to sync');
            }
        }
        catch (e) {
            console.log('Warning: Could not fetch overlay for validation');
        }
        finally {
            if (existsSync(tempDir)) {
                rmSync(tempDir, { recursive: true, force: true });
            }
        }
    }
});
const pluginCmd = program
    .command('plugin')
    .description('Manage plugins');
pluginCmd
    .command('list')
    .description('List available plugins')
    .action(async () => {
    const projectRoot = process.cwd();
    console.log('Available Plugins');
    console.log('================\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    const overlayConfig = getOverlayConfig(projectRoot);
    const pluginsConfig = getGlobalPlugins();
    if (!overlayConfig) {
        console.log('No overlay configured. Run: aidd-custom setup');
        return;
    }
    console.log(`Fetching plugins from ${overlayConfig.repo}...`);
    const tempDir = join(projectRoot, '.cache', 'aidd-custom', 'plugins-temp');
    if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
    try {
        const repoUrl = `https://github.com/${overlayConfig.repo}.git`;
        execSync(`git clone --depth 1 --branch ${overlayConfig.branch} ${repoUrl} "${tempDir}"`, {
            cwd: projectRoot,
            stdio: 'pipe',
        });
        const pluginsDir = join(tempDir, 'plugins');
        if (!existsSync(pluginsDir)) {
            console.log('No plugins directory found in overlay');
            return;
        }
        const pluginDirs = readdirSync(pluginsDir).filter(f => {
            return existsSync(join(pluginsDir, f, 'plugin.json'));
        });
        if (pluginDirs.length === 0) {
            console.log('No plugins found in overlay');
            return;
        }
        console.log(`Found ${pluginDirs.length} plugin(s):\n`);
        for (const pluginName of pluginDirs) {
            const pluginJsonPath = join(pluginsDir, pluginName, 'plugin.json');
            const pluginData = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
            const isInstalled = pluginsConfig[pluginName]?.installed === true;
            console.log(`  ${pluginName}`);
            console.log(`    Description: ${pluginData.description || 'N/A'}`);
            console.log(`    Status: ${isInstalled ? 'installed' : 'available'}`);
            console.log('');
        }
    }
    catch (e) {
        console.error(`Error fetching plugins: ${e}`);
    }
    finally {
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    }
});
pluginCmd
    .command('add <name>')
    .description('Install a plugin')
    .action(async (name) => {
    const projectRoot = process.cwd();
    console.log(`Installing plugin: ${name}...\n`);
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    const overlayConfig = getOverlayConfig(projectRoot);
    if (!overlayConfig) {
        console.error('No overlay configured. Run: aidd-custom setup');
        return;
    }
    const pluginsConfig = getGlobalPlugins();
    const tempDir = join(projectRoot, '.cache', 'aidd-custom', 'plugin-temp');
    if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
    try {
        const repoUrl = `https://github.com/${overlayConfig.repo}.git`;
        execSync(`git clone --depth 1 --branch ${overlayConfig.branch} ${repoUrl} "${tempDir}"`, {
            cwd: projectRoot,
            stdio: 'pipe',
        });
        const pluginDir = join(tempDir, 'plugins', name);
        if (!existsSync(pluginDir)) {
            console.error(`Plugin "${name}" not found`);
            return;
        }
        const pluginJsonPath = join(pluginDir, 'plugin.json');
        if (!existsSync(pluginJsonPath)) {
            console.error(`Plugin "${name}" has no plugin.json`);
            return;
        }
        const pluginData = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
        console.log(`Installing ${name} v${pluginData.version}`);
        let installed = 0;
        const commandsSrc = join(pluginDir, 'commands');
        if (existsSync(commandsSrc)) {
            const commandsDest = join(projectRoot, getToolCustomDir(tool));
            if (!existsSync(commandsDest)) {
                mkdirSync(commandsDest, { recursive: true });
            }
            cpSync(commandsSrc, commandsDest, { recursive: true });
            console.log(`  Commands installed`);
            installed++;
        }
        const rulesSrc = join(pluginDir, 'rules');
        if (existsSync(rulesSrc)) {
            const rulesDest = join(projectRoot, getToolRulesDir(tool));
            if (!existsSync(rulesDest)) {
                mkdirSync(rulesDest, { recursive: true });
            }
            cpSync(rulesSrc, rulesDest, { recursive: true });
            console.log(`  Rules installed`);
            installed++;
        }
        const agentsSrc = join(pluginDir, 'agents');
        if (existsSync(agentsSrc)) {
            const agentsDest = join(projectRoot, getToolAgentsDir(tool));
            if (!existsSync(agentsDest)) {
                mkdirSync(agentsDest, { recursive: true });
            }
            const files = readdirSync(agentsSrc).filter(f => f.endsWith('.md') && f.startsWith('custom-'));
            for (const file of files) {
                cpSync(join(agentsSrc, file), join(agentsDest, file));
            }
            console.log(`  Agents installed`);
            installed++;
        }
        const templatesSrc = join(pluginDir, 'templates');
        if (existsSync(templatesSrc)) {
            const templatesDest = join(projectRoot, 'aidd_docs', 'templates');
            if (!existsSync(templatesDest)) {
                mkdirSync(templatesDest, { recursive: true });
            }
            cpSync(templatesSrc, templatesDest, { recursive: true });
            console.log(`  Templates installed`);
            installed++;
        }
        pluginsConfig[name] = { installed: true };
        saveGlobalPlugins(pluginsConfig);
        console.log(`\nPlugin "${name}" installed successfully`);
    }
    catch (e) {
        console.error(`Error installing plugin: ${e}`);
    }
    finally {
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    }
});
pluginCmd
    .command('remove <name>')
    .description('Remove a plugin (only removes files installed via plugin add)')
    .action(async (name) => {
    const projectRoot = process.cwd();
    console.log(`Removing plugin: ${name}...\n`);
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    const overlayConfig = getOverlayConfig(projectRoot);
    if (!overlayConfig) {
        console.error('No configuration found. Run: aidd-custom setup');
        return;
    }
    const pluginsConfig = getGlobalPlugins();
    if (!pluginsConfig[name]) {
        console.log(`Plugin "${name}" is not installed`);
        return;
    }
    console.log('Removing plugin files (installed via plugin add)...');
    const tempDir = join(projectRoot, '.cache', 'aidd-custom', 'plugin-temp-remove');
    if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
    try {
        if (overlayConfig) {
            const repoUrl = `https://github.com/${overlayConfig.repo}.git`;
            execSync(`git clone --depth 1 --branch ${overlayConfig.branch} ${repoUrl} "${tempDir}"`, {
                cwd: projectRoot,
                stdio: 'pipe',
            });
            const pluginDir = join(tempDir, 'plugins', name);
            if (!existsSync(join(pluginDir, 'plugin.json'))) {
                console.error(`Plugin "${name}" not found in overlay`);
                return;
            }
            const pluginData = JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf-8'));
            const commandsSrc = join(pluginDir, 'commands');
            if (existsSync(commandsSrc)) {
                const commandsDest = join(projectRoot, getToolCustomDir(tool));
                const copyRecursive = (src, dest, action) => {
                    if (!existsSync(src))
                        return;
                    const items = readdirSync(src);
                    for (const item of items) {
                        const srcPath = join(src, item);
                        const destPath = join(dest, item);
                        if (statSync(srcPath).isDirectory()) {
                            if (!existsSync(destPath)) {
                                mkdirSync(destPath, { recursive: true });
                            }
                            copyRecursive(srcPath, destPath, action);
                        }
                        else {
                            if (action === 'remove' && existsSync(destPath)) {
                                rmSync(destPath, { force: true });
                                console.log(`  Removed: commands/${name}/${item}`);
                            }
                        }
                    }
                };
                copyRecursive(commandsSrc, commandsDest, 'remove');
            }
            const rulesSrc = join(pluginDir, 'rules');
            if (existsSync(rulesSrc)) {
                const rulesDest = join(projectRoot, getToolRulesDir(tool));
                const ruleFiles = readdirSync(rulesSrc).filter(f => f.endsWith('.md'));
                for (const f of ruleFiles) {
                    const rulePath = join(rulesDest, f);
                    if (existsSync(rulePath)) {
                        rmSync(rulePath, { force: true });
                        console.log(`  Removed: rules/${f}`);
                    }
                }
            }
            const agentsSrc = join(pluginDir, 'agents');
            if (existsSync(agentsSrc)) {
                const agentsDest = join(projectRoot, getToolAgentsDir(tool));
                const agentFiles = readdirSync(agentsSrc).filter(f => f.endsWith('.md') && f.startsWith('custom-'));
                for (const f of agentFiles) {
                    const agentPath = join(agentsDest, f);
                    if (existsSync(agentPath)) {
                        rmSync(agentPath, { force: true });
                        console.log(`  Removed: agents/${f}`);
                    }
                }
            }
            const templatesSrc = join(pluginDir, 'templates');
            if (existsSync(templatesSrc)) {
                const templatesDest = join(projectRoot, 'aidd_docs', 'templates');
                const overlayTemplatesSrc = join(tempDir, 'templates', 'custom');
                const templateFiles = readdirSync(templatesSrc).filter(f => f.endsWith('.md'));
                let removedCount = 0;
                for (const f of templateFiles) {
                    const templatePath = join(templatesDest, f);
                    const inOverlay = existsSync(join(overlayTemplatesSrc, f));
                    if (existsSync(templatePath) && !inOverlay) {
                        rmSync(templatePath, { force: true });
                        removedCount++;
                    }
                }
                if (removedCount > 0) {
                    console.log(`  Removed: templates (${removedCount} files)`);
                }
                else {
                    console.log(`  Note: templates not removed (belong to overlay or shared)`);
                }
            }
        }
        delete pluginsConfig[name];
        saveGlobalPlugins(pluginsConfig);
        console.log(`\nPlugin "${name}" removed successfully`);
    }
    catch (e) {
        console.error(`Error removing plugin: ${e}`);
    }
    finally {
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    }
});
program.parse();
//# sourceMappingURL=cli.js.map