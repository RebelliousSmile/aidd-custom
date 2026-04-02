---
name: 'aidd:custom:plugin:list'
description: 'List available custom plugins from the repository'
---

# Custom Plugin List

## Goal

Display all available plugins from the configured custom repository.

## Rules

- Require `custom.repo` config to be set
- Cache plugin list for 5 minutes

## Steps

### Step 1: Detect AIDD Tool

1. Detect which AIDD tool is configured
2. Display tool name in output

### Step 2: Read Configuration

1. Read `custom.repo` from `.aidd/config.json`
2. Determine branch (default: main)

### Step 3: Fetch Plugin Index

1. Use cached repo or clone if not cached
2. Read `plugins/index.json` if exists
3. If no index, scan `plugins/*/` directories

### Step 4: Display Plugin List

1. Build formatted table:
   ```
   Available Plugins for <tool>
   =============================
   
   Name                | Version | Description
   --------------------|---------|--------------------------
   aidd-claude-custom | 1.0.0   | Custom commands & agents
   my-org-plugin       | 2.1.0   | Organization specific
   ```
2. If installed, show status:
   ```
   [installed]
   ```

### Step 5: Show Installed Status

1. Read `.aidd-custom/manifest.json`
2. Mark installed plugins in list
3. Show version comparison if outdated
