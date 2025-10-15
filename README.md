# Luxury Heritage Web (Yarn v4 Offline, Node 20)

## Quick start
0. Vendored Yarn (first clone only):
   ```bash
   node tools/scripts/ensure-yarn.mjs
   ```
   The helper script will fetch the standalone Yarn 4.4.1 bundle when the
   binary is missing or a placeholder. It falls back to `curl` so proxy-aware
   environments work without extra configuration.
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
1. The install command automatically runs `node tools/scripts/ensure-yarn.mjs`, which fetches the official Yarn 4.4.1 standalone release when it is missing.
2. In the Vercel Project Settings → **Build & Development Settings**, override both commands:
   - Install Command → `node tools/scripts/ensure-yarn.mjs && bash tools/scripts/check-yarn.sh && node .yarn/releases/yarn-4.4.1.cjs install --immutable --immutable-cache`
   - Build Command → `node .yarn/releases/yarn-4.4.1.cjs run build`
3. Trigger a redeploy. If the build logs still show `npm ci`, the project-level settings were not updated—reapply the commands and redeploy.
4. For CLI-driven builds, pass the same overrides explicitly:
   ```bash
   vercel build \
     --install-command "node tools/scripts/ensure-yarn.mjs && bash tools/scripts/check-yarn.sh && node .yarn/releases/yarn-4.4.1.cjs install --immutable --immutable-cache" \
     --build-command "node .yarn/releases/yarn-4.4.1.cjs run build"
   ```

## Tooling guard
Local, CI, and Vercel installs execute `tools/scripts/check-yarn.sh` before resolving dependencies. The guard now attempts to
run `node tools/scripts/ensure-yarn.mjs` automatically when the vendored
binary is missing or too small, then re-validates that
`.yarn/releases/yarn-4.4.1.cjs` is at least 1 MB. Replace the binary with the
official Yarn release if the guard still fails after the helper runs.
