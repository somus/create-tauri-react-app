# GitHub Template Setup

This repository is configured as a GitHub template.

## How to Use

### Option 1: Using `bun create` (Recommended)
```bash
bun create somus/create-tauri-react-app my-app
cd my-app
bun tauri dev
```

### Option 2: GitHub "Use this template" button
1. Click the green "Use this template" button on the repository page
2. Select "Create a new repository"
3. Choose your account/organization and repository name
4. Clone your new repository
5. Run `bun install` (the setup script will run automatically)

### Option 3: Using degit
```bash
# Using bun
bunx degit somus/create-tauri-react-app my-app
cd my-app
bun install

# Using npm
npx degit somus/create-tauri-react-app my-app
cd my-app
npm install

# Using pnpm
pnpm dlx degit somus/create-tauri-react-app my-app
cd my-app
pnpm install
```

## What happens after cloning

The `postinstall` script automatically runs an interactive setup (`scripts/setup.ts`) which:

1. **Prompts for project information**:
   - Project name
   - Product name (display name)
   - GitHub username or organization
   - Bundle identifier (e.g., `com.username.appname`)
   - Author name
   - Description

2. **Prompts for AI agent configuration**:
   - Multi-select from 27+ supported agents (claude, cursor, copilot, opencode, etc.)
   - Agents are ordered by popularity for easy selection
   - No agents are pre-selected by default

3. **Prompts for build configuration**:
   - Select target platforms for releases (macOS ARM64/Intel, Windows, Linux)
   - Enable code signing options (macOS notarization, Windows signing)
   - Customizes `.github/workflows/publish.yml` based on selections

4. **Automatically sets up development environment**:
   - Initializes a git repository (if not already in one)
   - Updates `.ruler/ruler.toml` with selected agents
   - Runs `ruler apply` to configure AI agent instructions
   - Installs Lefthook git hooks for pre-commit checks

5. **Skips silently on subsequent installs** (detects if already configured)

## Supported AI Agents

The setup script supports configuration for these AI coding agents (ordered by popularity):

**Popular**: claude, cursor, copilot, opencode, windsurf, cline, zed

**Mid-tier**: aider, amp, codex, gemini-cli, goose, kiro, roo

**Others**: agentsmd, amazonqcli, antigravity, augmentcode, crush, firebase, firebender, jules, junie, kilocode, openhands, qwen, trae, warp

## Release Automation

This template includes GitHub Actions workflows for automated releases:

### Workflows

- **release-please.yml** - Automatically creates Release PRs with version bumps and changelog updates when you push conventional commits to `main`
- **publish.yml** - Builds the app for all selected platforms and creates a draft GitHub Release when a Release PR is merged

### Release Process

1. Push conventional commits to `main` (`feat:`, `fix:`, etc.)
2. Review and merge the auto-generated Release PR
3. Review and publish the draft GitHub Release

### Setup Required Before First Release

1. Generate an updater keypair: `bun tauri signer generate -w ~/.tauri/myapp.key`
2. Update `src-tauri/tauri.conf.json` with your public key and GitHub repo URL
3. Add secrets to GitHub repository settings:
   - `TAURI_SIGNING_PRIVATE_KEY`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   - (Optional) macOS code signing secrets for notarization

See [.ruler/RELEASING.md](../.ruler/RELEASING.md) for detailed documentation.

## Repository Settings

To mark this as a template repository on GitHub:
1. Go to repository Settings
2. Under "General", check "Template repository"
