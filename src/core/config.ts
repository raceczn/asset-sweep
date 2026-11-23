import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_ASSET_EXTENSIONS,
  DEFAULT_PROTECTED_FILES,
  GLOBAL_IGNORE_PATTERNS
} from '../constants.js';
import { AssetSweepFileConfig, SweepConfig } from '../types.js';
import { detectProjectStack, DetectionResult } from './detector.js';

export const CONFIG_FILE_NAME = 'assetsweep.config.json';

export interface CliConfigOptions {
  dir?: string;
  ext?: string;
  extensionless?: boolean;
  dryRun?: boolean;
  permanent?: boolean;
  ci?: boolean;
  yes?: boolean;
}

export interface LoadedConfig {
  config: SweepConfig;
  detection: DetectionResult;
}

async function readFileConfig(rootDir: string): Promise<AssetSweepFileConfig> {
  const configPath = path.join(rootDir, CONFIG_FILE_NAME);
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw) as AssetSweepFileConfig;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return {};
    }
    throw new Error(`Failed to parse ${CONFIG_FILE_NAME}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function loadSweepConfig(
  rootDir: string,
  options: CliConfigOptions = {}
): Promise<LoadedConfig> {
  const [detection, fileConfig] = await Promise.all([
    detectProjectStack(rootDir),
    readFileConfig(rootDir)
  ]);

  const assetDirs = options.dir
    ? options.dir.split(',').map((s) => s.trim()).filter(Boolean)
    : fileConfig.assetDirs ?? detection.defaultAssetDirs;

  const ignorePatterns = Array.from(
    new Set([
      ...GLOBAL_IGNORE_PATTERNS,
      ...detection.extraIgnores,
      ...(fileConfig.ignorePatterns ?? [])
    ])
  );

  const protectedFiles = Array.from(
    new Set([
      ...DEFAULT_PROTECTED_FILES,
      ...(fileConfig.protectedFiles ?? [])
    ])
  );

  const extensions = options.ext
    ? options.ext.split(',').map((s) => s.trim().replace(/^\./, '')).filter(Boolean)
    : fileConfig.extensions ?? DEFAULT_ASSET_EXTENSIONS;

  const config: SweepConfig = {
    rootDir,
    assetDirs,
    ignorePatterns,
    protectedFiles,
    extensions,
    matchExtensionless: options.extensionless ?? fileConfig.matchExtensionless ?? false,
    dryRun: Boolean(options.dryRun),
    useTrash: !options.permanent,
    ciMode: Boolean(options.ci),
    yes: Boolean(options.yes)
  };

  return { config, detection };
}
