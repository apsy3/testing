#!/usr/bin/env node
/**
 * Placeholder for the Yarn 4.4.1 standalone build.
 *
 * The execution environment that generated this commit does not permit
 * downloading external binaries, so this file intentionally exits with an
 * instructional message. Replace its contents with the official
 * `yarn-4.4.1.cjs` from the Yarn release archive before running any Yarn
 * commands. See `docs/offline-setup.md` for step-by-step guidance on
 * obtaining the vendored binary and populating the offline cache.
 */
console.error(
  "Vendored Yarn is missing. Run 'node tools/scripts/ensure-yarn.mjs' on a machine " +
    "with network access to download the official yarn-4.4.1.cjs release, then commit " +
    "the resulting file and offline cache as documented in docs/offline-setup.md."
);
process.exit(1);
