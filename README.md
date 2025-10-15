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
