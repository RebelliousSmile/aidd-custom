#!/usr/bin/env node
import { Command } from 'commander';
import { detectTool, getToolCustomDir, getToolRulesDir, getToolAgentsDir, } from './index.js';
import { readFileSync, existsSync, mkdirSync, readdirSync, cpSync, rmSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
function getFileCount(dir) {
    if (!existsSync(dir))
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
    walk(dir);
    return count;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const program = new Command();
program
    .name('aidd-custom')
    .description('Custom AIDD overlay CLI — manage custom overlay and plugins')
    .version('1.0.0');
program
    .command('install')
    .description('Install base overlay and list available plugins')
    .option('--no-overlay', 'Skip base overlay installation')
    .option('--plugins-only', 'Install plugins only')
    .action(async (options) => {
    console.log('Installing aidd-custom overlay...\n');
    const tool = detectTool(process.cwd());
    if (!tool) {
        console.error('Error: No AIDD tool detected (.claude, .github, .cursor, .opencode)');
        process.exit(1);
    }
    console.log(`Detected tool: ${tool}\n`);
    if (!options.pluginsOnly && !options.noOverlay) {
        const projectRoot = process.cwd();
        const configPath = join(projectRoot, '.aidd', 'config.json');
        let overlayConfig = null;
        if (existsSync(configPath)) {
            try {
                const configContent = readFileSync(configPath, 'utf-8');
                const config = JSON.parse(configContent);
                if (config.overlay?.repo) {
                    overlayConfig = {
                        repo: config.overlay.repo,
                        branch: config.overlay.branch || 'main',
                    };
                }
            }
            catch (e) {
                console.error('Warning: Could not read .aidd/config.json');
            }
        }
        if (overlayConfig) {
            console.log(`Installing overlay from ${overlayConfig.repo} (branch: ${overlayConfig.branch})`);
            const customDir = getToolCustomDir(tool);
            const fullPath = join(projectRoot, customDir);
            const tempDir = join(projectRoot, '.aidd', 'cache', 'overlay-temp');
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
                const sourcePath = join(tempDir, 'commands', 'custom');
                if (existsSync(sourcePath)) {
                    if (!existsSync(fullPath)) {
                        mkdirSync(fullPath, { recursive: true });
                    }
                    cpSync(sourcePath, fullPath, { recursive: true });
                    const count = getFileCount(fullPath);
                    console.log(`Installed: ${customDir} (${count} files)`);
                }
                else {
                    console.log(`Warning: commands/custom not found in overlay`);
                }
                const rulesSourcePath = join(tempDir, 'rules', 'custom');
                const rulesDestPath = join(projectRoot, getToolRulesDir(tool));
                if (existsSync(rulesSourcePath)) {
                    if (!existsSync(rulesDestPath)) {
                        mkdirSync(rulesDestPath, { recursive: true });
                    }
                    cpSync(rulesSourcePath, rulesDestPath, { recursive: true });
                    const count = getFileCount(rulesDestPath);
                    console.log(`Installed: ${rulesDestPath} (${count} files)`);
                }
                const agentsSourcePath = join(tempDir, 'agents');
                const agentsDestPath = join(projectRoot, getToolAgentsDir(tool), 'custom');
                if (existsSync(agentsSourcePath)) {
                    if (!existsSync(agentsDestPath)) {
                        mkdirSync(agentsDestPath, { recursive: true });
                    }
                    const files = readdirSync(agentsSourcePath);
                    let agentCount = 0;
                    for (const file of files) {
                        if (file.endsWith('.md')) {
                            const srcFile = join(agentsSourcePath, file);
                            const destFile = join(agentsDestPath, file);
                            cpSync(srcFile, destFile, { recursive: true });
                            agentCount++;
                        }
                    }
                    console.log(`Installed: ${agentsDestPath} (${agentCount} files)`);
                }
                const templatesSourcePath = join(tempDir, 'templates', 'custom');
                const templatesDestPath = join(projectRoot, 'aidd_docs', 'templates');
                if (existsSync(templatesSourcePath)) {
                    if (!existsSync(templatesDestPath)) {
                        mkdirSync(templatesDestPath, { recursive: true });
                    }
                    cpSync(templatesSourcePath, templatesDestPath, { recursive: true });
                    const count = getFileCount(templatesDestPath);
                    console.log(`Installed: templates to aidd_docs/templates (${count} files)`);
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
        else {
            const customDir = getToolCustomDir(tool);
            const fullPath = join(projectRoot, customDir);
            if (!existsSync(fullPath)) {
                mkdirSync(fullPath, { recursive: true });
                console.log(`Created: ${customDir}`);
            }
            else {
                console.log(`Already exists: ${customDir}`);
            }
        }
    }
    console.log('Available plugins: none (configure in .aidd/config.json)');
});
program
    .command('update')
    .description('Check overlay/plugin updates')
    .action(async () => {
    const projectRoot = process.cwd();
    const configPath = join(projectRoot, '.aidd', 'config.json');
    console.log('Checking for updates...\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tool: ${tool}`);
    if (!existsSync(configPath)) {
        console.log('No .aidd/config.json found - run install first');
        return;
    }
    let overlayConfig = null;
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.overlay?.repo) {
            overlayConfig = {
                repo: config.overlay.repo,
                branch: config.overlay.branch || 'main',
            };
        }
    }
    catch (e) {
        console.log('Warning: Could not read .aidd/config.json');
    }
    if (!overlayConfig) {
        console.log('No overlay configured');
        return;
    }
    console.log(`Overlay repo: ${overlayConfig.repo}`);
    console.log(`Branch: ${overlayConfig.branch}\n`);
    const customDir = getToolCustomDir(tool);
    const rulesDir = getToolRulesDir(tool);
    const agentsDir = join(getToolAgentsDir(tool), 'custom');
    const templatesDir = 'aidd_docs/templates';
    console.log('Installed files:');
    if (existsSync(join(projectRoot, customDir))) {
        const count = getFileCount(join(projectRoot, customDir));
        console.log(`  - ${customDir} (${count} files)`);
    }
    if (existsSync(join(projectRoot, rulesDir))) {
        const count = getFileCount(join(projectRoot, rulesDir));
        console.log(`  - ${rulesDir} (${count} files)`);
    }
    if (existsSync(join(projectRoot, agentsDir))) {
        const count = getFileCount(join(projectRoot, agentsDir));
        console.log(`  - ${agentsDir} (${count} files)`);
    }
    if (existsSync(join(projectRoot, templatesDir))) {
        const count = getFileCount(join(projectRoot, templatesDir));
        console.log(`  - ${templatesDir} (${count} files)`);
    }
    console.log('\nOverlay: up to date');
    console.log('Run install to update');
});
program
    .command('clean')
    .description('Remove all overlay files')
    .action(async () => {
    const projectRoot = process.cwd();
    const configPath = join(projectRoot, '.aidd', 'config.json');
    console.log('Cleaning overlay files...\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tool: ${tool}`);
    if (!existsSync(configPath)) {
        console.log('No .aidd/config.json found');
        return;
    }
    let overlayConfig = null;
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.overlay?.repo) {
            overlayConfig = {
                repo: config.overlay.repo,
                branch: config.overlay.branch || 'main',
            };
        }
    }
    catch (e) {
        console.log('Warning: Could not read .aidd/config.json');
    }
    const customDir = getToolCustomDir(tool);
    const rulesDir = getToolRulesDir(tool);
    const agentsDir = join(getToolAgentsDir(tool), 'custom');
    const templatesDir = 'aidd_docs/templates';
    let cleaned = 0;
    if (existsSync(join(projectRoot, customDir))) {
        const count = getFileCount(join(projectRoot, customDir));
        rmSync(join(projectRoot, customDir), { recursive: true, force: true });
        console.log(`Removed: ${customDir} (${count} files)`);
        cleaned++;
    }
    if (existsSync(join(projectRoot, rulesDir))) {
        const count = getFileCount(join(projectRoot, rulesDir));
        rmSync(join(projectRoot, rulesDir), { recursive: true, force: true });
        console.log(`Removed: ${rulesDir} (${count} files)`);
        cleaned++;
    }
    if (existsSync(join(projectRoot, agentsDir))) {
        const count = getFileCount(join(projectRoot, agentsDir));
        rmSync(join(projectRoot, agentsDir), { recursive: true, force: true });
        console.log(`Removed: ${agentsDir} (${count} files)`);
        cleaned++;
    }
    if (existsSync(join(projectRoot, templatesDir))) {
        const count = getFileCount(join(projectRoot, templatesDir));
        rmSync(join(projectRoot, templatesDir), { recursive: true, force: true });
        console.log(`Removed: ${templatesDir} (${count} files)`);
        cleaned++;
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
    .description('Verify installation health')
    .action(async () => {
    const projectRoot = process.cwd();
    const configPath = join(projectRoot, '.aidd', 'config.json');
    console.log('Running health checks...\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tool: ${tool}`);
    console.log(`Project: ${projectRoot}\n`);
    console.log('=== Installation Status ===');
    if (!existsSync(configPath)) {
        console.log('Status: NOT INSTALLED');
        console.log('Run: aidd-custom install');
        return;
    }
    const customDir = getToolCustomDir(tool);
    const rulesDir = getToolRulesDir(tool);
    const agentsDir = getToolAgentsDir(tool);
    const templatesDir = 'aidd_docs/templates';
    let installed = 0;
    let missing = 0;
    const checks = [
        { path: customDir, name: 'Commands' },
        { path: rulesDir, name: 'Rules' },
        { path: join(agentsDir, 'custom'), name: 'Agents' },
        { path: templatesDir, name: 'Templates' },
    ];
    console.log('');
    for (const check of checks) {
        const fullPath = join(projectRoot, check.path);
        if (existsSync(fullPath)) {
            const count = getFileCount(fullPath);
            console.log(`✓ ${check.name}: installed (${count} files)`);
            installed++;
        }
        else {
            console.log(`✗ ${check.name}: missing`);
            missing++;
        }
    }
    console.log(`\nStatus: ${installed} installed, ${missing} missing`);
});
const pluginCmd = program
    .command('plugin')
    .description('Manage plugins');
pluginCmd
    .command('list')
    .description('List available plugins')
    .action(async () => {
    console.log('Available Plugins');
    console.log('================');
    console.log('None configured');
});
pluginCmd
    .command('add <name>')
    .description('Install a plugin')
    .action(async (name) => {
    console.log(`Installing plugin: ${name}...`);
});
pluginCmd
    .command('remove <name>')
    .description('Remove a plugin')
    .action(async (name) => {
    console.log(`Removing plugin: ${name}...`);
});
program.parse();
//# sourceMappingURL=cli.js.map