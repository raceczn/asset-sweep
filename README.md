# asset-sweep

Zero-config, multi-stack CLI tool to detect, report, and safely sweep unreferenced media, fonts, and static assets across **React, Expo / React Native, Next.js / Vite, Laravel / PHP, Python (FastAPI / Django / Flask)**, and generic codebases.

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#commands--cli-flags">Commands & Flags</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#configuration-assetsweepconfigjson">Configuration</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Installation

Run without installing globally using `npx`:

```bash
npx asset-sweep --dry-run
```

Or install globally:

```bash
npm install -g asset-sweep
```

Or run directly in a project's CI/CD pipeline:

```bash
npx asset-sweep --ci
```

---

## Commands & CLI Flags

### Commands

| Command | Description |
| :--- | :--- |
| `asset-sweep [root]` | Scan `[root]` (defaults to `.`) and interactively select unused assets to sweep. |
| `asset-sweep restore [root]` | Restore all assets previously moved to `.asset-sweep-trash/` back to their original paths. |

### Options

| Flag | Default | Description |
| :--- | :---: | :--- |
| `--dir <dirs>` | Auto-detected | Comma-separated asset directories (e.g., `--dir public,src/assets`). |
| `--ext <exts>` | Built-in list | Comma-separated asset extensions to scan (e.g., `--ext png,jpg,svg,webp`). |
| `--extensionless` | `false` | Match filenames without extensions (for native catalogs or extensionless imports). |
| `-d, --dry-run` | `false` | Preview unused assets and reclaimable size without modifying any files. |
| `-y, --yes` | `false` | Skip interactive confirmation and sweep all unused assets. |
| `-p, --permanent` | `false` | Permanently delete files instead of moving them to `.asset-sweep-trash/`. |
| `--ci` | `false` | Output JSON (`{ stack, unusedCount, unused }`) and exit with code `1` if unused assets are found. |
| `-h, --help` | — | Display CLI help. |
| `-v, --version` | — | Display CLI version. |

### Common Examples

```bash
# 1. Safe preview in the current project
npx asset-sweep --dry-run

# 2. Interactive checklist (Space to toggle, Enter to confirm)
npx asset-sweep

# 3. Sweep all unused assets to .asset-sweep-trash/ without prompts
npx asset-sweep -y

# 4. Undo the last sweep and restore all trashed assets
npx asset-sweep restore

# 5. Permanently delete all unused assets (irreversible)
npx asset-sweep -y --permanent

# 6. Fail a CI build if unused assets exist
npx asset-sweep --ci
```

---

## How It Works

Instead of relying on single-language AST parsers, `asset-sweep` uses a **4-Stage Reverse-Lookup Pipeline**:

1. **Stack Auto-Detection & Config Resolution**
   Detects your project type automatically from root marker files and resolves default asset directories and ignore rules:

   | Stack | Marker Files | Default Asset Dirs |
   | :--- | :--- | :--- |
   | **Expo / React Native** | `app.json`, `expo` / `react-native` in `package.json` | `assets`, `src/assets`, `app/assets` |
   | **React / Next / Vite / Vue / Svelte** | `next`, `vite`, `react`, `vue`, `svelte` in `package.json` | `public`, `src/assets`, `assets`, `static` |
   | **Laravel / PHP** | `artisan` | `public`, `resources/images`, `resources/assets`, `resources/fonts` |
   | **Python (FastAPI / Django / Flask)** | `pyproject.toml`, `requirements.txt`, `manage.py` | `static`, `media`, `assets`, `app/static` |
   | **Universal Fallback** | Any other codebase | `.` |

2. **Parallel Workspace Crawling**
   Concurrently indexes candidate assets (images, vectors, fonts, audio/video, `.lottie`, `.pdf`) and source/template files (`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.svelte`, `.php`, `.blade.php`, `.py`, `.html`, `.css`, `.scss`, `.json`, `.yaml`, `.md`, etc.) while ignoring `node_modules`, `vendor`, `.git`, `venv`, `dist`, `.next`, `.expo`, and `.asset-sweep-trash`.

3. **4-Tier Reverse Lookup & Dynamic Guard**
   - **Protected System Assets**: `favicon.ico`, `apple-touch-icon.png`, `icon.png`, `splash.png`, `robots.txt`, `manifest.json`, etc. are automatically marked `PROTECTED`.
   - **Exact Web/Relative Path**: Matches references like `images/hero.webp`.
   - **Boundary-Safe Basename**: Matches `require('./hero.webp')`, `asset('images/hero.webp')`, `url_for('static', filename='hero.webp')`.
   - **Extensionless Match (`--extensionless`)**: Matches stem names without extensions.
   - **Dynamic Interpolation Guard**: Detects template literals (`` `/assets/${icon}.png` ``), PHP interpolation/concatenation (`"images/{$icon}.svg"`), and Python f-strings (`f"static/{card}.jpg"`) targeting an asset's folder, flagging those assets as `DYNAMIC_SUSPECT` so they are never deleted by accident.

4. **Reversible Trash & Restore**
   By default, swept files are moved into `.asset-sweep-trash/` with a `manifest.json` tracking original paths, and `.asset-sweep-trash/` is automatically added to `.gitignore` if one exists. Run `asset-sweep restore` anytime to revert.

---

## Configuration (`assetsweep.config.json`)

Create an optional `assetsweep.config.json` in your project root to customize behavior:

```json
{
  "assetDirs": ["public", "src/assets"],
  "ignorePatterns": ["**/drafts/**"],
  "protectedFiles": ["og-image.png"],
  "extensions": ["png", "jpg", "jpeg", "webp", "svg"],
  "matchExtensionless": false
}
```

- `ignorePatterns` and `protectedFiles` are merged with the built-in defaults.
- CLI flags (`--dir`, `--ext`, `--extensionless`) take precedence over `assetsweep.config.json`.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Type-check
npx tsc --noEmit

# Build ESM bundle & type declarations
npm run build

# Run Vitest suite (detector, matcher, cleaner, config)
npm test
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up the repo, running tests, and submitting pull requests.

---

## License

[MIT](LICENSE) © 2026
