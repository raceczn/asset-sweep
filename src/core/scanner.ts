import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { AssetFile, SweepConfig } from '../types.js';
import { SOURCE_FILE_GLOBS } from '../constants.js';
import { toPosixPath } from '../utils/path.js';

export interface ScanOutput {
  assets: AssetFile[];
  sourceFiles: string[];
}

export async function scanWorkspace(config: SweepConfig): Promise<ScanOutput> {
  const extPattern = config.extensions.join(',');

  const assetGlobs = config.assetDirs.map((dir) => {
    const cleanDir = toPosixPath(dir).replace(/\/+$/, '');
    return cleanDir === '.' ? `**/*.{${extPattern}}` : `${cleanDir}/**/*.{${extPattern}}`;
  });

  const [rawAssetPaths, rawSourcePaths] = await Promise.all([
    fg(assetGlobs, {
      cwd: config.rootDir,
      ignore: config.ignorePatterns,
      onlyFiles: true,
      caseSensitiveMatch: false,
      unique: true
    }),
    fg(SOURCE_FILE_GLOBS, {
      cwd: config.rootDir,
      ignore: config.ignorePatterns,
      onlyFiles: true,
      unique: true
    })
  ]);

  const assets: AssetFile[] = await Promise.all(
    rawAssetPaths.map(async (relPath) => {
      const normalizedRel = toPosixPath(relPath);
      const absPath = path.join(config.rootDir, normalizedRel);
      const stat = await fs.stat(absPath);
      const parsed = path.posix.parse(normalizedRel);

      const isProtected = config.protectedFiles.some(
        (p) => p.toLowerCase() === parsed.base.toLowerCase() || toPosixPath(p) === normalizedRel
      );

      return {
        absolutePath: absPath,
        relativePath: normalizedRel,
        basename: parsed.base,
        stem: parsed.name,
        directory: parsed.dir,
        sizeBytes: stat.size,
        status: isProtected ? 'PROTECTED' : 'UNUSED',
        reason: isProtected ? 'Protected system/framework asset' : undefined
      };
    })
  );

  const assetSet = new Set(rawAssetPaths.map(toPosixPath));
  const sourceFiles = rawSourcePaths
    .map(toPosixPath)
    .filter((f) => !assetSet.has(f));

  return { assets, sourceFiles };
}
