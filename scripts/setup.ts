/**
 * Setup script for initializing the template with custom project values.
 * Run with: bun run setup
 *
 * This script automatically runs after `bun create` / `npm create` / etc.
 * It will skip silently if the project has already been configured.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkbox, input } from "@inquirer/prompts";

// Support both Bun and Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");

const TEMPLATE_NAME = "create-tauri-react-app";

// Ruler agents ordered by popularity
const RULER_AGENTS = [
  // Popular
  "claude",
  "cursor",
  "copilot",
  "opencode",
  "windsurf",
  "cline",
  "zed",
  // Mid-tier
  "aider",
  "amp",
  "codex",
  "gemini-cli",
  "goose",
  "kiro",
  "roo",
  // Others (alphabetical)
  "agentsmd",
  "amazonqcli",
  "antigravity",
  "augmentcode",
  "crush",
  "firebase",
  "firebender",
  "jules",
  "junie",
  "kilocode",
  "openhands",
  "qwen",
  "trae",
  "warp",
] as const;

const DEFAULT_AGENTS: string[] = [];

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

// Regex patterns (top-level for performance)
const CAMEL_TO_KEBAB_REGEX = /([a-z])([A-Z])/g;
const WHITESPACE_UNDERSCORE_REGEX = /[\s_]+/g;
const PKG_NAME_REGEX = /"name": "create-tauri-react-app"/;
const TAURI_PRODUCT_NAME_REGEX = /"productName": "create-tauri-react-app"/;
const TAURI_IDENTIFIER_REGEX =
  /"identifier": "com\.somu\.create-tauri-react-app"/;
const TAURI_TITLE_REGEX = /"title": "create-tauri-react-app"/;
const CARGO_NAME_REGEX = /name = "create-tauri-react-app"/;
const CARGO_DESCRIPTION_REGEX = /description = "A Tauri App"/;
const CARGO_LIB_NAME_REGEX = /name = "create_tauri_react_app_lib"/;
const MAIN_RS_LIB_REGEX = /create_tauri_react_app_lib::run\(\)/;
const CARGO_AUTHORS_REGEX = /authors = \["you"\]/;
const HTML_TITLE_REGEX = /<title>Tauri \+ React \+ Typescript<\/title>/;
const LICENSE_COPYRIGHT_REGEX = /Copyright \(c\) 2025/;
const AGENTS_IDENTIFIER_REGEX = /com\.somu\.create-tauri-react-app/g;
const RULER_DEFAULT_AGENTS_REGEX = /^default_agents\s*=\s*\[.*\]$/m;

const CARGO_DEFAULT_RUN_REGEX = /default-run = "create-tauri-react-app"/;
const CARGO_BIN_NAME_REGEX = /(\[\[bin\]\]\n)name = "create-tauri-react-app"/;
const TAURI_UPDATER_ENDPOINT_REGEX =
  /"https:\/\/github\.com\/somus\/create-tauri-react-app\/releases\/latest\/download\/latest\.json"/;
const TAURI_UPDATER_PUBKEY_REGEX =
  /"pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDhCRTAwNUQ4NEJFREVEMjQKUldRazdlMUwyQVhnaTRYMDVwK0c0REs0dVptUWVpY0tpZ0U0STVyTlZvMU42NmZSekttS0ZtY3UK"/;
const CONTRIBUTING_CLONE_REGEX =
  /git clone https:\/\/github\.com\/somus\/create-tauri-react-app\.git\n\s+cd create-tauri-react-app/;
const README_TITLE_REGEX = /^# Tauri \+ React Template/m;
const README_CI_BADGE_REGEX = /\[!\[CI\].*?\n/;
const README_DESCRIPTION_REGEX =
  /A modern desktop application template using \*\*Tauri v2\*\*, \*\*React 19\*\*, and \*\*TypeScript\*\*\./;
const README_WHY_SECTION_REGEX =
  /## Why This Template\?[\s\S]*?(?=## Features)/;
const README_QUICK_START_REGEX =
  /## Quick Start[\s\S]*?(?=## Project Structure)/;
const README_SETUP_TS_LINE_REGEX =
  /│ {3}├── setup\.ts\s+# Project initialization\n/;
const PKG_POSTINSTALL_REGEX =
  /"postinstall": "tsx \.\/scripts\/setup\.ts",\n\s*/;
const PKG_SETUP_REGEX = /,\n\s*"setup": "tsx \.\/scripts\/setup\.ts"/;
const PKG_INQUIRER_REGEX = /\s*"@inquirer\/prompts": "\^[^"]+",?\n/;
const PKG_BIN_REGEX = /\s*"bin": \{[^}]+\},\n/;

// Build platform options
const BUILD_PLATFORMS = [
  { name: "macOS (Apple Silicon)", value: "macos-arm64" },
  { name: "macOS (Intel)", value: "macos-x64" },
  { name: "Windows (x64)", value: "windows" },
  { name: "Linux (x64)", value: "linux" },
] as const;

// Code signing options
const CODE_SIGNING_OPTIONS = [
  { name: "macOS (Apple Developer certificate)", value: "macos" },
  { name: "Windows (Tauri updater signing)", value: "windows" },
] as const;

function log(message: string) {
  console.log(message);
}

function success(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function info(message: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function warn(message: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function toKebabCase(str: string): string {
  return str
    .replace(CAMEL_TO_KEBAB_REGEX, "$1-$2")
    .replace(WHITESPACE_UNDERSCORE_REGEX, "-")
    .toLowerCase();
}

function toSnakeCase(str: string): string {
  return toKebabCase(str).replace(/-/g, "_");
}

function updateFile(
  relativePath: string,
  replacements: Array<{ from: string | RegExp; to: string }>
): boolean {
  const filePath = join(ROOT_DIR, relativePath);

  if (!existsSync(filePath)) {
    console.error(`File not found: ${relativePath}`);
    return false;
  }

  let content = readFileSync(filePath, "utf-8");
  let modified = false;

  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(filePath, content, "utf-8");
    success(`Updated ${relativePath}`);
  }

  return modified;
}

function deleteFile(relativePath: string): boolean {
  const filePath = join(ROOT_DIR, relativePath);

  if (!existsSync(filePath)) {
    return false;
  }

  try {
    unlinkSync(filePath);
    success(`Deleted ${relativePath}`);
    return true;
  } catch {
    warn(`Failed to delete ${relativePath}`);
    return false;
  }
}

function isAlreadyConfigured(): boolean {
  const tauriConfPath = join(ROOT_DIR, "src-tauri", "tauri.conf.json");
  if (!existsSync(tauriConfPath)) {
    return false;
  }

  try {
    const content = readFileSync(tauriConfPath, "utf-8");
    // If tauri.conf.json still has the template's default productName,
    // setup hasn't run yet
    return !TAURI_PRODUCT_NAME_REGEX.test(content);
  } catch {
    return false;
  }
}

function isTemplateRepo(): boolean {
  try {
    // Check all remotes, not just origin
    const remotes = execSync("git remote -v", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();

    // If any remote URL contains the template name, this is the template repo
    if (remotes?.includes(TEMPLATE_NAME)) {
      return true;
    }

    // Also check if we're in the template repo by looking at the git root directory name
    // This handles the case where remotes haven't been set up yet
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();

    return gitRoot.endsWith(TEMPLATE_NAME);
  } catch {
    // No git - not the template repo (likely a fresh project from bun create)
    return false;
  }
}

function initGit(): boolean {
  try {
    // Check if already in a git repo
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: ROOT_DIR,
      stdio: ["pipe", "pipe", "ignore"],
    });
    info("Already inside a git repository, skipping git init");
    return true;
  } catch {
    // Not in a git repo, initialize one
    try {
      execSync("git init", {
        cwd: ROOT_DIR,
        stdio: ["pipe", "pipe", "ignore"],
      });
      success("Initialized git repository");
      return true;
    } catch {
      warn("Failed to initialize git repository");
      return false;
    }
  }
}

async function selectAgents(): Promise<string[]> {
  const choices = RULER_AGENTS.map((agent) => ({
    name: agent,
    value: agent,
    checked: DEFAULT_AGENTS.includes(agent),
  }));

  return await checkbox({
    message: "Select AI agents to configure",
    choices,
    pageSize: 15,
    loop: true,
  });
}

function updateRulerConfig(agents: string[]): boolean {
  const rulerPath = join(ROOT_DIR, ".ruler", "ruler.toml");

  if (!existsSync(rulerPath)) {
    warn("ruler.toml not found, skipping ruler configuration");
    return false;
  }

  try {
    let content = readFileSync(rulerPath, "utf-8");
    const agentsArray = JSON.stringify(agents);
    content = content.replace(
      RULER_DEFAULT_AGENTS_REGEX,
      `default_agents = ${agentsArray}`
    );
    writeFileSync(rulerPath, content, "utf-8");
    success("Updated .ruler/ruler.toml with selected agents");
    return true;
  } catch {
    warn("Failed to update ruler.toml");
    return false;
  }
}

function runRulerApply(): boolean {
  try {
    info("Applying ruler configurations...");
    execSync("bunx @intellectronica/ruler apply", {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });
    success("Applied ruler configurations");
    return true;
  } catch {
    warn(
      "Failed to apply ruler configurations. Run 'bunx @intellectronica/ruler apply' manually."
    );
    return false;
  }
}

function installLefthook(): boolean {
  try {
    info("Installing Lefthook git hooks...");
    execSync("bunx lefthook install", {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });
    success("Installed Lefthook git hooks");
    return true;
  } catch {
    warn("Failed to install Lefthook. Run 'bunx lefthook install' manually.");
    return false;
  }
}

function regenerateCargoLock(): boolean {
  try {
    info("Regenerating Cargo.lock...");
    execSync("cargo generate-lockfile", {
      cwd: join(ROOT_DIR, "src-tauri"),
      stdio: ["pipe", "pipe", "ignore"],
    });
    success("Regenerated Cargo.lock");
    return true;
  } catch {
    warn(
      "Failed to regenerate Cargo.lock. Run 'cargo generate-lockfile' in src-tauri/ manually."
    );
    return false;
  }
}

function updateBunLock(): boolean {
  try {
    info("Updating bun.lock...");
    execSync("bun install", {
      cwd: ROOT_DIR,
      stdio: ["pipe", "pipe", "ignore"],
    });
    success("Updated bun.lock");
    return true;
  } catch {
    warn("Failed to update bun.lock. Run 'bun install' manually.");
    return false;
  }
}

function createInitialCommit(): boolean {
  try {
    info("Creating initial commit...");
    execSync("git add -A", {
      cwd: ROOT_DIR,
      stdio: ["pipe", "pipe", "ignore"],
    });

    // Check if there's an existing commit to amend
    let hasExistingCommit = false;
    try {
      execSync("git rev-parse HEAD", {
        cwd: ROOT_DIR,
        stdio: ["pipe", "pipe", "ignore"],
      });
      hasExistingCommit = true;
    } catch {
      // No commits yet
    }

    if (hasExistingCommit) {
      execSync('git commit --amend --no-verify -m "feat: initial commit"', {
        cwd: ROOT_DIR,
        stdio: ["pipe", "pipe", "ignore"],
      });
    } else {
      execSync('git commit --no-verify -m "feat: initial commit"', {
        cwd: ROOT_DIR,
        stdio: ["pipe", "pipe", "ignore"],
      });
    }

    success("Created initial commit");
    return true;
  } catch {
    warn(
      "Failed to create initial commit. Run 'git add -A && git commit -m \"feat: initial commit\"' manually."
    );
    return false;
  }
}

function updateReadme(projectName: string, description: string): boolean {
  const readmePath = join(ROOT_DIR, "README.md");

  if (!existsSync(readmePath)) {
    return false;
  }

  try {
    let content = readFileSync(readmePath, "utf-8");
    content = content.replace(README_CI_BADGE_REGEX, "");
    content = content.replace(README_TITLE_REGEX, `# ${projectName}`);
    content = content.replace(README_DESCRIPTION_REGEX, description);
    content = content.replace(README_WHY_SECTION_REGEX, "");
    content = content.replace(README_QUICK_START_REGEX, "");
    content = content.replace(README_SETUP_TS_LINE_REGEX, "");
    writeFileSync(readmePath, content, "utf-8");
    success("Updated README.md");
    return true;
  } catch {
    warn("Failed to update README.md");
    return false;
  }
}

function generatePublishWorkflow(
  platforms: string[],
  signing: string[]
): string {
  const matrixIncludes: string[] = [];

  if (platforms.includes("macos-arm64")) {
    matrixIncludes.push(`          - platform: macos-latest
            args: --target aarch64-apple-darwin
            rust_targets: aarch64-apple-darwin`);
  }
  if (platforms.includes("macos-x64")) {
    matrixIncludes.push(`          - platform: macos-latest
            args: --target x86_64-apple-darwin
            rust_targets: x86_64-apple-darwin`);
  }
  if (platforms.includes("linux")) {
    matrixIncludes.push(`          - platform: ubuntu-22.04
            args: ""
            rust_targets: ""`);
  }
  if (platforms.includes("windows")) {
    matrixIncludes.push(`          - platform: windows-latest
            args: ""
            rust_targets: ""`);
  }

  const hasLinux = platforms.includes("linux");
  const hasMacSigning = signing.includes("macos");
  const hasWindowsSigning = signing.includes("windows");

  // Build signing environment variables section
  const signingEnvLines: string[] = [];
  if (hasMacSigning) {
    signingEnvLines.push(`          # macOS code signing
          APPLE_CERTIFICATE: \${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: \${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: \${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: \${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: \${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: \${{ secrets.APPLE_TEAM_ID }}`);
  }
  if (hasWindowsSigning) {
    signingEnvLines.push(`          # Windows/Tauri updater signing
          TAURI_SIGNING_PRIVATE_KEY: \${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: \${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}`);
  }

  const signingEnv =
    signingEnvLines.length > 0 ? `\n${signingEnvLines.join("\n")}` : "";

  // Build the Ubuntu dependencies step (only if Linux is selected)
  const ubuntuStep = hasLinux
    ? `
      - name: Install dependencies (Ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
`
    : "";

  return `name: Publish Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  publish-tauri:
    strategy:
      fail-fast: false
      matrix:
        include:
${matrixIncludes.join("\n")}

    runs-on: \${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: \${{ matrix.rust_targets }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: "./src-tauri -> target"
${ubuntuStep}
      - name: Install frontend dependencies
        run: bun install --frozen-lockfile

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}${signingEnv}
        with:
          tagName: \${{ github.ref_name }}
          releaseName: "\${{ github.ref_name }}"
          releaseBody: "See [CHANGELOG](https://github.com/\${{ github.repository }}/blob/main/CHANGELOG.md) for details."
          releaseDraft: true
          prerelease: false
          includeUpdaterJson: true
          args: \${{ matrix.args }}
`;
}

function updatePublishWorkflow(
  platforms: string[],
  signing: string[]
): boolean {
  const workflowPath = join(ROOT_DIR, ".github", "workflows", "publish.yml");

  if (!existsSync(workflowPath)) {
    warn("publish.yml not found, skipping workflow customization");
    return false;
  }

  try {
    const content = generatePublishWorkflow(platforms, signing);
    writeFileSync(workflowPath, content, "utf-8");
    success("Updated .github/workflows/publish.yml with selected platforms");
    return true;
  } catch {
    warn("Failed to update publish.yml");
    return false;
  }
}

async function main() {
  // Skip if this is the template repository itself
  if (isTemplateRepo()) {
    return;
  }

  // Skip if already configured (for postinstall on subsequent installs)
  if (isAlreadyConfigured()) {
    return;
  }

  log("");
  log(`${colors.cyan}🚀 Tauri + React Template Setup${colors.reset}`);
  log(`${colors.dim}─────────────────────────────────${colors.reset}`);
  log("");

  // Get current directory name as default project name
  const currentDirName = basename(ROOT_DIR);
  const defaultProjectName =
    currentDirName === TEMPLATE_NAME ? "my-app" : currentDirName;

  // Gather project information using inquirer
  const projectName = toKebabCase(
    await input({
      message: "Project name",
      default: defaultProjectName,
    })
  );

  const productName = await input({
    message: "Product name (display name)",
    default: projectName,
  });

  const username = await input({
    message: "GitHub username or organization",
    default: "example",
  });

  const identifier = await input({
    message: "Bundle identifier",
    default: `com.${username}.${projectName}`,
  });

  const author = await input({
    message: "Author name",
  });

  const description = await input({
    message: "Description",
    default: "A Tauri desktop application",
  });

  // Derived values
  const snakeCaseName = toSnakeCase(projectName);

  log("");
  info("Updating project files...");
  log("");

  // Update package.json
  updateFile("package.json", [
    {
      from: PKG_NAME_REGEX,
      to: `"name": "${projectName}"`,
    },
  ]);

  // Update tauri.conf.json
  updateFile("src-tauri/tauri.conf.json", [
    {
      from: TAURI_PRODUCT_NAME_REGEX,
      to: `"productName": "${productName}"`,
    },
    {
      from: TAURI_IDENTIFIER_REGEX,
      to: `"identifier": "${identifier}"`,
    },
    {
      from: TAURI_TITLE_REGEX,
      to: `"title": "${productName}"`,
    },
    {
      from: TAURI_UPDATER_ENDPOINT_REGEX,
      to: `"https://github.com/${username}/${projectName}/releases/latest/download/latest.json"`,
    },
    {
      from: TAURI_UPDATER_PUBKEY_REGEX,
      to: `"pubkey": "YOUR_PUBLIC_KEY_HERE"`,
    },
  ]);

  // Update Cargo.toml
  const cargoReplacements: Array<{ from: string | RegExp; to: string }> = [
    {
      from: CARGO_NAME_REGEX,
      to: `name = "${projectName}"`,
    },
    {
      from: CARGO_DESCRIPTION_REGEX,
      to: `description = "${description}"`,
    },
    {
      from: CARGO_LIB_NAME_REGEX,
      to: `name = "${snakeCaseName}_lib"`,
    },
    {
      from: CARGO_DEFAULT_RUN_REGEX,
      to: `default-run = "${projectName}"`,
    },
    {
      from: CARGO_BIN_NAME_REGEX,
      to: `$1name = "${projectName}"`,
    },
  ];

  if (author) {
    cargoReplacements.push({
      from: CARGO_AUTHORS_REGEX,
      to: `authors = ["${author}"]`,
    });
  }

  updateFile("src-tauri/Cargo.toml", cargoReplacements);

  // Update main.rs lib reference
  updateFile("src-tauri/src/main.rs", [
    {
      from: MAIN_RS_LIB_REGEX,
      to: `${snakeCaseName}_lib::run()`,
    },
  ]);

  // Update index.html
  updateFile("index.html", [
    {
      from: HTML_TITLE_REGEX,
      to: `<title>${productName}</title>`,
    },
  ]);

  // Update LICENSE if author provided
  if (author) {
    updateFile("LICENSE", [
      {
        from: LICENSE_COPYRIGHT_REGEX,
        to: `Copyright (c) 2025 ${author}`,
      },
    ]);
  }

  // Update AGENTS.md
  updateFile(".ruler/AGENTS.md", [
    {
      from: AGENTS_IDENTIFIER_REGEX,
      to: identifier,
    },
  ]);

  // Update CONTRIBUTING.md
  updateFile("CONTRIBUTING.md", [
    {
      from: CONTRIBUTING_CLONE_REGEX,
      to: `git clone https://github.com/${username}/${projectName}.git\n   cd ${projectName}`,
    },
  ]);

  // Update README.md (remove template-specific sections)
  updateReadme(productName, description);

  // Build configuration
  log("");
  log(`${colors.cyan}Build Configuration${colors.reset}`);
  log(`${colors.dim}─────────────────────────────────${colors.reset}`);
  log("");

  const buildPlatforms = await checkbox({
    message: "Select target platforms for releases",
    choices: BUILD_PLATFORMS.map((p) => ({
      name: p.name,
      value: p.value,
      checked: true,
    })),
  });

  const enableCodeSigning = await checkbox({
    message: "Enable code signing (requires GitHub secrets setup)",
    choices: CODE_SIGNING_OPTIONS.map((o) => ({
      name: o.name,
      value: o.value,
      checked: false,
    })),
  });

  // Update publish workflow with selected platforms
  if (buildPlatforms.length > 0) {
    updatePublishWorkflow(buildPlatforms, enableCodeSigning);
  } else {
    warn("No platforms selected, keeping default publish workflow");
  }

  // Initialize git repository
  log("");
  info("Setting up development environment...");
  log("");

  const gitInitialized = initGit();

  // Select AI agents
  log("");
  const selectedAgents = await selectAgents();

  if (selectedAgents.length > 0) {
    updateRulerConfig(selectedAgents);
    runRulerApply();
  } else {
    info("No agents selected, skipping ruler configuration");
  }

  // Install lefthook (only if git was initialized or exists)
  if (gitInitialized) {
    log("");
    installLefthook();
  }

  // Update package.json - remove setup scripts and @inquirer/prompts dependency
  log("");
  info("Cleaning up template files...");
  log("");

  updateFile("package.json", [
    {
      from: PKG_POSTINSTALL_REGEX,
      to: "",
    },
    {
      from: PKG_SETUP_REGEX,
      to: "",
    },
    {
      from: PKG_INQUIRER_REGEX,
      to: "\n",
    },
    {
      from: PKG_BIN_REGEX,
      to: "",
    },
  ]);

  // Regenerate Cargo.lock (excluded from template copy)
  regenerateCargoLock();

  // Update bun.lock after package.json changes (removed @inquirer/prompts)
  updateBunLock();

  // Delete template-only files
  deleteFile("scripts/setup.ts");
  deleteFile(".github/TEMPLATE_README.md");
  deleteFile("suggestions.md");

  // Create initial commit with all changes
  createInitialCommit();

  log("");
  log(`${colors.green}✨ Setup complete!${colors.reset}`);
  log("");
  log("Next steps:");
  log(`  ${colors.dim}1.${colors.reset} bun tauri dev`);
  log("");
}

main().catch(console.error);
