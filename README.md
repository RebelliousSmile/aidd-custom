# AIDD Custom Framework

Custom AIDD (AI-Driven Development) starter with overlay system.

## Installation

### As CLI (global)

```bash
# Clone and build
git clone https://github.com/your-org/aidd-custom.git
cd aidd-custom
npm install
npm run build

# Link globally
npm link
```

Now you can use `aidd-custom` globally:

```bash
aidd-custom --help
aidd-custom install
aidd-custom update
aidd-custom clean
aidd-custom doctor
aidd-custom plugin list
aidd-custom plugin add <name>
aidd-custom plugin remove <name>
```

### As library

```bash
npm install aidd-custom
```

## Two-Layer System

### 1. Base Overlay (always installed)
Files from `overlay/` directory installed on every `aidd install`.

### 2. Optional Plugins
Additional packages from `plugins/` that can be installed/removed.

## Structure

```
.
├── .aidd/
│   └── config.json     # Configuration (repo, branch)
├── .opencode/
│   └── commands/overlay/ # Overlay commands
├── overlay/             # Base files (commands, rules, agents, skills)
├── plugins/             # Optional plugins
├── opencode.json
└── AGENTS.md
```

## Overlay Commands

```text
aidd-custom install      # Install base overlay + list plugins
aidd-custom update       # Check overlay/plugin updates
aidd-custom clean        # Remove all overlay files
aidd-custom doctor       # Verify installation health

aidd-custom plugin list     # List available plugins
aidd-custom plugin add     # Install a plugin
aidd-custom plugin remove  # Remove a plugin
```

## Tool Detection

Auto-detects AIDD tool and installs to correct directories:

| Tool | Directory | Commands | Rules | Agents | Skills |
|------|----------|----------|-------|--------|--------|
| Claude | `.claude/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |
| Copilot | `.github/` | `prompts/custom/` | `instructions/custom/` | `agents/custom/` | `skills/custom/` |
| Cursor | `.cursor/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |
| OpenCode | `.opencode/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |

## Configuration

Edit `.aidd/config.json`:

```json
{
  "overlay": {
    "repo": "owner/private-repo",
    "branch": "main"
  }
}
```

## Repository Structure

```
private-repo/
├── overlay/           # Base files (always installed)
│   ├── commands/
│   ├── rules/
│   ├── agents/
│   └── skills/
├── plugins/          # Optional plugins
│   ├── my-plugin-1/
│   │   ├── version.txt
│   │   ├── index.json
│   │   └── ...
│   └── index.json   # Plugin list
└── README.md
```
