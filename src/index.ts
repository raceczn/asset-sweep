#!/usr/bin/env node
import path from 'node:path';
import { cac } from 'cac';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadSweepConfig } from './core/config.js';
import { scanWorkspace } from './core/scanner.js';
import { matchAssetsAgainstCodebase } from './core/matcher.js';
import { sweepAssets, restoreFromTrash } from './core/cleaner.js';
import { formatBytes } from './utils/path.js';

const cli = cac('asset-sweep');

cli
  .command('[root]', 'Scan and sweep unused assets across any codebase')
  .option('--dir <dirs>', 'Comma-separated asset directories (overrides auto-detect)')
  .option('--ext <exts>', 'Comma-separated file extensions to scan')
  .option('--extensionless', 'Match filenames without file extensions', { default: false })
  .option('-d, --dry-run', 'Preview unused assets without deleting anything', { default: false })
  .option('-p, --permanent', 'Permanently delete files instead of moving to .asset-sweep-trash', { default: false })
  .option('--ci', 'CI mode: outputs JSON and exits with code 1 if unused assets are found', { default: false })
  .option('-y, --yes', 'Skip interactive confirmation and sweep all unused assets', { default: false })
  .action(async (root = '.', options) => {
    const rootDir = path.resolve(process.cwd(), root);

    if (!options.ci) {
      p.intro(pc.bgCyan(pc.black(' asset-sweep ')));
    }

    const spinner = options.ci ? null : p.spinner();
    spinner?.start('Detecting project stack & indexing workspace...');

    const { config, detection } = await loadSweepConfig(rootDir, {
      dir: options.dir,
      ext: options.ext,
      extensionless: Boolean(options.extensionless),
      dryRun: Boolean(options.dryRun),
      permanent: Boolean(options.permanent),
      ci: Boolean(options.ci),
      yes: Boolean(options.yes)
    });

    const { assets, sourceFiles } = await scanWorkspace(config);
    spinner?.message(
      `Stack: ${pc.bold(detection.stack.toUpperCase())} | Scanning ${assets.length} assets across ${sourceFiles.length} source files...`
    );

    const evaluated = await matchAssetsAgainstCodebase(assets, sourceFiles, config);
    const unused = evaluated.filter((a) => a.status === 'UNUSED');
    const suspects = evaluated.filter((a) => a.status === 'DYNAMIC_SUSPECT');

    spinner?.stop(`Scan complete (${pc.cyan(detection.stack)} mode)`);

    if (options.ci) {
      console.log(JSON.stringify({ stack: detection.stack, unusedCount: unused.length, unused }, null, 2));
      process.exit(unused.length > 0 ? 1 : 0);
    }

    if (suspects.length > 0) {
      p.log.warn(
        `${pc.yellow(String(suspects.length))} asset(s) skipped due to dynamic path interpolation (e.g., ${suspects[0].relativePath})`
      );
    }

    if (unused.length === 0) {
      p.outro(pc.green('Zero unused assets found. Your repository is spotless!'));
      return;
    }

    const totalReclaimable = unused.reduce((sum, a) => sum + a.sizeBytes, 0);
    p.log.info(
      `Found ${pc.bold(pc.red(String(unused.length)))} unused asset(s) totaling ${pc.bold(pc.yellow(formatBytes(totalReclaimable)))}`
    );

    if (config.dryRun) {
      unused.forEach((a) => {
        console.log(`  ${pc.red('✖')} ${a.relativePath} ${pc.dim(`(${formatBytes(a.sizeBytes)})`)}`);
      });
      p.outro(pc.dim('Dry run complete. No files were modified.'));
      return;
    }

    let selectedAssets = unused;

    if (!config.yes) {
      const chosen = await p.multiselect({
        message: 'Select unused assets to sweep (Space to toggle, Enter to confirm):',
        options: unused.map((a) => ({
          value: a.relativePath,
          label: a.relativePath,
          hint: formatBytes(a.sizeBytes)
        })),
        initialValues: unused.map((a) => a.relativePath),
        required: false
      });

      if (p.isCancel(chosen) || chosen.length === 0) {
        p.cancel('Operation cancelled. No files were swept.');
        return;
      }

      const chosenSet = new Set(chosen as string[]);
      selectedAssets = unused.filter((a) => chosenSet.has(a.relativePath));
    }

    const result = await sweepAssets(rootDir, selectedAssets, config.useTrash);
    const actionLabel = config.useTrash ? 'Moved to .asset-sweep-trash/' : 'Permanently deleted';

    p.outro(
      `${pc.green('✔')} ${actionLabel} ${pc.bold(String(result.deletedCount))} file(s) — saved ${pc.bold(
        pc.cyan(formatBytes(result.freedBytes))
      )}!`
    );
  });

cli
  .command('restore [root]', 'Restore assets moved to .asset-sweep-trash')
  .action(async (root = '.') => {
    const rootDir = path.resolve(process.cwd(), root);
    try {
      const count = await restoreFromTrash(rootDir);
      p.outro(pc.green(`Restored ${count} asset(s) to their original locations.`));
    } catch {
      p.outro(pc.red('No .asset-sweep-trash manifest found to restore.'));
    }
  });

cli.help();
cli.version('0.1.0');
cli.parse();
