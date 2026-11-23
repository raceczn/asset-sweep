# Contributing to asset-sweep

First off, thank you for considering contributing to `asset-sweep`! Contributions from the community help make multi-stack asset auditing safer and faster for everyone.

## How to Contribute

### 1. Fork the Repository
Click the **Fork** button at the top right of the GitHub page to create a copy of this repository on your GitHub account.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/asset-sweep.git
cd asset-sweep
```

### 3. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Local Development
Install dependencies and build the CLI:
```bash
npm install
npm run build
```

You can test the CLI locally against any project or fixture:
```bash
npm run dev -- tests/fixtures/expo-app --dry-run
```

### 5. Run Tests & Type-Check
Before committing, make sure TypeScript checks and the Vitest suite pass:
```bash
npx tsc --noEmit
npm test
```

### 6. Commit and Push
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 7. Create a Pull Request
1. Open your fork on GitHub and click **Compare & pull request**.
2. Describe what your change does and which stacks/tests it affects.
3. Ensure the CI workflow passes on your PR.

---

## Code of Conduct & Guidelines
- Add or update Vitest tests under `tests/` for any new stack preset, matcher rule, or CLI behavior.
- Keep functions focused and preserve existing safety guards (especially dynamic interpolation checks and trash/restore behavior).
- Be respectful and constructive in issues and PR reviews.
