---
name: 'aidd:overlay:plugin:list'
description: 'List available optional plugins from the repository'
---

# Overlay Plugin List

## Goal

Display all available optional plugins from the configured overlay repository.

## Rules

- Require `overlay.repo` config to be set
- Cache plugin list for 5 minutes

## Steps

### Step 1: Detect AIDD Tool

1. Detect which AIDD tool is configured
2. Display tool name in output

### Step 2: Read Configuration

1. Read `overlay.repo` from `.aidd/config.json`
2. Determine branch (default: main)

### Step 3: Fetch Plugin Index

1. Use cached repo or clone if not cached
2. Read `plugins/index.json` if exists
3. If no index, scan `plugins/*/` directories

### Step 4: Display Plugin List

1. Read `.aidd-overlay/manifest.json` to check installed plugins
2. Build formatted table:
   ```
   Available Plugins
   ================
   
   Name                | Version | Status      | Description
   --------------------|---------|-------------|--------------------------
   my-plugin-1         | 1.0.0   | [installed] | Plugin description
   another-plugin      | 2.1.0   | available   | Another plugin
   ```
3. Mark installed plugins with `[installed]`
4. Show version comparison if outdated
