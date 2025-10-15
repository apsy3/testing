# Luxury Heritage Web (Yarn v4 Offline, Node 20)

## Quick start
1. Node 20:
   ```bash
   nvm use 20
   ```
2. Install (offline-safe):
   ```bash
   node .yarn/releases/yarn-4.4.1.cjs install --immutable --immutable-cache
   ```
3. Env:
   ```bash
   cp .env.example .env.local
   ```
4. Dev:
   ```bash
   yarn -w apps/web dev
   ```

## Maintainers: one-time cache warm-up
If `.yarn/cache/` is empty (fresh repo), run once **on a machine with internet**:
```bash
node .yarn/releases/yarn-4.4.1.cjs install
git add .yarn/cache
git commit -m "chore: update yarn offline cache"
```

## Vercel deployment checklist
1. Ensure the vendored Yarn binary is the official `yarn-4.4.1.cjs` release (the guard script rejects placeholders).
2. In the Vercel Project Settings → **Build & Development Settings**, override both commands:
   - Install Command → `node .yarn/releases/yarn-4.4.1.cjs install --immutable --immutable-cache`
   - Build Command → `node .yarn/releases/yarn-4.4.1.cjs run build`
3. Trigger a redeploy. If the build logs still show `npm ci`, the project-level settings were not updated—reapply the commands and redeploy.

## Tooling guard
Local, CI, and Vercel installs execute `tools/scripts/check-yarn.sh` before resolving dependencies. The script verifies that `.yarn/releases/yarn-4.4.1.cjs` exists and is larger than 1 MB so that placeholder stubs are rejected. Replace the binary with the official Yarn release if the guard fails.
