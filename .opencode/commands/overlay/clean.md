---
name: 'aidd:overlay:clean'
description: 'Remove all overlay files and manifest'
---

# Overlay Clean

## Goal

Remove all overlay and plugin files from the project.

## Rules

- Require confirmation before deleting
- List all files that will be deleted
- Do NOT delete backups (safety)

## Steps

### Step 1: Detect AIDD Tool

1. Detect which AIDD tool is configured

### Step 2: Check Installation

1. Read `.aidd-overlay/manifest.json`
2. Exit with message if no custom plugins installed

### Step 3: List Files to Delete

1. Collect all files from manifest
2. List files with sizes:
   ```
   Files to be removed from <tool>:
   ==================================
   
   .aidd-overlay/manifest.json          |  1.2 KB
   commands/<tool>/custom/...          |  5.4 KB
   rules/custom/...                    | 12.8 KB
   agents/custom/...                   |  2.1 KB
   
   Total: 21.5 KB in 15 files
   
   Backups in .aidd-overlay/backups/ will be kept (30 day retention).
   ```

### Step 4: Confirm Deletion

1. Prompt with @inquirer/confirm:
   ```
   Remove all custom plugin files and configuration?
   This will NOT affect your backups.
   
   [y/N]
   ```

### Step 5: Delete Files

1. Delete plugin files from custom directories
2. Delete empty parent directories within custom dirs
3. Delete `.aidd-overlay/manifest.json`
4. Keep `.aidd-overlay/backups/` directory

### Step 6: Report

1. Display deletion summary with tool name
2. Note about backup retention
3. Reminder: Config in `.aidd/config.json` still exists
