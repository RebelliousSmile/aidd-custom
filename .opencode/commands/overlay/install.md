---
name: 'aidd:overlay:install'
description: 'Install overlay plugins from a private repository'
argument-hint: '[--all|--plugin <name>...]'
---

# Overlay Install

## Goal

Install overlay plugins from a private GitHub repository into the current project.

## Rules

- Require authentication (run `aidd auth login` first)
- Require `repo` config to be set
- Backup existing files before overwriting
- Update manifest after installation

## Context

### Arguments

- `$ARGUMENTS` — `--all` or `--plugin <name>...`

### Configuration

Required in `.aidd/config.json`:
```json
{
  "overlay": {
    "repo": "owner/repo",
    "branch": "main"
  }
}
```

## Steps

### Step 1: Check Prerequisites

1. Verify authentication is configured (`aidd auth status`)
2. Read `overlay.repo` from config
3. Clone/fetch private repo to cache (`~/.cache/aidd-overlay/`)

### Step 2: Discover Plugins

1. Read `plugins/index.json` from cached repo
2. If not found, scan `plugins/*/` directories
3. Read `version.txt` for each plugin

### Step 3: Select Plugins

1. If `--all` flag provided → select all plugins
2. If `--plugin <name>` provided → validate plugins exist
3. If no flags → show interactive selection with @inquirer/checkbox
4. Display selected plugins list

### Step 4: Install Plugins

1. For each selected plugin:
   - Read plugin files from `plugins/<name>/.opencode/`
   - Copy files to project `.opencode/`
   - Detect conflicts with existing files
   - Create backup of conflicts in `.aidd-overlay/backups/`
2. Show progress: "Installing <plugin-name>..."

### Step 5: Update Manifest

1. Read or create `.aidd-overlay/manifest.json`
2. Add installed plugins with version and file list
3. Include file hashes for integrity checking
4. Write updated manifest

### Step 6: Report

1. Display installed plugins summary
2. Show any conflicts that were backed up
3. Point to `.aidd-overlay/backups/` for restore instructions
