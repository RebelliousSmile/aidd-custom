---
name: 'aidd:overlay:plugin:remove'
description: 'Remove an installed overlay plugin'
argument-hint: '<plugin-name> [--force]'
---

# Overlay Plugin Remove

## Goal

Remove an installed plugin and its files from the project.

## Rules

- Require `--force` flag in non-interactive mode
- Prompt for confirmation in interactive mode
- Delete plugin files from `.opencode/`
- Update manifest
- Keep backups for safety

## Context

### Arguments

- `$1` — Plugin name
- `--force` — Skip confirmation

## Steps

### Step 1: Validate Plugin Name

1. Extract plugin name from arguments
2. Read `.aidd-overlay/manifest.json`
3. Verify plugin is installed
4. Exit with error if not installed

### Step 2: Confirm Removal

1. If `--force` flag provided → skip confirmation
2. Otherwise, prompt with @inquirer/confirm:
   ```
   Remove plugin '<name>' and delete X files?
   This will remove:
   - .opencode/rules/custom/...
   - .opencode/commands/custom/...
   
   [y/N]
   ```

### Step 3: Remove Plugin Files

1. Read file list from manifest for plugin
2. Delete each file from `.opencode/`
3. Show progress: "Removing <plugin-name>..."
4. Do NOT delete parent directories (may contain other plugins)

### Step 4: Update Manifest

1. Remove plugin from manifest
2. Remove plugin's files from manifest
3. Write updated manifest

### Step 5: Report

1. Display removal summary
2. Show files deleted
3. Point to `.aidd-overlay/backups/` for restore instructions
