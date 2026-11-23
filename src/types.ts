export type StackType = 'expo' | 'react-web' | 'laravel' | 'python' | 'universal';

export type AssetStatus = 'USED' | 'UNUSED' | 'DYNAMIC_SUSPECT' | 'PROTECTED';

export interface AssetFile {
  absolutePath: string;
  relativePath: string; // POSIX normalized (e.g., "public/images/logo.png")
  basename: string;     // e.g., "logo.png"
  stem: string;         // e.g., "logo"
  directory: string;    // e.g., "public/images"
  sizeBytes: number;
  status: AssetStatus;
  matchedIn?: string;   // First source file where reference was found
  reason?: string;      // Explanation if DYNAMIC_SUSPECT or PROTECTED
}

export interface SweepConfig {
  rootDir: string;
  assetDirs: string[];
  ignorePatterns: string[];
  protectedFiles: string[];
  extensions: string[];
  matchExtensionless: boolean;
  dryRun: boolean;
  useTrash: boolean;
  ciMode: boolean;
  yes: boolean;
}

export interface AssetSweepFileConfig {
  assetDirs?: string[];
  ignorePatterns?: string[];
  protectedFiles?: string[];
  extensions?: string[];
  matchExtensionless?: boolean;
}

export interface TrashManifestEntry {
  originalRelativePath: string;
  trashPath: string;
  deletedAt: string;
  sizeBytes: number;
}
