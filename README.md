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

## Simplified System

The project has been simplified to support only OpenCode. All references to Claude, Copilot, and Cursor have been removed.

## Structure

```
.
├── .aidd/
│   └── config.json     # Configuration (repo, branch)
├── .opencode/
│   └── commands/aidd/custom/ # Overlay commands
│   └── rules/custom/ # Overlay rules
│   └── agents/custom/ # Overlay agents
│   └── skills/ # Overlay skills
├── .mistral/
│   └── instructions.md # Mistral instructions
└── aidd_docs/templates/custom/ # Templates
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
│   └── mistral/
│       └── instructions.md
├── plugins/          # Optional plugins
│   ├── my-plugin-1/
│   │   ├── version.txt
│   │   ├── index.json
│   │   └── ...
│   └── index.json   # Plugin list
└── README.md
```

## Changes Made

1. **Removed CLAUDE.md and AGENTS.md overwriting**: The system no longer overwrites these files, preventing data loss.
2. **Simplified to OpenCode only**: All code related to Claude, Copilot, and Cursor has been removed.
3. **Cleaner installation**: Installation now only targets `.opencode/` directory structure.
4. **Added Mistral support**: Installation now creates a `.mistral/` directory with an `instructions.md` file from the overlay repository.
5. **Clean command updated**: The clean command now also removes the `.mistral/` directory.
