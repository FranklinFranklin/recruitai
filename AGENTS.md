<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Memory & Mandatory Operating Rules

## 1. Explicit Permission Before Coding & Building
- **DO NOT write code, edit files, or execute builds** until the user explicitly gives permission (e.g. "start coding", "proceed", "fix it").
- Research, investigate, analyze, and present plans first. Always wait for user approval before making any code modifications.

## 2. Code Quality & Pre-Commit Verification
- Always double-check and verify code before requesting or generating commits:
  - Unit & Integration Tests: `npm run test:unit`
  - Playwright E2E Tests: `npx playwright test`
  - TypeScript Compilation: `npx tsc --noEmit`
- Always provide the ready-to-run git commit commands when code editing and verification are completed.

