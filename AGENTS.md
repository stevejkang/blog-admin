# AGENTS.md

This file provides guidance for AI agents (Claude Code, Codex, etc.) working in this repository.

---

## Work Cycle Rules

> These rules apply to **every work session** without exception.

### 1. Keep AGENTS.md and PRD.md Up to Date

If a conversation or mid-task decision causes a direction change significant enough to affect `AGENTS.md` or `PRD.md`, both files must be updated to reflect the latest state.

- **This MD update must be a separate, isolated commit** — never bundled with feature, fix, or refactor commits.
- PRD.md is the source of truth for product direction. AGENTS.md is the source of truth for implementation conventions.
- When in doubt whether a change is "significant enough": if it would cause a future agent to make a wrong decision, it is significant enough.

### 2. Mark TODO Items Complete

When all work in a task is done, any TODO-related markdown files (e.g., `TODO.md`) must have the completed items marked as done before closing the session.

- This update **may be included in the same commit** as the work it tracks.

### 3. Append to HISTORY.md

At the end of every task, append a brief entry to `HISTORY.md` under the current date. One line per completed task is enough — keep it concise.

```markdown
## 2026-03-12

- Add design system section to AGENTS.md
- Fix MySQL naming across AGENTS.md
```

- `HISTORY.md` is **gitignored** — it is a local-only file for agent session context. Do not commit it.
- If `HISTORY.md` does not exist yet, create it in the repository root.

### 4. Respect .gitignore

**Never `git add -f` or force-commit a gitignored file.** If a file is in `.gitignore`, it is excluded from version control by design. This applies to all files without exception — `HISTORY.md`, `.env`, build artifacts, etc.

### 5. Start Each Session by Reviewing Context

At the start of every session, or whenever recent work needs to be understood, read the following before taking any action:

- **TODO-related markdown files** (e.g., `TODO.md`) — identify pending or in-progress items
- **`HISTORY.md`** (recent entries) — understand what was completed last and what context carries over

This ensures continuity across sessions and prevents duplicating or contradicting prior work.

---

## Commit & PR Rules

### Commit Discipline

> These rules are critical. Agents must follow them strictly.

- **Keep commits small and focused** — each commit should represent one logical, completed unit of work. Do not batch unrelated changes.
- **Commit at the end of every small task** — as soon as a discrete task is done (e.g., add a use case, fix a bug, update a schema), commit immediately. Do not accumulate changes.
- **All commits must be signed** (`git commit -S`). Unsigned commits will not be accepted.
- **Single author per commit** — always commit under the configured repository author. Co-authored commits (`Co-authored-by:`) are not allowed except in explicitly agreed exceptional cases.

### Commit Messages

Use **GitHub style**: imperative mood, capitalize first word, no period at end.

```
Add user TOTP enrollment endpoint
Fix refresh token expiry validation
Update Zod schema for skill creation form
Remove unused Redis cache keys
```

- Keep subject line under 72 characters.
- Always add a body when possible (blank line after subject). Explain **why** the change was made, not just what. The more context, the better.

### Pull Requests

- **Merge strategy**: Rebase merge (no merge commits, no squash).
- Keep PRs focused — one concern per PR.
- PR title follows the same commit message style.
- Reference related issues in the PR description.
- All checks (lint, type-check, tests) must pass before merging.
