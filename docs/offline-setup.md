# Offline Yarn Setup

## One-time offline cache warm-up
1. Activate Node 20:
   ```bash
   nvm use 20
   ```
2. Ensure the vendored Yarn CLI is present (skip if already committed):
   ```bash
   node .yarn/releases/yarn-4.4.1.cjs set version stable
   ```
3. Configure the workspace defaults:
   ```bash
   node .yarn/releases/yarn-4.4.1.cjs config set nodeLinker node-modules
   node .yarn/releases/yarn-4.4.1.cjs config set enableGlobalCache false
   ```
4. (Optional) Set a registry mirror if npmjs.org is unreachable:
   ```bash
   node .yarn/releases/yarn-4.4.1.cjs config set npmRegistryServer https://registry.npmmirror.com
   ```
5. Hydrate the offline cache (requires internet access):
   ```bash
   node .yarn/releases/yarn-4.4.1.cjs install
   ```
6. Commit the vendored runtime and cache so subsequent installs stay offline:
   ```bash
   git add .yarn/releases .yarn/cache
   git commit -m "chore: update yarn offline cache"
   ```

> **Note:** The automated environment used for these changes cannot download the
> official Yarn binary or package tarballs. Replace the placeholder
> `.yarn/releases/yarn-4.4.1.cjs` with the authentic release (the guard script
> checks that the binary is at least 1 MB) and run the steps above on a
> connected machine before relying on offline installs.

## Vercel project settings
Set the project-level Install Command to `node .yarn/releases/yarn-4.4.1.cjs install --immutable --immutable-cache` and the Build
Command to `node .yarn/releases/yarn-4.4.1.cjs run build`. Vercel must be
reconfigured through the dashboard—if deploy logs still show `npm ci`, the
custom commands were not saved.
