# AIDD Framework Catalog

Auto-generated framework content: agents, commands, rules, skills, and templates.

> This file is automatically updated by `aidd`.

## Table of Contents

- [agents](#agents)
- [aidd_docs](#aidd_docs)
  - [aidd_docs/templates](#aidd_docstemplates)
- [commands](#commands)
  - [commands/00_behavior](#commands00_behavior)
  - [commands/01_onboard](#commands01_onboard)
  - [commands/02_context](#commands02_context)
  - [commands/03_plan](#commands03_plan)
  - [commands/04_code](#commands04_code)
  - [commands/05_review](#commands05_review)
  - [commands/06_tests](#commands06_tests)
  - [commands/07_documentation](#commands07_documentation)
  - [commands/08_deploy](#commands08_deploy)
  - [commands/09_refactor](#commands09_refactor)
  - [commands/10_maintenance](#commands10_maintenance)
- [opencode.json](#opencodejson)
- [rules](#rules)
  - [rules/01-standards](#rules01-standards)
  - [rules/04-tooling](#rules04-tooling)
- [skills](#skills)
  - [skills/aidd-auto-implement](#skillsaidd-auto-implement)
  - [skills/challenge](#skillschallenge)

---

### `agents`

| File | Description | Mode |
|------|---|---|
| [alexia.md](../.opencode/agents/alexia.md) | `Act like the USER to autonomously end-to-end implementation without human intervention` | `subagent` |
| [claire.md](../.opencode/agents/claire.md) | `Clarity challenger — challenges and questions until the request is ultra-clear` | `subagent` |
| [iris.md](../.opencode/agents/iris.md) | `Frontend specialist with 3 modes - implement from Figma, verify UI conformity, validate user journeys.` | `subagent` |
| [kent.md](../.opencode/agents/kent.md) | `Use this agent when explicitly asked to perform test-driven development.` | `subagent` |
| [martin.md](../.opencode/agents/martin.md) | `Every time you need to run a command to ensure code is correct, still builds are that tests pass, you must call this agent.` | `subagent` |

### `aidd_docs`

#### `aidd_docs/templates`

| File | Description |
|------|---|
| [AGENTS.md](../AGENTS.md) | `AI agent configuration and guidelines` |

### `commands`

#### `commands/00_behavior`

| File | Description |
|------|---|
| [auto_accept.md](../.opencode/commands/aidd/00/auto_accept.md) | `Auto-accept proposed changes without asking for confirmation.` |

#### `commands/01_onboard`

| File | Description |
|------|---|
| [generate_agent.md](../.opencode/commands/aidd/01/generate_agent.md) | `Generates a customized agent based on user-defined parameters.` |
| [generate_architecture.md](../.opencode/commands/aidd/01/generate_architecture.md) | `Generate project architecture with agents, skills, coordination diagram, and optional rules/commands for code projects` |
| [generate_command.md](../.opencode/commands/aidd/01/generate_command.md) | `Generate optimized, action-oriented prompts using best practices and structured template` |
| [generate_rules.md](../.opencode/commands/aidd/01/generate_rules.md) | `Generate or modify coding rules manually or auto-scan the codebase to propose rules` |
| [generate_skill.md](../.opencode/commands/aidd/01/generate_skill.md) | `Generate a customized skill based on repeated patterns and user workflows.` |
| [init.md](../.opencode/commands/aidd/01/init.md) | `Create or update the memory bank files to reflect the current state of the codebase` |

#### `commands/02_context`

| File | Description |
|------|---|
| [brainstorm.md](../.opencode/commands/aidd/02/brainstorm.md) | `Interactive brainstorming session to clarify and refine feature requests` |
| [challenge.md](../.opencode/commands/aidd/02/challenge.md) | `Rethink and challenge previous work for improvements` |
| [create_user_stories.md](../.opencode/commands/aidd/02/create_user_stories.md) | `Create user stories through iterative questioning` |
| [ticket_info.md](../.opencode/commands/aidd/02/ticket_info.md) | `Get ticket information from the project's ticketing tool` |

#### `commands/03_plan`

| File | Description |
|------|---|
| [components_behavior.md](../.opencode/commands/aidd/03/components_behavior.md) | `Define the expected behavior of frontend components into a state machine format.` |
| [image_extract_details.md](../.opencode/commands/aidd/03/image_extract_details.md) | `Analyze image to identify and extract main components with hierarchical organization` |
| [plan.md](../.opencode/commands/aidd/03/plan.md) | `Generate technical implementation plans from requirements` |

#### `commands/04_code`

| File | Description |
|------|---|
| [assert.md](../.opencode/commands/aidd/04/assert.md) | `Assert that a feature must work as intended.` |
| [assert_architecture.md](../.opencode/commands/aidd/04/assert_architecture.md) | `Verify code conforms to architecture diagrams, ADRs, and project structure.` |
| [assert_frontend.md](../.opencode/commands/aidd/04/assert_frontend.md) | `Assert a frontend feature works as intended.` |
| [implement.md](../.opencode/commands/aidd/04/implement.md) | `Implement plan following project rules with validation` |
| [implement_from_design.md](../.opencode/commands/aidd/04/implement_from_design.md) | `Implement a frontend component from a Figma design with pixel-perfect accuracy.` |
| [run_projection.md](../.opencode/commands/aidd/04/run_projection.md) | `Project the solution you mentioned on a part of the codebase so we can see if this will work.` |

#### `commands/05_review`

| File | Description |
|------|---|
| [review_code.md](../.opencode/commands/aidd/05/review_code.md) | `Ensure code quality and rules compliance` |
| [review_functional.md](../.opencode/commands/aidd/05/review_functional.md) | `Use this agent when you need to browse current project web application, getting browser console, screenshot, navigating across the app...` |

#### `commands/06_tests`

| File | Description |
|------|---|
| [test.md](../.opencode/commands/aidd/06/test.md) | `List untested behaviors and iterate on test creation until tests pass with best practices` |
| [test_journey.md](../.opencode/commands/aidd/06/test_journey.md) | `Test a user journey end-to-end by navigating and validating each step in the browser.` |

#### `commands/07_documentation`

| File | Description |
|------|---|
| [learn.md](../.opencode/commands/aidd/07/learn.md) | `Update memory bank or rules with new information or requirements.` |
| [mermaid.md](../.opencode/commands/aidd/07/mermaid.md) | `When need to generate Mermaid diagrams` |

#### `commands/08_deploy`

| File | Description |
|------|---|
| [commit.md](../.opencode/commands/aidd/08/commit.md) | `Create git commit with proper message format` |
| [create_request.md](../.opencode/commands/aidd/08/create_request.md) | `Create PR (GitHub) or MR (GitLab) with filled template` |
| [tag.md](../.opencode/commands/aidd/08/tag.md) | `Create and push git tag with semantic versioning` |

#### `commands/09_refactor`

| File | Description |
|------|---|
| [audit.md](../.opencode/commands/aidd/09/audit.md) | `Perform deep codebase analysis for technical debt and improvements` |
| [performance.md](../.opencode/commands/aidd/09/performance.md) | `Optimize code for better performance` |
| [security_refactor.md](../.opencode/commands/aidd/09/security_refactor.md) | `Identify and fix security vulnerabilities` |

#### `commands/10_maintenance`

| File | Description |
|------|---|
| [debug.md](../.opencode/commands/aidd/10/debug.md) | `Debug issue to find root cause.` |
| [new_issue.md](../.opencode/commands/aidd/10/new_issue.md) | `Create GitHub issues with interactive template filling` |
| [reflect_issue.md](../.opencode/commands/aidd/10/reflect_issue.md) | `Reflect on possible sources, identify most likely causes, add validation logs before fixing` |
| [reproduce.md](../.opencode/commands/aidd/10/reproduce.md) | `Fix bugs with test-driven workflow from issue to PR` |

### `opencode.json`

| File |
|------|
| [opencode.json](../opencode.json) |

### `rules`

#### `rules/01-standards`

| File | Description |
|------|---|
| [1-command-structure.md](../.opencode/rules/01-standards/1-command-structure.md) | `Standards for naming, organizing, and writing command files. Apply when creating or editing any command file.` |
| [1-mermaid.md](../.opencode/rules/01-standards/1-mermaid.md) | `Rules for generating valid, high-quality Mermaid diagrams. Apply when creating or reviewing any Mermaid diagram (flowchart, state, ER, sequence, gantt).` |
| [1-rule-structure.md](../.opencode/rules/01-standards/1-rule-structure.md) | `Standards for naming and organizing .md rule files. Apply when creating new rule files or deciding on file placement.` |
| [1-rule-writing.md](../.opencode/rules/01-standards/1-rule-writing.md) | `Standards for writing .md coding rule content. Apply when creating, editing, or reviewing any rule file.` |

#### `rules/04-tooling`

| File | Description |
|------|---|
| [ide-mapping.opencode.md](../.opencode/rules/04-tooling/ide-mapping.md) | `OpenCode file locations, syntax, frontmatter, and configuration reference. Apply when creating or configuring OpenCode-specific files.` |

### `skills`

#### `skills/aidd-auto-implement`

| File | Description | Argument Hint |
|------|---|---|
| [SKILL.md](../.opencode/skills/aidd-auto-implement/SKILL.md) | `Autonomously run the AI-Driven Development workflow to code an high quality feature.` | `The URL or file path of the issue or task to implement.` |

#### `skills/challenge`

| File | Description |
|------|---|
| [SKILL.md](../.opencode/skills/challenge/SKILL.md) | `Review and challenge previous work for improvements and correctness. Use when the user says 'challenge this', 'review my work', 'is this correct', asks for a critical review, or wants to rethink a decision.` |

