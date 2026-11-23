import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { detectProjectStack } from '../src/core/detector.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

describe('detectProjectStack', () => {
  it('detects Expo / React Native projects', async () => {
    const res = await detectProjectStack(path.join(fixturesDir, 'expo-app'));
    expect(res.stack).toBe('expo');
    expect(res.defaultAssetDirs).toContain('assets');
  });

  it('detects Laravel / PHP projects', async () => {
    const res = await detectProjectStack(path.join(fixturesDir, 'laravel-app'));
    expect(res.stack).toBe('laravel');
    expect(res.defaultAssetDirs).toContain('public');
  });

  it('detects Python / FastAPI projects', async () => {
    const res = await detectProjectStack(path.join(fixturesDir, 'fastapi-app'));
    expect(res.stack).toBe('python');
    expect(res.defaultAssetDirs).toContain('static');
  });

  it('detects React / Vite web projects', async () => {
    const res = await detectProjectStack(path.join(fixturesDir, 'react-vite'));
    expect(res.stack).toBe('react-web');
    expect(res.defaultAssetDirs).toContain('src/assets');
  });

  it('falls back to universal mode when no markers exist', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-sweep-universal-'));
    try {
      const res = await detectProjectStack(emptyDir);
      expect(res.stack).toBe('universal');
      expect(res.defaultAssetDirs).toEqual(['.']);
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });
});
