---
name: 'aidd:overlay:plugin:add'
description: 'Install a specific optional plugin'
argument-hint: '<plugin-name>'
---

# Overlay Plugin Add

## Goal

Install a single named optional plugin from the repository.

## Rules

- Validate plugin exists before installing
- Backup existing files
- Update manifest

## Context

### Arguments

- `$1` — Plugin name

## Steps

### Step 1: Detect AIDD Tool

1. Detect which AIDD tool is configured
2. Exit with error if no tool detected

### Step 2: Validate Plugin Name

1. Extract plugin name from arguments
2. Fetch plugin list from repository
3. Verify plugin exists in list
4. Exit with error if not found

### Step 3: Check Installation Status

1. Read `.aidd-overlay/manifest.json`
2. Check if plugin already installed
3. If installed, confirm overwrite or exit

### Step 4: Install Plugin

1. Read plugin from cached repo (`plugins/<name>/`)
2. Transform paths for detected tool
3. Copy files to project custom directories
4. Create backups for any conflicts
5. Show progress: "Installing <plugin-name> for <tool>..."

### Step 5: Update Manifest

1. Add plugin to manifest with version and tool
2. Record all installed files with hashes
3. Write updated manifest

### Step 6: Report

1. Display installation summary with tool name
2. Show files installed
3. Show backup location if any conflicts
