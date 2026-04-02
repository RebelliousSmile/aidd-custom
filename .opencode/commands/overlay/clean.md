---
name: 'aidd:overlay:clean'
description: 'Remove all overlay files and manifest'
---

# Overlay Clean

## Goal

Remove all overlay-related files and configuration from the project.

## Rules

- Require confirmation before deleting
- List all files that will be deleted
- Do NOT delete backups (safety)

## Steps

### Step 1: Check Installation

1. Read `.aidd-overlay/manifest.json`
2. Exit with message if no overlay installed

### Step 2: List Files to Delete

1. Collect all files from manifest
2. List files with sizes:
   ```
   Files to be removed:
   ===================
   
   .aidd-overlay/manifest.json          |  1.2 KB
   .opencode/rules/custom/...          |  5.4 KB
   .opencode/commands/custom/...       | 12.8 KB
   .opencode/agents/custom-ada.md      |  2.1 KB
   
   Total: 21.5 KB in 15 files
   
   Backups in .aidd-overlay/backups/ will be kept (30 day retention).
   ```

### Step 3: Confirm Deletion

1. Prompt with @inquirer/confirm:
   ```
   Remove all overlay files and configuration?
   This will NOT affect your backups.
   
   [y/N]
   ```

### Step 4: Delete Files

1. Delete plugin files from `.opencode/`
2. Delete empty parent directories
3. Delete `.aidd-overlay/manifest.json`
4. Keep `.aidd-overlay/backups/` directory

### Step 5: Report

1. Display deletion summary
2. Note about backup retention
3. Reminder: Config in `.aidd/config.json` still exists
