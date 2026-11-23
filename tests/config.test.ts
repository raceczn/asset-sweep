import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CONFIG_FILE_NAME, loadSweepConfig } from '../src/core/config.js';

const tempDirs: string[] = [];

async function makeTempWorkspace(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-sweep-cfg-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('loadSweepConfig', () => {
  it('merges assetsweep.config.json with defaults and respects CLI overrides', async () => {
    const rootDir = await makeTempWorkspace();
    await fs.writeFile(
      path.join(rootDir, CONFIG_FILE_NAME),
      JSON.stringify({
        assetDirs: ['custom-assets'],
        ignorePatterns: ['**/drafts/**'],
        protectedFiles: ['og-image.png'],
        extensions: ['png', 'svg'],
        matchExtensionless: true
      })
    );

    const { config } = await loadSweepConfig(rootDir, {});
    expect(config.assetDirs).toEqual(['custom-assets']);
    expect(config.ignorePatterns).toContain('**/drafts/**');
    expect(config.ignorePatterns).toContain('**/node_modules/**');
    expect(config.protectedFiles).toContain('og-image.png');
    expect(config.protectedFiles).toContain('favicon.ico');
    expect(config.extensions).toEqual(['png', 'svg']);
    expect(config.matchExtensionless).toBe(true);

    const { config: cliOverride } = await loadSweepConfig(rootDir, {
      dir: 'media,uploads',
      ext: 'webp'
    });
    expect(cliOverride.assetDirs).toEqual(['media', 'uploads']);
    expect(cliOverride.extensions).toEqual(['webp']);
  });
});
