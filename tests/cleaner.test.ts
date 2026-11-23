import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreFromTrash, sweepAssets, TRASH_DIR_NAME } from '../src/core/cleaner.js';
import { AssetFile } from '../src/types.js';

const tempDirs: string[] = [];

async function makeTempWorkspace(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-sweep-clean-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('sweepAssets & restoreFromTrash', () => {
  it('moves assets to trash, appends .gitignore, and restores them cleanly', async () => {
    const rootDir = await makeTempWorkspace();
    const assetRel = 'assets/dead.png';
    const assetAbs = path.join(rootDir, assetRel);
    await fs.mkdir(path.dirname(assetAbs), { recursive: true });
    await fs.writeFile(assetAbs, 'dead-bytes');
    await fs.writeFile(path.join(rootDir, '.gitignore'), 'node_modules/\n');

    const target: AssetFile = {
      absolutePath: assetAbs,
      relativePath: assetRel,
      basename: 'dead.png',
      stem: 'dead',
      directory: 'assets',
      sizeBytes: 10,
      status: 'UNUSED'
    };

    const result = await sweepAssets(rootDir, [target], true);
    expect(result.deletedCount).toBe(1);
    expect(result.freedBytes).toBe(10);

    await expect(fs.access(assetAbs)).rejects.toThrow();
    await expect(fs.access(path.join(rootDir, TRASH_DIR_NAME, assetRel))).resolves.toBeUndefined();

    const gitignore = await fs.readFile(path.join(rootDir, '.gitignore'), 'utf-8');
    expect(gitignore).toContain(`${TRASH_DIR_NAME}/`);

    const restoredCount = await restoreFromTrash(rootDir);
    expect(restoredCount).toBe(1);
    await expect(fs.access(assetAbs)).resolves.toBeUndefined();
    await expect(fs.access(path.join(rootDir, TRASH_DIR_NAME))).rejects.toThrow();
  });

  it('permanently deletes assets when useTrash is false', async () => {
    const rootDir = await makeTempWorkspace();
    const assetRel = 'assets/perm.png';
    const assetAbs = path.join(rootDir, assetRel);
    await fs.mkdir(path.dirname(assetAbs), { recursive: true });
    await fs.writeFile(assetAbs, '12345');

    const target: AssetFile = {
      absolutePath: assetAbs,
      relativePath: assetRel,
      basename: 'perm.png',
      stem: 'perm',
      directory: 'assets',
      sizeBytes: 5,
      status: 'UNUSED'
    };

    const result = await sweepAssets(rootDir, [target], false);
    expect(result.deletedCount).toBe(1);
    expect(result.freedBytes).toBe(5);
    await expect(fs.access(assetAbs)).rejects.toThrow();
    await expect(fs.access(path.join(rootDir, TRASH_DIR_NAME))).rejects.toThrow();
  });
});
