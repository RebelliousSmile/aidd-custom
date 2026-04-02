---
name: 'aidd:custom:update'
description: 'Check for and apply custom plugin updates'
argument-hint: '[--dry-run] [--plugin <name>]'
---

# Custom Update

## Goal

Check for updates to installed custom plugins and apply them if desired.

## Rules

- Read current versions from `.aidd-custom/manifest.json`
- Compare with remote versions from cached repo
- Support `--dry-run` to preview without applying
- Backup before updating

## Context

### Arguments

- `$ARGUMENTS` — `--dry-run` and/or `--plugin <name>`

## Steps

### Step 1: Read Manifest

1. Read `.aidd-custom/manifest.json`
2. Extract installed plugins list
3. Exit with error if no plugins installed

### Step 2: Detect AIDD Tool

1. Read tool from manifest
2. Verify tool directory still exists

### Step 3: Fetch Remote Versions

1. Use cached repo from `~/.cache/aidd-custom/`
2. Run `git pull` to get latest
3. Read remote `version.txt` for each installed plugin

### Step 4: Compare Versions

1. Build diff table:
   ```
   Plugin          | Tool   | Local | Remote | Status
   ----------------|--------|-------|--------|--------
   my-plugin-1     | claude | 1.0.0 | 1.1.0  | Update available
   my-plugin-2    | opencode| 2.0.0 | 2.0.0  | Up to date
   ```
2. Identify outdated plugins

### Step 5: Handle Dry Run

1. If `--dry-run`:
   - Display diff table
   - Show what would change
   - Exit without modifications

### Step 6: Select Plugins to Update

1. If `--plugin <name>` → update only that plugin
2. If `--all` or no flags → prompt user to select plugins
3. Use @inquirer/checkbox for interactive selection

### Step 7: Apply Updates

1. For each selected outdated plugin:
   - Backup current files to `.aidd-custom/backups/`
   - Copy new files from cached repo (with tool path transformation)
   - Update manifest with new version
2. Show progress: "Updating <plugin-name>..."

### Step 8: Report

1. Display updated plugins summary
2. Show any new files added
3. Show backup location for rollback
