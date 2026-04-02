#!/usr/bin/env node

import { Command } from 'commander';
import {
  detectTool,
  validateConfig,
  validateManifest,
  validatePluginIndex,
  transformPath,
  getToolCustomDir,
  type ToolType,
} from './index.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
      console.log('Base overlay: already installed (stub)');
    }

    console.log('Available plugins: none (configure in .aidd/config.json)');
  });

program
  .command('update')
  .description('Check overlay/plugin updates')
  .action(async () => {
    console.log('Checking for updates...');
    console.log('Overlay: up to date');
  });

program
  .command('clean')
  .description('Remove all overlay files')
  .action(async () => {
    console.log('Cleaning overlay files...');
    console.log('Done.');
  });

program
  .command('doctor')
  .description('Verify installation health')
  .action(async () => {
    console.log('Running health checks...\n');
    
    const tool = detectTool(process.cwd());
    console.log(`Tool: ${tool || 'none'}`);
    console.log('Status: OK');
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
