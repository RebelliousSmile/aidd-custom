---
name: 'aidd:custom:doctor'
description: 'Verify custom plugin installation health'
---

# Custom Doctor

## Goal

Check the health of the custom plugin installation and report any issues.

## Rules

- Always report issues even if some checks pass
- Provide actionable suggestions for fixes

## Steps

### Step 1: Check AIDD Tool

1. Detect which AIDD tool is configured
2. Verify tool directory exists

### Step 2: Check Authentication

1. Run `aidd auth status`
2. Report auth status

### Step 3: Check Configuration

1. Read `.aidd/config.json`
2. Verify `custom.repo` is configured
3. Verify `custom.branch` if set

### Step 4: Check Manifest

1. Read `.aidd-custom/manifest.json`
2. Verify valid JSON
3. Verify required fields exist (tool, plugins, files)

### Step 5: Check Repository Cache

1. Verify cached repo exists at `~/.cache/aidd-custom/`
2. Verify repo is accessible

### Step 6: Check Installed Files

1. For each file in manifest:
   - Verify file exists on disk
   - Verify hash matches manifest
2. Report missing or modified files

### Step 7: Report Issues

1. Display health check summary:
   ```
   Health Check Results
   ====================
   
   Tool             | claude | Detected
   Authentication   | OK     |
   Configuration    | OK     |
   Manifest         | OK     |
   Repository Cache | OK     |
   Installed Files  | 42/42  | All present
   ```
