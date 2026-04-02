---
name: 'aidd:custom:install'
description: 'Install custom plugins from a private repository'
argument-hint: '[--all|--plugin <name>...]'
---

# Custom Install

## Goal

Install custom plugins from a private GitHub repository into the current AIDD project, auto-detecting the tool (Claude, Copilot, Cursor, OpenCode).

## Rules

- Require authentication (run `aidd auth login` first)
- Require `custom.repo` config to be set
- Backup existing files before overwriting
- Update manifest after installation

## Context

### Arguments

- `$ARGUMENTS` — `--all` or `--plugin <name>...`

### Configuration

Required in `.aidd/config.json`:
```json
{
  "custom": {
    "repo": "owner/repo",
    "branch": "main"
  }
}
```

### Tool Detection

Detect AIDD tool by checking directory existence:

| Tool | Directory | Commands | Rules | Agents | Skills |
|------|----------|----------|-------|--------|--------|
| Claude Code | `.claude/` | `.claude/commands/custom/` | `.claude/rules/custom/` | `.claude/agents/custom/` | `.claude/skills/custom/` |
| Copilot | `.github/` | `.github/prompts/custom/` | `.github/instructions/custom/` | `.github/agents/custom/` | `.github/skills/custom/` |
| Cursor | `.cursor/` | `.cursor/commands/custom/` | `.cursor/rules/custom/` | `.cursor/agents/custom/` | `.cursor/skills/custom/` |
| OpenCode | `.opencode/` | `.opencode/commands/custom/` | `.opencode/rules/custom/` | `.opencode/agents/custom/` | `.opencode/skills/custom/` |

## Steps

### Step 1: Detect AIDD Tool

1. Check for `.claude/`, `.github/`, `.cursor/`, `.opencode/`
2. Exit with error if no AIDD tool detected
3. Display detected tool

### Step 2: Check Prerequisites

1. Verify authentication is configured (`aidd auth status`)
2. Read `custom.repo` from config
3. Clone/fetch private repo to cache (`~/.cache/aidd-custom/`)

### Step 3: Discover Plugins

1. Read `plugins/index.json` from cached repo
2. If not found, scan `plugins/*/` directories
3. Read `version.txt` for each plugin

### Step 4: Select Plugins

1. If `--all` flag provided → select all plugins
2. If `--plugin <name>` provided → validate plugins exist
3. If no flags → show interactive selection with @inquirer/checkbox
4. Display selected plugins list

### Step 5: Install Plugins

1. For each selected plugin:
   - Read plugin files from `plugins/<name>/`
   - Transform paths to match detected tool:
     - `commands/*/` → `commands/<tool>/custom/`
     - `rules/*/` → `rules/custom/`
     - `agents/*/` → `agents/custom/`
     - `skills/*/` → `skills/custom/`
   - Copy files to project custom directories
   - Detect conflicts with existing files
   - Create backup of conflicts in `.aidd-custom/backups/`
2. Show progress: "Installing <plugin-name> for <tool>..."

### Step 6: Update Manifest

1. Read or create `.aidd-custom/manifest.json`
2. Add installed plugins with version, tool, and file list
3. Include file hashes for integrity checking
4. Write updated manifest

### Step 7: Report

1. Display installed plugins summary with tool name
2. Show any conflicts that were backed up
3. Point to `.aidd-custom/backups/` for restore instructions
