---
name: 'aidd:overlay:plugin:add'
description: 'Install a specific overlay plugin'
argument-hint: '<plugin-name>'
---

# Overlay Plugin Add

## Goal

Install a single named plugin from the overlay repository.

## Rules

- Validate plugin exists before installing
- Backup existing files
- Update manifest

## Context

### Arguments

- `$1` — Plugin name

## Steps

### Step 1: Validate Plugin Name

1. Extract plugin name from arguments
2. Fetch plugin list from repository
3. Verify plugin exists in list
4. Exit with error if not found

### Step 2: Check Installation Status

1. Read `.aidd-overlay/manifest.json`
2. Check if plugin already installed
3. If installed, confirm overwrite or exit

### Step 3: Install Plugin

1. Read plugin from cached repo (`plugins/<name>/.opencode/`)
2. Copy files to project `.opencode/`
3. Create backups for any conflicts
4. Show progress: "Installing <plugin-name>..."

### Step 4: Update Manifest

1. Add plugin to manifest with version
2. Record all installed files with hashes
3. Write updated manifest

### Step 5: Report

1. Display installation summary
2. Show files installed
3. Show backup location if any conflicts
