# Blog Admin

A self-hosted CMS for [juneyoung.io](https://juneyoung.io). Manages MDX content in the blog repo ([stevejkang/blog](https://github.com/stevejkang/blog)) via GitHub API.

## How It Works

```mermaid
graph LR
    A[Blog Admin] -->|Git Trees API| B[GitHub - blog repo]
    B -->|push to main| C[Vercel Build]
    C --> D[juneyoung.io]
```

Content changes (MDX + images) are committed atomically in a single commit. Push to `main` triggers Vercel auto-deploy.

## Publish Modes

```mermaid
graph TD
    E[Save] --> F{Mode?}
    F -->|Branch + PR| G[Create branch]
    G --> H[Commit to branch]
    H --> I[Open PR]
    I --> J[Vercel Preview]
    J --> K[Merge → Deploy]
    F -->|Direct| L[Commit to main]
    L --> M[Deploy]
```

Editing a post with an existing PR **amends** the commit (force push) — PR always stays at one commit.

## Setup

```bash
pnpm install
cp .env.example .env.local
```

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `AUTH_SECRET` | Session encryption key | `npx auth secret` |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | [Developer Settings](https://github.com/settings/developers) → OAuth Apps |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | Same as above |
| `GITHUB_TOKEN` | Fine-grained PAT (Contents + PRs RW) | [Tokens](https://github.com/settings/tokens) → select `blog` repo |

OAuth callback URL: `http://localhost:3000/api/auth/callback/github`

```bash
pnpm dev
```
