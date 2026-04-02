---
name: 'aidd:custom:plugin:remove'
description: 'Remove an installed custom plugin'
argument-hint: '<plugin-name> [--force]'
---

# Custom Plugin Remove

## Goal

Remove an installed plugin and its files from the project.

## Rules

- Require `--force` flag in non-interactive mode
- Prompt for confirmation in interactive mode
- Delete plugin files from custom directories
- Update manifest
- Keep backups for safety

## Context

### Arguments

- `$1` — Plugin name
- `--force` — Skip confirmation

## Steps

### Step 1: Detect AIDD Tool

1. Read tool from manifest
2. Exit with error if no manifest

### Step 2: Validate Plugin Name

1. Extract plugin name from arguments
2. Read `.aidd-custom/manifest.json`
3. Verify plugin is installed
4. Exit with error if not installed

### Step 3: Confirm Removal

1. If `--force` flag provided → skip confirmation
2. Otherwise, prompt with @inquirer/confirm:
   ```
   Remove plugin '<name>' from <tool> and delete X files?
   This will remove:
   - commands/<tool>/custom/...
   - rules/custom/...
   
   [y/N]
   ```

### Step 4: Remove Plugin Files

1. Read file list from manifest for plugin
2. Delete each file from custom directories
3. Show progress: "Removing <plugin-name> from <tool>..."
4. Do NOT delete parent directories (may contain other plugins)

### Step 5: Update Manifest

1. Remove plugin from manifest
2. Remove plugin's files from manifest
3. Write updated manifest

### Step 6: Report

1. Display removal summary with tool name
2. Show files deleted
3. Point to `.aidd-custom/backups/` for restore instructions
