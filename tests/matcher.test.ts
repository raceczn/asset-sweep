import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSweepConfig } from '../src/core/config.js';
import { scanWorkspace } from '../src/core/scanner.js';
import { matchAssetsAgainstCodebase } from '../src/core/matcher.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

async function runPipeline(fixtureName: string, extensionless = false) {
  const rootDir = path.join(fixturesDir, fixtureName);
  const { config } = await loadSweepConfig(rootDir, { extensionless });
  const { assets, sourceFiles } = await scanWorkspace(config);
  return matchAssetsAgainstCodebase(assets, sourceFiles, config);
}

describe('matchAssetsAgainstCodebase', () => {
  it('evaluates Expo assets with protected, used, unused, and dynamic suspect', async () => {
    const evaluated = await runPipeline('expo-app');
    const byPath = new Map(evaluated.map((a) => [a.relativePath, a]));

    expect(byPath.get('assets/icon.png')?.status).toBe('PROTECTED');
    expect(byPath.get('assets/hero.png')?.status).toBe('USED');
    expect(byPath.get('assets/unused-banner.png')?.status).toBe('UNUSED');
    expect(byPath.get('assets/avatars/avatar-1.png')?.status).toBe('DYNAMIC_SUSPECT');
  });

  it('evaluates Laravel Blade templates and PHP interpolation', async () => {
    const evaluated = await runPipeline('laravel-app');
    const byPath = new Map(evaluated.map((a) => [a.relativePath, a]));

    expect(byPath.get('public/images/logo.svg')?.status).toBe('USED');
    expect(byPath.get('public/images/unused-bg.jpg')?.status).toBe('UNUSED');
    expect(byPath.get('public/images/icons/bell.svg')?.status).toBe('DYNAMIC_SUSPECT');
  });

  it('evaluates Python FastAPI static references and f-strings', async () => {
    const evaluated = await runPipeline('fastapi-app');
    const byPath = new Map(evaluated.map((a) => [a.relativePath, a]));

    expect(byPath.get('static/banner.webp')?.status).toBe('USED');
    expect(byPath.get('static/old-chart.png')?.status).toBe('UNUSED');
    expect(byPath.get('static/cards/ace.jpg')?.status).toBe('DYNAMIC_SUSPECT');
  });

  it('supports opt-in extensionless matching in React Vite', async () => {
    const withoutFlag = await runPipeline('react-vite', false);
    const withFlag = await runPipeline('react-vite', true);

    const mapWithout = new Map(withoutFlag.map((a) => [a.relativePath, a]));
    const mapWith = new Map(withFlag.map((a) => [a.relativePath, a]));

    expect(mapWithout.get('public/favicon.ico')?.status).toBe('PROTECTED');
    expect(mapWithout.get('src/assets/spark.svg')?.status).toBe('USED');
    expect(mapWithout.get('src/assets/badge.png')?.status).toBe('UNUSED');
    expect(mapWith.get('src/assets/badge.png')?.status).toBe('USED');
    expect(mapWith.get('src/assets/stale.png')?.status).toBe('UNUSED');
  });
});
