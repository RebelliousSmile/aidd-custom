---
name: 'aidd:overlay:doctor'
description: 'Verify overlay installation health'
---

# Overlay Doctor

## Goal

Check the health of the overlay installation and report any issues.

## Rules

- Always report issues even if some checks pass
- Provide actionable suggestions for fixes

## Steps

### Step 1: Check Authentication

1. Run `aidd auth status`
2. Report auth status

### Step 2: Check Configuration

1. Read `.aidd/config.json`
2. Verify `overlay.repo` is configured
3. Verify `overlay.branch` if set

### Step 3: Check Manifest

1. Read `.aidd-overlay/manifest.json`
2. Verify valid JSON
3. Verify required fields exist

### Step 4: Check Repository Cache

1. Verify cached repo exists at `~/.cache/aidd-overlay/`
2. Verify repo is accessible

### Step 5: Check Installed Files

1. For each file in manifest:
   - Verify file exists on disk
   - Verify hash matches manifest
2. Report missing or modified files

### Step 6: Report Issues

1. Display health check summary:
   ```
   Health Check Results
   ====================
   
   ✓ Authentication     | OK
   ✓ Configuration     | OK
   ✓ Manifest          | OK
   ⚠ Repository Cache  | Stale (last update: 2 days ago)
   ✗ Installed Files   | 2 files missing
   
   Issues Found:
   - Missing: .opencode/rules/custom/04-test.md
   - Missing: .opencode/agents/custom-ada.md
   
   Suggestions:
   - Run `aidd overlay update --plugin <name>` to restore
   ```
