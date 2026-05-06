#!/usr/bin/env node
import { Command } from 'commander';
import { detectAllTools, } from './index.js';
import { getOverlayConfig, getGlobalConfig, GLOBAL_CONFIG_FILE } from './config.js';
import { installToolOverlay, installTemplates, installGlobalOverlay, writeOverlayIndex, cleanByIndex, checkInstallStatus, compareWithOverlay, repairFromOverlay, } from './operations.js';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
function validateShellParam(value, label) {
    if (!/^[\w./@-]+$/.test(value)) {
        console.error(`Error: invalid ${label} "${value}" — only alphanumeric, ., /, @, - allowed`);
        process.exit(1);
    }
}
function cloneToTemp(repo, branch, cwd) {
    const tempDir = join(tmpdir(), 'aidd-custom', `overlay-${randomUUID()}`);
    mkdirSync(tempDir, { recursive: true });
    try {
        execSync(`git clone --depth 1 --branch ${branch} https://github.com/${repo}.git "${tempDir}"`, {
            ...(cwd ? { cwd } : {}),
            stdio: 'pipe',
        });
    }
    catch (e) {
        rmSync(tempDir, { recursive: true, force: true });
        throw e;
    }
    return tempDir;
}
const GLOBAL_CLAUDE_DIR = join(homedir(), '.claude');
const program = new Command();
program
    .name('aidd-custom')
    .description('Custom AIDD overlay CLI — manage custom overlay')
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
    validateShellParam(options.repo, 'repo');
    validateShellParam(options.branch, 'branch');
    const config = {
        overlay: {
            repo: options.repo,
            branch: options.branch,
        },
    };
    mkdirSync(dirname(GLOBAL_CONFIG_FILE), { recursive: true });
    writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`Configuration updated:`);
    console.log(`  Repository: ${options.repo}`);
    console.log(`  Branch: ${options.branch}`);
});
program
    .command('install')
    .description('Install base overlay')
    .option('--no-overlay', 'Skip base overlay installation')
    .option('--global', 'Install to ~/.claude (global, applies to all projects)')
    .action(async (options) => {
    console.log('Installing aidd-custom overlay...\n');
    if (options.global) {
        const globalRoot = GLOBAL_CLAUDE_DIR;
        const overlayConfig = getOverlayConfig(globalRoot);
        validateShellParam(overlayConfig.repo, 'repo');
        validateShellParam(overlayConfig.branch, 'branch');
        console.log(`Installing globally to ${globalRoot}`);
        console.log(`Overlay: ${overlayConfig.repo} (branch: ${overlayConfig.branch})\n`);
        let tempDir;
        try {
            tempDir = cloneToTemp(overlayConfig.repo, overlayConfig.branch);
            const files = installGlobalOverlay(globalRoot, tempDir);
            writeOverlayIndex(globalRoot, {
                repo: overlayConfig.repo,
                branch: overlayConfig.branch,
                installedAt: new Date().toISOString(),
                files,
            }, true);
            console.log(`Installed ${files.length} file(s) to ${globalRoot}`);
        }
        catch (e) {
            console.error(`Error installing overlay: ${e}`);
        }
        finally {
            if (tempDir)
                rmSync(tempDir, { recursive: true, force: true });
        }
        return;
    }
    const tools = detectAllTools(process.cwd());
    if (tools.length === 0) {
        console.error('Error: No AIDD tool detected (.claude, .github, .cursor, .opencode)');
        process.exit(1);
    }
    console.log(`Detected tools: ${tools.join(', ')}\n`);
    if (options.noOverlay) {
        console.log('Skipping overlay installation (--no-overlay)');
        return;
    }
    const projectRoot = process.cwd();
    const overlayConfig = getOverlayConfig(projectRoot);
    validateShellParam(overlayConfig.repo, 'repo');
    validateShellParam(overlayConfig.branch, 'branch');
    console.log(`Installing overlay from ${overlayConfig.repo} (branch: ${overlayConfig.branch})`);
    let tempDir;
    try {
        tempDir = cloneToTemp(overlayConfig.repo, overlayConfig.branch, projectRoot);
        const allFiles = [];
        for (const tool of tools) {
            console.log(`\n=== Installing for ${tool} ===`);
            allFiles.push(...installToolOverlay(tool, projectRoot, tempDir));
        }
        allFiles.push(...installTemplates(projectRoot, tempDir));
        writeOverlayIndex(projectRoot, {
            repo: overlayConfig.repo,
            branch: overlayConfig.branch,
            installedAt: new Date().toISOString(),
            files: allFiles,
            tools,
        });
        console.log(`\nInstalled ${allFiles.length} file(s)`);
    }
    catch (e) {
        console.error(`Error installing overlay: ${e}`);
    }
    finally {
        if (tempDir)
            rmSync(tempDir, { recursive: true, force: true });
    }
});
program
    .command('clean')
    .description('Remove all overlay files')
    .option('--global', 'Clean global ~/.claude install')
    .action(async (options) => {
    console.log('Cleaning overlay files...\n');
    if (options.global) {
        const cleaned = cleanByIndex(GLOBAL_CLAUDE_DIR, true);
        if (cleaned === 0) {
            console.log('No global overlay files found');
        }
        else {
            console.log(`\nCleaned ${cleaned} file(s)`);
        }
        return;
    }
    const projectRoot = process.cwd();
    const cleaned = cleanByIndex(projectRoot);
    if (cleaned === 0) {
        console.log('No overlay files found (no index)');
    }
    else {
        console.log(`\nCleaned ${cleaned} file(s)`);
    }
});
program
    .command('doctor')
    .description('Verify installation health (checks for stale files)')
    .action(async () => {
    const projectRoot = process.cwd();
    console.log('Running health checks...\n');
    const tools = detectAllTools(projectRoot);
    if (tools.length === 0) {
        console.error('Error: No AIDD tool detected');
        process.exit(1);
    }
    console.log(`Tools: ${tools.join(', ')}`);
    console.log(`Project: ${projectRoot}\n`);
    const overlayConfig = getOverlayConfig(projectRoot);
    validateShellParam(overlayConfig.repo, 'repo');
    validateShellParam(overlayConfig.branch, 'branch');
    console.log('=== Installation Status ===');
    let status = checkInstallStatus(projectRoot);
    console.log('');
    if (status.notIndexed) {
        console.log('⚠ No manifest found — creating it...\n');
        let tempDir;
        try {
            tempDir = cloneToTemp(overlayConfig.repo, overlayConfig.branch, projectRoot);
            const allFiles = [];
            for (const tool of tools) {
                allFiles.push(...installToolOverlay(tool, projectRoot, tempDir));
            }
            allFiles.push(...installTemplates(projectRoot, tempDir));
            writeOverlayIndex(projectRoot, {
                repo: overlayConfig.repo,
                branch: overlayConfig.branch,
                installedAt: new Date().toISOString(),
                files: allFiles,
                tools,
            });
            console.log(`✓ Manifest created (${allFiles.length} file(s) indexed)`);
            status = checkInstallStatus(projectRoot);
        }
        catch (e) {
            console.error(`Error creating manifest: ${e}`);
            process.exit(1);
        }
        finally {
            if (tempDir)
                rmSync(tempDir, { recursive: true, force: true });
        }
    }
    console.log(`✓ Installed from ${status.repo} @ ${status.branch}`);
    if (status.installedAt)
        console.log(`  Installed: ${new Date(status.installedAt).toLocaleString()}`);
    console.log(`  ${status.present}/${status.indexed} files present`);
    if (status.missing.length > 0) {
        console.log('  Missing:');
        for (const f of status.missing)
            console.log(`    - ${f}`);
    }
    console.log('\n=== File Count Validation ===');
    console.log('Fetching overlay to compare counts...\n');
    let tempDir;
    try {
        tempDir = cloneToTemp(overlayConfig.repo, overlayConfig.branch, projectRoot);
        const cmp = compareWithOverlay(projectRoot, tempDir);
        if (cmp.inSync) {
            console.log(`✓ In sync (${cmp.indexedCount} indexed, ${cmp.overlayCount} in overlay)`);
        }
        else {
            console.log(`⚠ Out of sync: indexed=${cmp.indexedCount}, overlay=${cmp.overlayCount}`);
            if (cmp.missingFromDisk.length > 0) {
                console.log('  Missing from disk:');
                for (const f of cmp.missingFromDisk)
                    console.log(`    - ${f}`);
                console.log('\nRepairing missing files...');
                repairFromOverlay(projectRoot, tempDir);
                console.log('✓ Repaired');
            }
            else {
                console.log('\nRun "clean" then "install" to sync');
            }
        }
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`Warning: Could not fetch overlay for validation — ${msg}`);
    }
    finally {
        if (tempDir)
            rmSync(tempDir, { recursive: true, force: true });
    }
});
program.parse();
//# sourceMappingURL=cli.js.map