---
name: 'aidd:overlay:update'
description: 'Check for and apply plugin updates'
argument-hint: '[--dry-run] [--plugin <name>]'
---

# Overlay Update

## Goal

Check for updates to installed overlay plugins and apply them if desired.

## Rules

- Read current versions from `.aidd-overlay/manifest.json`
- Compare with remote versions from cached repo
- Support `--dry-run` to preview without applying
- Backup before updating

## Context

### Arguments

- `$ARGUMENTS` — `--dry-run` and/or `--plugin <name>`

## Steps

### Step 1: Read Manifest

1. Read `.aidd-overlay/manifest.json`
2. Extract installed plugins list
3. Exit with error if no plugins installed

### Step 2: Fetch Remote Versions

1. Use cached repo from `~/.cache/aidd-overlay/`
2. Run `git pull` to get latest
3. Read remote `version.txt` for each installed plugin

### Step 3: Compare Versions

1. Build diff table:
   ```
   Plugin          | Local | Remote | Status
   ----------------|-------|--------|--------
   my-plugin-1     | 1.0.0 | 1.1.0  | Update available
   my-plugin-2    | 2.0.0 | 2.0.0  | Up to date
   ```
2. Identify outdated plugins

### Step 4: Handle Dry Run

1. If `--dry-run`:
   - Display diff table
   - Show what would change
   - Exit without modifications

### Step 5: Select Plugins to Update

1. If `--plugin <name>` → update only that plugin
2. If `--all` or no flags → prompt user to select plugins
3. Use @inquirer/checkbox for interactive selection

### Step 6: Apply Updates

1. For each selected outdated plugin:
   - Backup current files to `.aidd-overlay/backups/`
   - Copy new files from cached repo
   - Update manifest with new version
2. Show progress: "Updating <plugin-name>..."

### Step 7: Report

1. Display updated plugins summary
2. Show any new files added
3. Show backup location for rollback
