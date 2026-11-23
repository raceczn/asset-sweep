import fs from 'node:fs/promises';
import path from 'node:path';
import { StackType } from '../types.js';

export interface DetectionResult {
  stack: StackType;
  defaultAssetDirs: string[];
  extraIgnores: string[];
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function detectProjectStack(rootDir: string): Promise<DetectionResult> {
  // 1. Laravel / PHP
  if (await fileExists(path.join(rootDir, 'artisan'))) {
    return {
      stack: 'laravel',
      defaultAssetDirs: ['public', 'resources/images', 'resources/assets', 'resources/fonts'],
      extraIgnores: ['storage/framework/**', 'storage/logs/**', 'bootstrap/cache/**']
    };
  }

  // 2. Expo / React Native / Web JS Frameworks
  const pkgPath = path.join(rootDir, 'package.json');
  if (await fileExists(pkgPath)) {
    try {
      const pkgRaw = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgRaw);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps['expo'] || allDeps['react-native'] || (await fileExists(path.join(rootDir, 'app.json')))) {
        return {
          stack: 'expo',
          defaultAssetDirs: ['assets', 'src/assets', 'app/assets'],
          extraIgnores: ['android/app/build/**', 'ios/Pods/**', '.expo/**']
        };
      }

      if (allDeps['next'] || allDeps['vite'] || allDeps['react'] || allDeps['vue'] || allDeps['svelte']) {
        return {
          stack: 'react-web',
          defaultAssetDirs: ['public', 'src/assets', 'assets', 'static'],
          extraIgnores: ['.vercel/**', '.netlify/**', '.output/**']
        };
      }
    } catch {
      // Malformed package.json -> fall through to Python / Universal
    }
  }

  // 3. Python (FastAPI / Django / Flask)
  const hasPythonMarker =
    (await fileExists(path.join(rootDir, 'pyproject.toml'))) ||
    (await fileExists(path.join(rootDir, 'requirements.txt'))) ||
    (await fileExists(path.join(rootDir, 'manage.py')));

  if (hasPythonMarker) {
    return {
      stack: 'python',
      defaultAssetDirs: ['static', 'media', 'assets', 'app/static'],
      extraIgnores: ['*.egg-info/**', '.pytest_cache/**', '.mypy_cache/**']
    };
  }

  // 4. Universal Fallback (Go, Rust, Ruby, Plain HTML, Monorepos)
  return {
    stack: 'universal',
    defaultAssetDirs: ['.'],
    extraIgnores: []
  };
}
