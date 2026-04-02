---
name: 'aidd:overlay:plugin:list'
description: 'List available overlay plugins from the repository'
---

# Overlay Plugin List

## Goal

Display all available plugins from the configured overlay repository.

## Rules

- Require `overlay.repo` config to be set
- Cache plugin list for 5 minutes

## Steps

### Step 1: Read Configuration

1. Read `overlay.repo` from `.aidd/config.json`
2. Determine branch (default: main)

### Step 2: Fetch Plugin Index

1. Use cached repo or clone if not cached
2. Read `plugins/index.json` if exists
3. If no index, scan `plugins/*/` directories

### Step 3: Display Plugin List

1. Build formatted table:
   ```
   Available Plugins
   ================
   
   Name                | Version | Description
   --------------------|---------|--------------------------
   aidd-claude-custom | 1.0.0   | Custom commands & agents
   my-org-plugin       | 2.1.0   | Organization specific
   ```
2. If installed, show status:
   ```
   [installed]
   ```

### Step 4: Show Installed Status

1. Read `.aidd-overlay/manifest.json`
2. Mark installed plugins in list
3. Show version comparison if outdated
