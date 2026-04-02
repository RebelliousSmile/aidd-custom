#!/usr/bin/env node
import { Command } from 'commander';
import { detectTool, getToolCustomDir, getToolRulesDir, getToolAgentsDir, getFileCount, validateOverlaySync, } from './index.js';
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
        const configPath = join(projectRoot, 'config', 'global.json');
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
                console.error('Warning: Could not read config/global.json');
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
    console.log('Run "aidd-custom plugin list" to see available plugins');
});
program
    .command('clean')
    .description('Remove all overlay files')
    .action(async () => {
    const projectRoot = process.cwd();
    const configPath = join(projectRoot, 'config', 'global.json');
    console.log('Cleaning overlay files...\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tool: ${tool}`);
    if (!existsSync(configPath)) {
        console.log('No config/global.json found');
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
        console.log('Warning: Could not read config/global.json');
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
    .description('Verify installation health (checks for stale files)')
    .action(async () => {
    const projectRoot = process.cwd();
    const configPath = join(projectRoot, 'config', 'global.json');
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
    let overlayConfig = null;
    let pluginsConfig = {};
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.overlay?.repo) {
            overlayConfig = {
                repo: config.overlay.repo,
                branch: config.overlay.branch || 'main',
            };
        }
        pluginsConfig = config.plugins || {};
    }
    catch (e) {
        console.log('Warning: Could not read config/global.json');
    }
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
        const tempDir = join(projectRoot, '.aidd', 'cache', 'doctor-temp');
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
                agents: join(projectRoot, agentsDir, 'custom'),
                templates: join(projectRoot, templatesDir),
            }, {
                commands: join(tempDir, 'commands', 'custom'),
                rules: join(tempDir, 'rules', 'custom'),
                agents: join(tempDir, 'agents'),
                templates: join(tempDir, 'templates', 'custom'),
            }, installedPlugins, join(tempDir, 'plugins'));
            let hasMismatch = false;
            for (const detail of validation.details) {
                if (detail.localCount !== detail.expectedCount && detail.localCount > 0) {
                    console.log(`⚠ ${detail.category}: local (${detail.localCount}) ≠ expected (${detail.expectedCount} = ${detail.overlayCount} overlay + ${detail.pluginExtra} plugins)`);
                    hasMismatch = true;
                }
                else if (detail.localCount === detail.expectedCount && detail.localCount > 0) {
                    console.log(`✓ ${detail.category}: in sync (${detail.localCount} files)`);
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
    const configPath = join(projectRoot, 'config', 'global.json');
    console.log('Available Plugins');
    console.log('================\n');
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    if (!existsSync(configPath)) {
        console.log('No config/global.json found - run install first');
        return;
    }
    let overlayConfig = null;
    let pluginsConfig = {};
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.overlay?.repo) {
            overlayConfig = {
                repo: config.overlay.repo,
                branch: config.overlay.branch || 'main',
            };
        }
        pluginsConfig = config.plugins || {};
    }
    catch (e) {
        console.log('Warning: Could not read config/global.json');
    }
    if (!overlayConfig) {
        console.log('No overlay configured');
        return;
    }
    console.log(`Fetching plugins from ${overlayConfig.repo}...`);
    const tempDir = join(projectRoot, '.aidd', 'cache', 'plugins-temp');
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
    const configPath = join(projectRoot, 'config', 'global.json');
    console.log(`Installing plugin: ${name}...\n`);
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    if (!existsSync(configPath)) {
        console.error('No config/global.json found - run install first');
        return;
    }
    let overlayConfig = null;
    let pluginsConfig = {};
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.overlay?.repo) {
            overlayConfig = {
                repo: config.overlay.repo,
                branch: config.overlay.branch || 'main',
            };
        }
        pluginsConfig = config.plugins || {};
    }
    catch (e) {
        console.error('Error reading config/global.json');
        return;
    }
    if (!overlayConfig) {
        console.error('No overlay configured');
        return;
    }
    const tempDir = join(projectRoot, '.aidd', 'cache', 'plugin-temp');
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
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        config.plugins = pluginsConfig;
        writeFileSync(configPath, JSON.stringify(config, null, 2));
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
    const configPath = join(projectRoot, 'config', 'global.json');
    console.log(`Removing plugin: ${name}...\n`);
    const tool = detectTool(projectRoot);
    if (!tool) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    if (!existsSync(configPath)) {
        console.error('No config/global.json found');
        return;
    }
    let overlayConfig = null;
    let pluginsConfig = {};
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.overlay?.repo) {
            overlayConfig = {
                repo: config.overlay.repo,
                branch: config.overlay.branch || 'main',
            };
        }
        pluginsConfig = config.plugins || {};
    }
    catch (e) {
        console.error('Error reading config/global.json');
        return;
    }
    if (!pluginsConfig[name]) {
        console.log(`Plugin "${name}" is not installed`);
        return;
    }
    console.log('Removing plugin files (installed via plugin add)...');
    const tempDir = join(projectRoot, '.aidd', 'cache', 'plugin-temp-remove');
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
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        config.plugins = pluginsConfig;
        writeFileSync(configPath, JSON.stringify(config, null, 2));
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