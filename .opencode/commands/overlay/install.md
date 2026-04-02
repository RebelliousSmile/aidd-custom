---
name: 'aidd:overlay:install'
description: 'Install base overlay and list available plugins'
argument-hint: '[--no-overlay] [--plugins-only]'
---

# Overlay Install

## Goal

Install the base overlay from the private repository and display available plugins for optional installation.

## Two-Layer System

1. **Base Overlay** — Files in `overlay/` directory, always installed
2. **Optional Plugins** — Listed after install for optional installation

## Rules

- Require authentication (run `aidd auth login` first)
- Require `overlay.repo` config to be set
- Backup existing files before overwriting
- Update manifest after installation

## Context

### Arguments

- `$ARGUMENTS` — `--no-overlay` (skip base overlay) or `--plugins-only` (plugins only)

### Configuration

Required in `.aidd/config.json`:
```json
{
  "overlay": {
    "repo": "owner/repo",
    "branch": "main"
  }
}
```

## Steps

### Step 1: Detect AIDD Tool

1. Check for `.claude/`, `.github/`, `.cursor/`, `.opencode/`
2. Exit with error if no AIDD tool detected
3. Display detected tool

### Step 2: Check Prerequisites

1. Verify authentication is configured (`aidd auth status`)
2. Read `overlay.repo` from config
3. Clone/fetch private repo to cache (`~/.cache/aidd-overlay/`)

### Step 3: Install Base Overlay

1. If `--plugins-only` flag → skip overlay installation
2. If `--no-overlay` flag → skip overlay installation
3. Otherwise:
   - Read files from `overlay/` in cached repo
   - Transform paths to match detected tool
   - Copy files to project directories
   - Detect conflicts, create backups in `.aidd-overlay/backups/`
   - Show progress: "Installing base overlay for <tool>..."

### Step 4: Discover Plugins

1. Read `plugins/index.json` from cached repo
2. If not found, scan `plugins/*/` directories
3. Read `version.txt` for each plugin

### Step 5: Update Manifest

1. Read or create `.aidd-overlay/manifest.json`
2. Record installed overlay with version and file list
3. Write updated manifest

### Step 6: Report

1. Display base overlay installation status
2. List available plugins:
   ```
   Available Plugins
   ================
   
   Name                | Version | Description
   --------------------|---------|--------------------------
   my-plugin-1         | 1.0.0   | Plugin description
   another-plugin       | 2.1.0   | Another plugin
   
   Install with: aidd:overlay:plugin:add <name>
   ```
3. Point to `.aidd-overlay/backups/` for restore instructions
