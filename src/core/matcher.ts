import fs from 'node:fs/promises';
import path from 'node:path';
import { AssetFile, SweepConfig } from '../types.js';

const MAX_SOURCE_FILE_SIZE = 2 * 1024 * 1024; // 2MB cap per source file

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasDynamicFolderReference(content: string, assetDir: string, ext: string): boolean {
  if (!assetDir || assetDir === '.') return false;

  const urlSubPath = assetDir.replace(/^(public|static|resources)\//, '');
  if (!urlSubPath) return false;

  const escapedDir = escapeRegExp(urlSubPath);
  const escapedExt = escapeRegExp(ext);

  const dynamicPatterns = [
    // JS/TS template literals: `/assets/${icon}.png`
    new RegExp(`${escapedDir}/[^\`"'/]*\\$\\{[^}]+\\}[^\`"'/]*\\.${escapedExt}`, 'i'),
    // PHP Blade / String concat: "images/{$icon}.svg" or 'images/' . $icon
    new RegExp(`${escapedDir}/[^"'/]*\\{\\$[^}]+\\}[^"'/]*\\.${escapedExt}`, 'i'),
    new RegExp(`${escapedDir}/['"]\\s*\\.\\s*\\$[a-zA-Z0-9_]+`, 'i'),
    // Python f-string / .format(): f"static/{name}.jpg"
    new RegExp(`${escapedDir}/[^"'/]*\\{[^}]+\\}[^"'/]*\\.${escapedExt}`, 'i')
  ];

  return dynamicPatterns.some((regex) => regex.test(content));
}

export async function matchAssetsAgainstCodebase(
  assets: AssetFile[],
  sourceFiles: string[],
  config: SweepConfig
): Promise<AssetFile[]> {
  const candidates = assets.filter((a) => a.status !== 'PROTECTED');
  if (candidates.length === 0) return assets;

  const descriptors = candidates.map((asset) => {
    const webRelativePath = asset.relativePath.replace(/^(public|static|resources)\//, '');
    const ext = path.posix.extname(asset.basename).slice(1);

    return {
      asset,
      ext,
      webRelativePath,
      basenameRegex: new RegExp(`(?:^|["'\`\\/\\\\\\s(=:])${escapeRegExp(asset.basename)}(?:["'\`\\s)?&#]|$)`, 'i'),
      stemRegex: config.matchExtensionless
        ? new RegExp(`(?:["'\`\\/\\\\])${escapeRegExp(asset.stem)}(?:["'\`])`, 'i')
        : null
    };
  });

  for (const relSource of sourceFiles) {
    if (descriptors.every((d) => d.asset.status === 'USED')) break;

    const absSource = path.join(config.rootDir, relSource);
    try {
      const stat = await fs.stat(absSource);
      if (stat.size > MAX_SOURCE_FILE_SIZE) continue;

      const content = await fs.readFile(absSource, 'utf-8');

      for (const desc of descriptors) {
        if (desc.asset.status === 'USED') continue;

        const quickHit =
          content.includes(desc.asset.basename) ||
          (config.matchExtensionless && content.includes(desc.asset.stem));

        if (quickHit) {
          if (
            content.includes(desc.webRelativePath) ||
            desc.basenameRegex.test(content) ||
            (desc.stemRegex && desc.stemRegex.test(content))
          ) {
            desc.asset.status = 'USED';
            desc.asset.matchedIn = relSource;
            continue;
          }
        }

        if (
          desc.asset.status === 'UNUSED' &&
          content.includes(desc.asset.directory.split('/').pop() || '') &&
          hasDynamicFolderReference(content, desc.asset.directory, desc.ext)
        ) {
          desc.asset.status = 'DYNAMIC_SUSPECT';
          desc.asset.reason = `Dynamic path interpolation detected in ${relSource}`;
        }
      }
    } catch {
      // Safely skip unreadable or locked files
    }
  }

  return assets;
}
