import fs from 'node:fs/promises';
import path from 'node:path';
import { AssetFile, TrashManifestEntry } from '../types.js';

export const TRASH_DIR_NAME = '.asset-sweep-trash';
const MANIFEST_FILE = 'manifest.json';

async function ensureTrashGitignored(rootDir: string): Promise<void> {
  const gitignorePath = path.join(rootDir, '.gitignore');
  try {
    const content = await fs.readFile(gitignorePath, 'utf-8');
    if (content.includes(TRASH_DIR_NAME)) return;
    const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    await fs.writeFile(gitignorePath, `${content}${prefix}${TRASH_DIR_NAME}/\n`, 'utf-8');
  } catch (err: unknown) {
    // Only append if .gitignore already exists; avoid creating unexpected files
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return;
    }
  }
}

export async function sweepAssets(
  rootDir: string,
  targets: AssetFile[],
  useTrash: boolean
): Promise<{ deletedCount: number; freedBytes: number }> {
  let deletedCount = 0;
  let freedBytes = 0;

  const trashRoot = path.join(rootDir, TRASH_DIR_NAME);
  const manifestPath = path.join(trashRoot, MANIFEST_FILE);
  let manifest: TrashManifestEntry[] = [];

  if (useTrash) {
    await fs.mkdir(trashRoot, { recursive: true });
    await ensureTrashGitignored(rootDir);
    try {
      const existing = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(existing);
    } catch {
      manifest = [];
    }
  }

  for (const asset of targets) {
    if (useTrash) {
      const destPath = path.join(trashRoot, asset.relativePath);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.rename(asset.absolutePath, destPath);

      manifest.push({
        originalRelativePath: asset.relativePath,
        trashPath: path.posix.join(TRASH_DIR_NAME, asset.relativePath),
        deletedAt: new Date().toISOString(),
        sizeBytes: asset.sizeBytes
      });
    } else {
      await fs.unlink(asset.absolutePath);
    }

    deletedCount++;
    freedBytes += asset.sizeBytes;
  }

  if (useTrash && manifest.length > 0) {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  return { deletedCount, freedBytes };
}

export async function restoreFromTrash(rootDir: string): Promise<number> {
  const trashRoot = path.join(rootDir, TRASH_DIR_NAME);
  const manifestPath = path.join(trashRoot, MANIFEST_FILE);

  const raw = await fs.readFile(manifestPath, 'utf-8');
  const manifest: TrashManifestEntry[] = JSON.parse(raw);

  let restored = 0;
  for (const entry of manifest) {
    const src = path.join(rootDir, entry.trashPath);
    const dest = path.join(rootDir, entry.originalRelativePath);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
    restored++;
  }

  await fs.rm(trashRoot, { recursive: true, force: true });
  return restored;
}
