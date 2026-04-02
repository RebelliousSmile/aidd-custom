---
name: 'aidd:overlay:restore'
description: 'Restore plugin files from backup'
argument-hint: '<plugin-name>'
---

# Overlay Restore

## Goal

List and restore files from overlay/plugin backups.

## Rules

- Show available backups before restoring
- Allow selective file restore
- Update manifest after restore

## Context

### Arguments

- `$1` — Plugin name

## Steps

### Step 1: Detect AIDD Tool

1. Extract plugin name from arguments
2. Read `.aidd-overlay/manifest.json`
3. Read tool from manifest
4. Verify plugin was ever installed

### Step 2: List Available Backups

1. Scan `.aidd-overlay/backups/<plugin>/`
2. Build backup list with timestamps:
   ```
   Available Backups for '<plugin>' (<tool>)
   ======================================
   
   #1 | 2024-04-02 10:30:00 | 5 files
   #2 | 2024-04-01 15:45:00 | 5 files
   #3 | 2024-03-30 09:00:00 | 4 files
   ```
3. Show backup metadata if available

### Step 3: Select Backup

1. If only one backup → use it automatically
2. If multiple → prompt with @inquirer/input for backup number
3. Or use `@inquirer/rawlist` to show options

### Step 4: List Files in Backup

1. Read `backups/<plugin>/<timestamp>/metadata.json`
2. Display files available for restore:
   ```
   Files in backup #2 for <tool>:
   - commands/<tool>/custom/...
   - rules/custom/...
   ```
3. Prompt to select files or restore all

### Step 5: Restore Files

1. Copy selected files from backup to project
2. Show progress: "Restoring <file>..."
3. Update manifest if restoring all files

### Step 6: Report

1. Display restore summary
2. Show files restored
3. Note: Backups are kept for 30 days
