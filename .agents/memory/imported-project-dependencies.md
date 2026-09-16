---
name: Imported project dependency installation
description: Package-manager choice for this imported TanStack/Lovable project.
---

The Bun lockfile is the reproducible install source for this imported project; the npm lockfile can be stale relative to package.json and may reject npm ci.

**Why:** The imported package.json and package-lock.json were out of sync, while bun install --frozen-lockfile installed the declared dependency graph successfully without changing dependency declarations.

**How to apply:** Prefer the checked-in Bun lockfile for local dependency installation and validation unless the dependency files are intentionally reconciled.