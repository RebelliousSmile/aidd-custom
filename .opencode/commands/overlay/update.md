---
name: 'aidd:overlay:update'
description: 'Check for and apply overlay and plugin updates'
argument-hint: '[--dry-run] [--plugin <name>]'
---

# Overlay Update

## Goal

Check for updates to the base overlay and optional plugins, apply them if desired.

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
2. Extract installed overlay and plugins list
3. Exit with message if nothing installed

### Step 2: Detect AIDD Tool

1. Read tool from manifest
2. Verify tool directory still exists

### Step 3: Fetch Remote Versions

1. Use cached repo from `~/.cache/aidd-overlay/`
2. Run `git pull` to get latest
3. Read remote `version.txt` for base overlay
4. Read remote `version.txt` for each installed plugin

### Step 4: Compare Versions

1. Build diff table:
   ```
   Component         | Tool   | Local | Remote | Status
   -----------------|--------|-------|--------|--------
   base-overlay     | claude | 1.0.0 | 1.1.0  | Update available
   my-plugin-1      | claude | 1.0.0 | 1.0.0  | Up to date
   ```
2. Identify outdated components

### Step 5: Handle Dry Run

1. If `--dry-run`:
   - Display diff table
   - Show what would change
   - Exit without modifications

### Step 6: Select Components to Update

1. If `--plugin <name>` → update only that plugin
2. If `--all` or no flags → prompt user to select
3. Use @inquirer/checkbox for interactive selection

### Step 7: Apply Updates

1. For each selected outdated component:
   - Backup current files to `.aidd-overlay/backups/`
   - Copy new files from cached repo (with tool path transformation)
   - Update manifest with new version
2. Show progress: "Updating <component>..."

### Step 8: Report

1. Display updated components summary
2. Show any new files added
3. Show backup location for rollback
