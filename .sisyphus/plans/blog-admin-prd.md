# Blog Admin CMS — Product Requirements Document

## TL;DR

> **Quick Summary**: Build a single-user blog admin CMS (Next.js 15) that manages content in the `stevejkang/blog` Gatsby repo via GitHub API. Features a Notion-like MDX editor, Git-based publishing workflow (branch+PR or direct-to-main), and Vercel-like dark UI.
>
> **Deliverables**:
> - Full-stack Next.js 15 admin application with GitHub OAuth
> - Rich MDX editor with image management (drag-drop, clipboard paste)
> - Posts & Pages CRUD via GitHub Contents/Git Trees API
> - Dashboard with stats, recent activity, tag distribution
> - SEO preview (Google SERP + OG card)
> - Branch+PR publishing workflow with direct-to-main option
> - Vercel-like dark theme (#000/#0a0a0a) with shadcn/ui
>
> **Estimated Effort**: XL (multi-week, 30+ tasks)
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Project scaffolding → Auth + GitHub client → Content API → Editor integration → Dashboard + Polish

---

## Context

### Original Request
Build a blog admin CMS from scratch in the empty `stevejkang/blog-admin` repository that manages content in the existing `stevejkang/blog` Gatsby site via GitHub API.

### Interview Summary
**Key Discussions**:
- Architecture: Backend + GitHub API chosen over direct Git or headless CMS for simplicity and Vercel auto-deploy compatibility
- Single-user with GitHub OAuth (NextAuth v5) — no multi-user, no role-based access
- Rich editor (@mdxeditor/editor) chosen for native MDX support over plain textarea or ProseMirror
- Branch+PR as default publish flow for preview capability; direct-to-main as power-user option
- shadcn/ui + Vercel-like dark theme for consistent, minimal admin UI

**Research Findings**:
- Blog repo has 7 posts following `YYMMDD-category-slug/index.mdx` pattern with co-located images
- @mdxeditor/editor requires `dynamic(() => import(...), { ssr: false })` for Next.js compatibility
- NextAuth v5 supports single-user restriction via `signIn` callback checking `profile.login`
- Git Trees API enables atomic multi-file commits (MDX + images in one commit)
- shadcn/ui v4 uses oklch colors in CSS variables, sidebar component has `variant="inset"` for dashboard layouts
- TanStack Query supports SSR prefetching via `HydrationBoundary` pattern

### Self-Conducted Gap Analysis (Metis timeout — performed manually)
**Identified Gaps** (addressed):
- Error handling for GitHub API failures → Defined retry strategy with exponential backoff
- Image size limits → Set 5MB per image, validated client-side before upload
- Concurrent edit safety → Single-user, but added optimistic locking via SHA comparison
- Draft post workflow → Drafts stay as unsaved editor state or branch-based
- Frontmatter validation → Zod schema validation before Git commit

---

## Work Objectives

### Core Objective
Build a production-ready, single-user blog admin CMS that provides a seamless content management experience for the existing Gatsby blog, with Git-based publishing and rich MDX editing.

### Concrete Deliverables
- Deployable Next.js 15 application at `blog-admin` repo
- GitHub OAuth authentication (single-user: `stevejkang`)
- Posts CRUD with rich MDX editor + image management
- Pages CRUD with simplified editor
- Dashboard with content statistics
- Tag management view
- SEO preview panel
- Branch+PR and direct-to-main publishing modes

### Definition of Done
- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm test` passes all tests (unit + integration)
- [ ] `pnpm lint` passes with zero warnings
- [ ] All CRUD operations work end-to-end against `stevejkang/blog` repo
- [ ] Authentication restricts access to `stevejkang` GitHub user only
- [ ] Branch+PR workflow creates valid PR with Vercel preview
- [ ] Direct-to-main triggers Vercel production deploy
- [ ] All pages render correctly in dark theme
- [ ] Lighthouse accessibility score ≥ 90

### Must Have
- GitHub OAuth with single-user restriction
- Posts CRUD (list, create, edit, delete) with full frontmatter support
- Pages CRUD (list, create, edit, delete)
- Rich MDX editor with image upload
- Git Trees API atomic commits (MDX + images in one commit)
- Branch+PR publishing workflow
- Direct-to-main publishing option
- Dashboard with post count, recent activity, tag distribution
- SEO preview (Google SERP mock, OG card preview)
- Vercel-like dark theme
- Sidebar navigation
- Responsive design (desktop-first, mobile-functional)

### Must NOT Have (Guardrails)
- Multi-user support or role-based access control
- Comments management (Giscus is managed separately)
- Analytics integration or Google Analytics dashboard
- Content scheduling or timed publishing
- Blog theme customization or Gatsby config editing
- Full blog preview/rendering (Vercel Preview handles this)
- Modification of non-content files in the blog repo
- Database or persistent server-side storage (Git is the source of truth)
- Internationalization (i18n)
- Email notifications
- AI-assisted writing features
- Custom domain management

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **Automated tests**: YES (TDD — Red-Green-Refactor)
- **Framework**: Vitest + React Testing Library + Playwright (E2E)
- **Coverage target**: ≥80% for utility functions, API routes, and hooks
- **Each task follows**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Bash (vitest) — Import, test, compare output

---

<!-- PRD_SECTIONS_START -->

# PRD: Detailed Specifications

---

## 1. Overview

### 1.1 Project Background

The blog at `juneyoung.io` is a personal technical blog built with Gatsby v5 and `@lekoarts/gatsby-theme-minimal-blog` (v6.2.6). Content is managed as MDX files in the `stevejkang/blog` GitHub repository. Deployment is automatic via Vercel — any push to `main` triggers a build and deploy.

Currently, content management requires direct Git operations: creating directories, writing MDX files with correct frontmatter, committing, and pushing. This workflow is error-prone (typos in frontmatter, incorrect directory naming) and lacks a visual editing experience.

### 1.2 Project Goal

Build **Blog Admin** — a web-based CMS that provides:
1. A visual, Notion-like editing experience for MDX content
2. Automated Git operations (commit, branch, PR) via GitHub API
3. Content validation (frontmatter schema, directory naming)
4. Publishing workflow with preview capability (Vercel Preview via PR)
5. Dashboard for content overview and management

### 1.3 Goals vs Non-Goals

| Goals | Non-Goals |
|-------|-----------|
| Single-user content management | Multi-user collaboration |
| Posts and Pages CRUD | Comments or analytics management |
| Rich MDX editing | Full Gatsby theme configuration |
| GitHub-based publishing | Database-backed content storage |
| SEO metadata management | Automated SEO optimization |
| Image upload (co-located) | External CDN or image optimization service |
| Tag management | Category taxonomy or hierarchies |
| Branch+PR workflow | Git conflict resolution UI |

### 1.4 Target User

Single user: the blog owner (`stevejkang`). No other users will access the system. Authentication serves as a security gate, not a user management feature.

### 1.5 Key Repositories

| Repository | Purpose | URL |
|-----------|---------|-----|
| `stevejkang/blog` | Gatsby blog (content source) | `https://github.com/stevejkang/blog` |
| `stevejkang/blog-admin` | Admin CMS (this project) | `https://github.com/stevejkang/blog-admin` |
| `stevejkang/juneyoung-io-comments` | Giscus comments | (out of scope) |

---

## 2. User & Authentication

### 2.1 Authentication Provider

**NextAuth.js v5 (Auth.js)** with GitHub OAuth Provider.

```
Install: pnpm add next-auth@beta
```

### 2.2 Environment Variables

```env
# Auth
AUTH_SECRET=<generated-via-npx-auth-secret>
AUTH_GITHUB_ID=<github-oauth-app-client-id>
AUTH_GITHUB_SECRET=<github-oauth-app-client-secret>

# GitHub API (for content operations — separate from OAuth)
GITHUB_TOKEN=<personal-access-token-with-repo-scope>
GITHUB_OWNER=stevejkang
GITHUB_REPO=blog
GITHUB_BRANCH=main

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

> **IMPORTANT**: Two separate GitHub credentials:
> 1. **OAuth App** (AUTH_GITHUB_ID/SECRET): For user authentication flow
> 2. **Personal Access Token** (GITHUB_TOKEN): For content operations via Octokit (needs `repo` scope)

### 2.3 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User visits any page                                           │
│  ↓                                                              │
│  middleware.ts checks session                                   │
│  ↓                                                              │
│  No session? → Redirect to /login                               │
│  ↓                                                              │
│  /login page shows "Sign in with GitHub" button                 │
│  ↓                                                              │
│  User clicks → GitHub OAuth consent screen                      │
│  ↓                                                              │
│  GitHub redirects to /api/auth/callback/github                  │
│  ↓                                                              │
│  signIn callback checks: profile.login === "stevejkang"?        │
│  ↓                                                              │
│  NO → Return false (access denied, redirect to error page)      │
│  YES → Create JWT session, redirect to /                        │
│  ↓                                                              │
│  User is authenticated, can access all dashboard routes          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Auth Configuration (`src/auth.ts`)

```typescript
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

const ALLOWED_USERS = ["stevejkang"]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ profile }) {
      return ALLOWED_USERS.includes(profile?.login as string)
    },
    async session({ session, token }) {
      // Attach GitHub username to session for display
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect auth errors to login page
  },
})
```

### 2.5 Route Protection (`middleware.ts`)

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    // Protect everything except login, API auth routes, and static assets
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

### 2.6 Session Management

- **Strategy**: JWT (no database required)
- **Token lifetime**: 30 days
- **Refresh**: Automatic via NextAuth session management
- **Logout**: Explicit sign-out via NextAuth `signOut()` + cookie removal
- **Session access (server)**: `const session = await auth()`
- **Session access (client)**: `useSession()` from `next-auth/react`

### 2.7 Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Unauthorized access | Single-user allowlist in `signIn` callback |
| CSRF | NextAuth built-in CSRF protection |
| Token leakage | JWT stored in httpOnly cookie, not localStorage |
| GitHub token exposure | `GITHUB_TOKEN` server-side only, never sent to client |
| OAuth app security | Separate OAuth apps for dev/prod environments |
| Session hijacking | Secure cookie flags (`secure`, `httpOnly`, `sameSite`) |
| API route protection | All `/api/*` routes (except `/api/auth/*`) check session |

### 2.8 GitHub OAuth App Setup

**Development:**
- Application name: `Blog Admin (Dev)`
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

**Production:**
- Application name: `Blog Admin`
- Homepage URL: `https://<vercel-domain>`
- Authorization callback URL: `https://<vercel-domain>/api/auth/callback/github`

> Create at: https://github.com/settings/applications/new

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│                  │     │    Blog Admin (Next.js)   │     │                 │
│  Browser Client  │────▶│                          │────▶│  GitHub API     │
│  (React + TQ)    │◀────│  App Router + API Routes │◀────│  (Octokit)      │
│                  │     │                          │     │                 │
└─────────────────┘     └──────────┬───────────────┘     └────────┬────────┘
                                   │                              │
                                   │  NextAuth                    │  Git Trees API
                                   ▼                              ▼
                        ┌──────────────────┐          ┌──────────────────┐
                        │  GitHub OAuth    │          │  stevejkang/blog │
                        │  (Authentication)│          │  (Content Repo)  │
                        └──────────────────┘          └────────┬─────────┘
                                                               │
                                                               │  Push to main
                                                               ▼
                                                    ┌──────────────────┐
                                                    │  Vercel          │
                                                    │  (Auto-deploy)   │
                                                    │  → juneyoung.io  │
                                                    └──────────────────┘
```

### 3.2 Data Flow

```
READ FLOW:
  Browser → Next.js API Route → Octokit.repos.getContent() → GitHub API
  GitHub API returns: { content: base64, sha, path, name }
  API Route: decode base64 → parse frontmatter (gray-matter) → return JSON
  Browser: TanStack Query caches response → render UI

WRITE FLOW (Direct to Main):
  Browser → POST /api/posts → validate body (Zod)
  API Route: generate frontmatter + MDX body → encode base64
  If images: create blobs via Git Blobs API
  Create tree via Git Trees API (MDX + images atomic)
  Create commit via Git Commits API
  Update ref via Git Refs API (heads/main)
  Return success → TanStack Query invalidates cache
  Vercel detects push → auto-deploy

WRITE FLOW (Branch + PR):
  Browser → POST /api/posts?mode=branch → validate body (Zod)
  API Route: create branch `content/{slug}` from main HEAD
  Create tree + commit on new branch (same as above)
  Create PR via Pulls API (head: content/{slug}, base: main)
  Return PR URL → show in UI
  User reviews Vercel Preview → merges PR (from admin or GitHub)
  Merge triggers Vercel production deploy
```

### 3.3 Project Directory Structure

```
blog-admin/
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Template for env vars
├── .gitignore
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind v4 (if needed beyond CSS)
├── tsconfig.json
├── vitest.config.ts                  # Test configuration
├── components.json                   # shadcn/ui configuration
├── package.json
├── pnpm-lock.yaml
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── globals.css               # Tailwind v4 + shadcn tokens + Vercel dark theme
│   │   ├── layout.tsx                # Root layout: ThemeProvider + QueryProvider + fonts
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx          # Login page with GitHub OAuth button
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Dashboard layout: SidebarProvider + AppSidebar
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx          # Posts list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create new post
│   │   │   │   └── [slug]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit existing post
│   │   │   ├── pages/
│   │   │   │   ├── page.tsx          # Pages list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create new page
│   │   │   │   └── [slug]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit existing page
│   │   │   └── tags/
│   │   │       └── page.tsx          # Tag management
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts      # NextAuth route handler
│   │       ├── posts/
│   │       │   ├── route.ts          # GET (list) + POST (create)
│   │       │   └── [slug]/
│   │       │       └── route.ts      # GET (read) + PUT (update) + DELETE
│   │       ├── pages/
│   │       │   ├── route.ts          # GET (list) + POST (create)
│   │       │   └── [slug]/
│   │       │       └── route.ts      # GET (read) + PUT (update) + DELETE
│   │       ├── tags/
│   │       │   └── route.ts          # GET (list with counts)
│   │       ├── images/
│   │       │   └── route.ts          # POST (upload to post directory)
│   │       └── publish/
│   │           └── route.ts          # POST (create PR or merge)
│   ├── auth.ts                       # NextAuth configuration
│   ├── middleware.ts                  # Route protection
│   ├── components/
│   │   ├── ui/                       # shadcn/ui auto-generated components
│   │   ├── app-sidebar.tsx           # Main sidebar navigation
│   │   ├── nav-main.tsx              # Navigation menu items
│   │   ├── theme-provider.tsx        # next-themes provider
│   │   ├── providers.tsx             # TanStack Query provider
│   │   ├── editor/
│   │   │   ├── mdx-editor.tsx        # Dynamic import wrapper for MDXEditor
│   │   │   ├── editor-toolbar.tsx    # Custom toolbar configuration
│   │   │   └── image-upload.ts       # Image upload handler for editor
│   │   ├── posts/
│   │   │   ├── post-form.tsx         # Post create/edit form
│   │   │   ├── posts-table.tsx       # Posts data table
│   │   │   ├── post-actions.tsx      # Row actions (edit, delete, view)
│   │   │   └── publish-dialog.tsx    # Publish mode selection dialog
│   │   ├── pages/
│   │   │   ├── page-form.tsx         # Page create/edit form
│   │   │   └── pages-table.tsx       # Pages data table
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx       # Post count, tag count, etc.
│   │   │   ├── recent-posts.tsx      # Recent activity list
│   │   │   ├── tag-distribution.tsx  # Tag usage chart/list
│   │   │   └── quick-actions.tsx     # Quick action buttons
│   │   ├── seo/
│   │   │   ├── seo-preview.tsx       # Google SERP + OG card preview
│   │   │   └── seo-fields.tsx        # SEO input fields
│   │   └── shared/
│   │       ├── confirm-dialog.tsx    # Reusable confirmation dialog
│   │       ├── loading-skeleton.tsx  # Page loading skeletons
│   │       └── error-boundary.tsx    # Error boundary component
│   ├── hooks/
│   │   ├── use-posts.ts             # Posts query + mutation hooks
│   │   ├── use-pages.ts             # Pages query + mutation hooks
│   │   ├── use-tags.ts              # Tags query hook
│   │   └── use-publish.ts           # Publish mutation hook
│   ├── lib/
│   │   ├── utils.ts                 # cn() helper + generic utilities
│   │   ├── query-client.ts          # TanStack Query client singleton
│   │   ├── query-keys.ts            # Centralized query key factory
│   │   ├── github/
│   │   │   ├── client.ts            # Octokit instance + throttling
│   │   │   ├── content.ts           # Read content (files, directories)
│   │   │   ├── commits.ts           # Git Trees API atomic commit logic
│   │   │   ├── branches.ts          # Branch creation + management
│   │   │   └── pull-requests.ts     # PR creation + status
│   │   ├── mdx/
│   │   │   ├── frontmatter.ts       # gray-matter parse/serialize
│   │   │   ├── schema.ts            # Zod schemas for frontmatter validation
│   │   │   └── slug.ts              # Slug and directory name generation
│   │   └── api/
│   │       ├── client.ts            # Client-side fetch wrapper
│   │       ├── posts.ts             # Client-side post API functions
│   │       └── pages.ts             # Client-side page API functions
│   └── types/
│       ├── index.ts                 # Shared TypeScript types
│       ├── post.ts                  # Post-related types
│       ├── page.ts                  # Page-related types
│       └── github.ts                # GitHub API response types
└── tests/
    ├── setup.ts                      # Vitest setup (mocks, matchers)
    ├── lib/
    │   ├── github/
    │   │   ├── content.test.ts
    │   │   ├── commits.test.ts
    │   │   └── branches.test.ts
    │   └── mdx/
    │       ├── frontmatter.test.ts
    │       ├── schema.test.ts
    │       └── slug.test.ts
    ├── api/
    │   ├── posts.test.ts
    │   └── pages.test.ts
    └── e2e/
        ├── auth.spec.ts
        ├── posts.spec.ts
        └── dashboard.spec.ts
```

### 3.4 API Route Structure

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/posts` | List all posts (frontmatter only) |
| POST | `/api/posts` | Create new post (MDX + optional images) |
| GET | `/api/posts/[slug]` | Get single post (frontmatter + body) |
| PUT | `/api/posts/[slug]` | Update post (frontmatter + body + images) |
| DELETE | `/api/posts/[slug]` | Delete post (entire directory) |
| GET | `/api/pages` | List all pages |
| POST | `/api/pages` | Create new page |
| GET | `/api/pages/[slug]` | Get single page |
| PUT | `/api/pages/[slug]` | Update page |
| DELETE | `/api/pages/[slug]` | Delete page |
| GET | `/api/tags` | List all tags with usage counts |
| POST | `/api/images` | Upload image to post directory |
| POST | `/api/publish` | Create PR or merge branch |

---

## 4. Feature Specifications

### 4.1 Dashboard

**Route**: `/(dashboard)/page.tsx`

#### 4.1.1 Stats Cards (Top Row)

Four stat cards displayed in a 4-column grid:

| Card | Label | Value Source | Description |
|------|-------|-------------|-------------|
| Total Posts | "Posts" | `GET /api/posts` → count | Total number of posts |
| Total Pages | "Pages" | `GET /api/pages` → count | Total number of pages |
| Total Tags | "Tags" | `GET /api/tags` → count | Unique tag count |
| Recent | "This Month" | `GET /api/posts` → filter by date | Posts created this month |

Each card shows: icon (Lucide), large number, label, and trend indicator (e.g., "+2 from last month").

#### 4.1.2 Recent Posts Widget

Displays the 5 most recently modified posts in a list:

```
┌────────────────────────────────────────────────────┐
│ Recent Posts                                        │
├────────────────────────────────────────────────────┤
│ ● Post Title Here                    2024-01-15    │
│   /category-slug-240115   3 tags     Edit →        │
│ ● Another Post Title                 2024-01-10    │
│   /another-slug-240110   2 tags      Edit →        │
│ ...                                                │
└────────────────────────────────────────────────────┘
```

Each row: title (link), date (monospace), slug (monospace, muted), tag count badge, edit link.

#### 4.1.3 Tag Distribution Widget

Shows all tags sorted by usage frequency:

```
┌────────────────────────────────────────────────────┐
│ Tag Distribution                                    │
├────────────────────────────────────────────────────┤
│ devops          ████████████████  4                 │
│ development     ████████████      3                 │
│ typescript      ████████          2                 │
│ error           ████████          2                 │
│ nestjs          ████              1                 │
│ ...                                                │
└────────────────────────────────────────────────────┘
```

Bar chart using simple CSS bars (no chart library needed). Each row: tag name, visual bar, count.

#### 4.1.4 Quick Actions Widget

Four large action buttons:

| Action | Icon | Route | Description |
|--------|------|-------|-------------|
| New Post | `Plus` | `/posts/new` | Navigate to post creation |
| New Page | `FilePlus` | `/pages/new` | Navigate to page creation |
| View Blog | `ExternalLink` | `https://juneyoung.io` | Open blog in new tab |
| View Repo | `Github` | `https://github.com/stevejkang/blog` | Open repo in new tab |

### 4.2 Posts CRUD

#### 4.2.1 Posts List (`/posts`)

**Data table** with columns:

| Column | Type | Sortable | Description |
|--------|------|----------|-------------|
| Title | text + link | Yes | Post title, links to edit page |
| Slug | monospace text | No | URL path (e.g., `/devops-slug-240115`) |
| Date | monospace date | Yes (default: desc) | Publication date `YYYY-MM-DD` |
| Tags | badge array | No | First 3 tags as badges, "+N" if more |
| Banner | icon indicator | No | Image icon if banner exists |
| Actions | dropdown | No | Edit, Delete, View on blog |

**Features**:
- Search: Filter by title (client-side, immediate)
- Sort: Click column header to sort (date desc by default)
- Empty state: Illustration + "No posts yet" + "Create your first post" button

#### 4.2.2 Create Post (`/posts/new`)

**Two-column layout**:

```
┌─────────────────────────────────────┬───────────────────────┐
│ Editor (left, 65% width)            │ Sidebar (right, 35%)  │
│                                     │                       │
│ ┌─────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ Title input (large)             │ │ │ Metadata          │ │
│ └─────────────────────────────────┘ │ │                   │ │
│ ┌─────────────────────────────────┐ │ │ Date: [date pick] │ │
│ │ MDX Editor                      │ │ │ Category: [input] │ │
│ │ [toolbar: B I U | H1 H2 H3 |   │ │ │ Slug: [auto-gen]  │ │
│ │  list | link img table code |   │ │ │ Tags: [multi-sel] │ │
│ │  --- | ↩ ↪ | source]           │ │ │                   │ │
│ │                                 │ │ │ ┌───────────────┐ │ │
│ │ (Rich MDX editing area)         │ │ │ │ Banner Image  │ │ │
│ │                                 │ │ │ │ [drop zone]   │ │ │
│ │                                 │ │ │ └───────────────┘ │ │
│ │                                 │ │ │                   │ │
│ └─────────────────────────────────┘ │ │ ┌───────────────┐ │ │
│                                     │ │ │ SEO Preview   │ │ │
│                                     │ │ │ [SERP mock]   │ │ │
│                                     │ │ │ [OG card]     │ │ │
│                                     │ │ └───────────────┘ │ │
│                                     │ │                   │ │
│                                     │ │ [Publish ▼]       │ │
│                                     │ │ [Save Draft]      │ │
│                                     │ └───────────────────┘ │
└─────────────────────────────────────┴───────────────────────┘
```

**Field Specifications**:

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| title | text input | Yes | empty | min 1 char, max 200 chars |
| description | textarea | Yes | empty | min 1 char, max 300 chars |
| date | date picker | Yes | today | valid YYYY-MM-DD |
| category | text input | Yes | empty | lowercase, alphanumeric + hyphens |
| slug | text input (auto-generated) | Yes | auto from category+date | starts with `/`, URL-safe |
| tags | multi-select/tag input | Yes | empty | at least 1 tag |
| banner | file upload (drag/drop) | No | none | .png/.jpg/.webp, max 5MB |
| canonicalUrl | text input | No | empty | valid URL or empty |
| defer | checkbox | No | false | boolean |
| body | MDX editor | Yes | empty | valid MDX |

**Auto-generation rules**:
- Directory name: `{YYMMDD}-{category}-{slug-words}` (from date + category + title)
- Slug: `/{category}-{slug-words}-{YYMMDD}` (from category + title + date)
- Both update live as user types title/date/category

**Publish Flow**:
1. User clicks "Publish" dropdown
2. Dialog shows two options:
   - **Create PR** (default): Creates branch `content/{slug}`, commits, creates PR
   - **Publish Now**: Commits directly to `main`
3. On success: toast notification + redirect to posts list
4. On error: toast with error message, form stays open

#### 4.2.3 Edit Post (`/posts/[slug]/edit`)

Same layout as Create, but:
- Fields pre-populated from GitHub content
- Title input pre-filled
- MDX editor loaded with existing markdown
- Banner preview if exists
- "Update" button instead of "Publish"
- Additional "Delete" button (with confirmation dialog)
- SHA tracking for optimistic locking (prevents overwriting concurrent changes)

**Load flow**:
1. `GET /api/posts/[slug]` → returns frontmatter + body + sha
2. Parse frontmatter → populate sidebar fields
3. Load body into MDX editor
4. Store `sha` for update request

**Update flow**:
1. Gather form data + editor markdown
2. `PUT /api/posts/[slug]` with `{ frontmatter, body, sha, images?, mode }`
3. If `sha` mismatch (409 Conflict) → show "Content was modified externally" warning
4. On success → toast + invalidate query cache

#### 4.2.4 Delete Post

1. User clicks "Delete" in post actions or edit page
2. Confirmation dialog: "Delete '{title}'? This will remove the post and all associated images. This action cannot be undone."
3. `DELETE /api/posts/[slug]`
4. API deletes entire post directory via Git Trees API (set tree entries to `null` sha)
5. On success → toast + redirect to posts list + invalidate cache

### 4.3 Pages CRUD

Simplified version of Posts CRUD.

#### 4.3.1 Pages List (`/pages`)

Same data table pattern as posts, but fewer columns:

| Column | Type | Description |
|--------|------|-------------|
| Title | text + link | Page title, links to edit |
| Slug | monospace | URL path (e.g., `/about`) |
| Actions | dropdown | Edit, Delete, View |

#### 4.3.2 Create Page (`/pages/new`)

Simplified single-column layout (no sidebar needed — minimal frontmatter):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | text input | Yes | min 1 char |
| slug | text input | Yes | starts with `/`, URL-safe |
| body | MDX editor | Yes | valid MDX |

Directory structure: `content/pages/{name}/index.mdx`
- `{name}` derived from slug (e.g., slug `/about` → directory `about`)

#### 4.3.3 Edit Page / Delete Page

Same patterns as Post edit/delete, but with simplified frontmatter.

### 4.4 MDX Editor

#### 4.4.1 Editor Integration

**Library**: `@mdxeditor/editor` — native MDX support, Lexical-based.

**Critical**: Must use `next/dynamic` with `{ ssr: false }` — editor is client-only.

**Two-file pattern**:
1. `src/components/editor/initialized-editor.tsx` — `'use client'`, imports all plugins
2. `src/components/editor/mdx-editor.tsx` — `dynamic(() => import(...), { ssr: false })` wrapper

#### 4.4.2 Supported Editor Features

| Feature | Plugin | Toolbar Component |
|---------|--------|-------------------|
| Bold, Italic, Underline | (core) | `BoldItalicUnderlineToggles` |
| Inline code | (core) | `CodeToggle` |
| Headings (H1-H6) | `headingsPlugin()` | `BlockTypeSelect` |
| Bulleted/Numbered lists | `listsPlugin()` | `ListsToggle` |
| Links | `linkPlugin()` + `linkDialogPlugin()` | `CreateLink` |
| Images | `imagePlugin()` | `InsertImage` |
| Tables | `tablePlugin()` | `InsertTable` |
| Code blocks (fenced) | `codeBlockPlugin()` | `InsertCodeBlock` |
| Horizontal rule | `thematicBreakPlugin()` | `InsertThematicBreak` |
| Block quotes | `quotePlugin()` | (via BlockTypeSelect) |
| Markdown shortcuts | `markdownShortcutPlugin()` | (keyboard-driven) |
| Undo/Redo | (core) | `UndoRedo` |
| Source/Rich toggle | `diffSourcePlugin()` | `DiffSourceToggleWrapper` |

#### 4.4.3 Toolbar Layout

```
[Undo Redo] | [B I U Code] | [H1▾] | [• 1.] | [🔗 🖼 📊 <> ─] | [Rich ◉ Source]
```

The `DiffSourceToggleWrapper` enables switching between rich text and raw markdown source view.

#### 4.4.4 Image Upload Handler

When a user inserts an image (toolbar, paste, or drag-drop):

1. Client creates `FormData` with the image file
2. `POST /api/images` with `{ file, postSlug }` (multipart/form-data)
3. API validates: file type (.png, .jpg, .jpeg, .webp), size (≤ 5MB)
4. API generates filename: `image-{timestamp}.{ext}`
5. Returns `{ url: "./image-{timestamp}.png" }` (relative path for MDX)
6. Editor inserts `![alt](./image-{timestamp}.png)` at cursor

> **Note**: Images are stored temporarily in memory/buffer during editing. They are committed to Git only when the post is published/saved. The relative path `./` works because images are co-located with `index.mdx`.

#### 4.4.5 MDX Serialization Rules

**Editor → Git**:
1. `editorRef.current.getMarkdown()` → raw MDX string
2. Prepend YAML frontmatter block (generated from form fields)
3. Result: complete `index.mdx` file content

**Git → Editor**:
1. `gray-matter(fileContent)` → `{ data: frontmatter, content: body }`
2. `data` populates form fields (title, date, tags, etc.)
3. `content` (body without frontmatter) → `<MDXEditor markdown={content} />`

### 4.5 Tag Management

**Route**: `/(dashboard)/tags/page.tsx`

#### 4.5.1 Tag Aggregation

Tags are NOT stored separately — they are extracted by scanning all post frontmatter:

```
GET /api/tags → 
  for each post in content/posts/*/index.mdx:
    parse frontmatter → extract tags[]
  aggregate: { tag: string, count: number, posts: string[] }
  sort by count descending
```

#### 4.5.2 Tag Management UI

```
┌──────────────────────────────────────────────────────────┐
│ Tags                                          Total: 21  │
├──────────────────────────────────────────────────────────┤
│ Search tags...                                           │
├──────────────────────────────────────────────────────────┤
│ Tag              Posts    Last Used                       │
│ devops           4        2022-11-23                     │
│ development      3        2022-03-20                     │
│ typescript       2        2022-03-20                     │
│ github-actions   2        2022-11-23                     │
│ error            2        2023-03-21                     │
│ nestjs           2        2022-03-20                     │
│ backend          1        2022-02-28     ⚠ low usage     │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Search: Filter tags by name (client-side)
- Sort: By usage count or alphabetical
- Low usage indicator: Tags used only once shown with warning icon
- Click tag → Shows list of posts using that tag (expandable row or modal)
- No direct tag editing (tags are managed through post frontmatter)

### 4.6 SEO Preview

Integrated into the Post/Page create/edit forms (right sidebar).

#### 4.6.1 Google SERP Preview

```
┌──────────────────────────────────────────────┐
│ Google Search Preview                         │
├──────────────────────────────────────────────┤
│ juneyoung.io › category-slug-240115          │
│ Post Title Here - Up to 60 Characters        │
│ Description text here, truncated at about    │
│ 155-160 characters for optimal display...    │
└──────────────────────────────────────────────┘
```

**Rendering rules**:
- **URL**: `juneyoung.io` + slug
- **Title**: Truncated at 60 chars, color indicator (green < 60, yellow 60-70, red > 70)
- **Description**: Truncated at 160 chars, color indicator (green < 155, yellow 155-160, red > 160)
- Updates live as user types

#### 4.6.2 OG Card Preview

```
┌──────────────────────────────────────────────┐
│ Open Graph Preview                            │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ [Banner image preview or placeholder]    │ │
│ │                                          │ │
│ ├──────────────────────────────────────────┤ │
│ │ juneyoung.io                             │ │
│ │ Post Title Here                          │ │
│ │ Description text preview...              │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Rendering rules**:
- Card format: Summary with large image (Twitter-style)
- Image: Banner image if uploaded, otherwise gray placeholder
- Title: Full title
- Description: First 200 chars of description field
- Site name: `juneyoung.io`

### 4.7 Image Management

#### 4.7.1 Banner Image Upload

**Location**: Post form sidebar, dedicated drop zone.

**Upload flow**:
1. User drags image or clicks to browse (or pastes from clipboard)
2. Client validates: type (.png, .jpg, .jpeg, .webp), size (≤ 5MB)
3. Preview thumbnail shown immediately (local blob URL)
4. Image stored in component state until publish
5. On publish: included in Git Trees API commit as `article-banner.png`

#### 4.7.2 Inline Image Upload (within editor)

**Location**: MDX editor content area.

**Upload flow**:
1. User inserts image via toolbar, paste, or drag-drop
2. `imageUploadHandler` in editor config triggers
3. Image stored in component state with generated name: `image-{index}.{ext}`
4. Editor displays local preview (blob URL)
5. MDX reference: `![alt](./image-{index}.{ext})`
6. On publish: all accumulated images included in Git commit

#### 4.7.3 Image Deletion

**Banner**: Click "Remove" button on banner preview → clears from state.
**Inline**: Delete the image markdown in editor → image removed from commit.
**Existing images on edit**: When updating a post, if an image reference is removed from the MDX body, the image file is also removed from the Git tree.

#### 4.7.4 Image Constraints

| Constraint | Value |
|-----------|-------|
| Max file size | 5 MB |
| Allowed types | `.png`, `.jpg`, `.jpeg`, `.webp` |
| Banner filename | `article-banner.{ext}` (always) |
| Inline filename | `image-{N}.{ext}` (auto-generated) |
| Max images per post | 20 (soft limit, UI warning) |

---

## 5. GitOps Pipeline

### 5.1 Content Repository Details

| Property | Value |
|----------|-------|
| Owner | `stevejkang` |
| Repo | `blog` |
| Default branch | `main` |
| Content path | `content/posts/` and `content/pages/` |
| Deploy trigger | Push to `main` → Vercel auto-build |
| Preview trigger | PR created → Vercel Preview deployment |

### 5.2 Directory Naming Convention

**Posts**:
```
content/posts/{YYMMDD}-{category}-{slug-words}/
  index.mdx
  article-banner.png    (optional)
  image-1.png           (optional)
  image-N.png           (optional)
```

- `{YYMMDD}`: 2-digit year, 2-digit month, 2-digit day from post date
- `{category}`: lowercase category (e.g., `devops`, `development`, `error`)
- `{slug-words}`: kebab-case from title (e.g., `better-way-to-handle-env`)

**Example**: Date `2024-01-15`, category `devops`, title "Better Way to Handle Env"
→ Directory: `240115-devops-better-way-to-handle-env`

**Pages**:
```
content/pages/{name}/
  index.mdx
```
- `{name}`: derived from slug (e.g., slug `/about` → name `about`)

### 5.3 Frontmatter Generation

**Post frontmatter template**:
```yaml
---
title: "{title}"
description: "{description}"
date: {YYYY-MM-DD}
slug: "/{category}-{slug-words}-{YYMMDD}"
tags:
  - {tag1}
  - {tag2}
banner: ./article-banner.png    # only if banner exists
canonicalUrl: "{url}"            # only if provided
defer: true                      # only if enabled
---
```

**Page frontmatter template**:
```yaml
---
title: {title}
slug: "{slug}"
---
```

### 5.4 Commit Convention

```
content(post): add "{title}"       # New post
content(post): update "{title}"    # Updated post
content(post): remove "{title}"    # Deleted post
content(page): add "{title}"       # New page
content(page): update "{title}"    # Updated page
content(page): remove "{title}"    # Deleted page
content(image): add banner for "{post-title}"  # Banner upload separate from post
```

### 5.5 Publishing Mode: Direct to Main

```
Step 1: Get current main HEAD
  GET /repos/{owner}/{repo}/git/ref/heads/main
  → latestCommitSha

Step 2: Get current tree
  GET /repos/{owner}/{repo}/git/commits/{latestCommitSha}
  → baseTreeSha

Step 3: Create blobs for images (if any)
  POST /repos/{owner}/{repo}/git/blobs
  { content: base64EncodedImage, encoding: "base64" }
  → blobSha (for each image)

Step 4: Create new tree (atomic: MDX + all images)
  POST /repos/{owner}/{repo}/git/trees
  {
    base_tree: baseTreeSha,    // CRITICAL: preserves all existing files
    tree: [
      { path: "content/posts/{dir}/index.mdx", mode: "100644", type: "blob", content: mdxContent },
      { path: "content/posts/{dir}/article-banner.png", mode: "100644", type: "blob", sha: blobSha },
      // ... additional images
    ]
  }
  → newTreeSha

Step 5: Create commit
  POST /repos/{owner}/{repo}/git/commits
  {
    message: 'content(post): add "{title}"',
    tree: newTreeSha,
    parents: [latestCommitSha]
  }
  → newCommitSha

Step 6: Update main ref
  PATCH /repos/{owner}/{repo}/git/refs/heads/main
  { sha: newCommitSha }
  → Done. Vercel triggers deploy.
```

### 5.6 Publishing Mode: Branch + PR

```
Steps 1-2: Same as direct (get main HEAD + tree)

Step 3: Create new branch
  POST /repos/{owner}/{repo}/git/refs
  {
    ref: "refs/heads/content/{slug}",
    sha: latestCommitSha      // Branch from current main
  }

Steps 4-5: Same as direct (create tree + commit)

Step 6: Update BRANCH ref (not main)
  PATCH /repos/{owner}/{repo}/git/refs/heads/content/{slug}
  { sha: newCommitSha }

Step 7: Create Pull Request
  POST /repos/{owner}/{repo}/pulls
  {
    title: 'content(post): add "{title}"',
    body: "## New Post\n\n- **Title**: {title}\n- **Category**: {category}\n- **Tags**: {tags}\n\n---\n_Created via Blog Admin_",
    head: "content/{slug}",
    base: "main"
  }
  → prUrl, prNumber

Return PR URL to client for Vercel Preview link.
```

### 5.7 Delete Flow (Git Trees API)

To delete an entire post directory:

```
Step 1-2: Get main HEAD + tree (same as above)

Step 3: Create tree with null SHAs for all files in directory
  POST /repos/{owner}/{repo}/git/trees
  {
    base_tree: baseTreeSha,
    tree: [
      { path: "content/posts/{dir}/index.mdx", mode: "100644", type: "blob", sha: null },
      { path: "content/posts/{dir}/article-banner.png", mode: "100644", type: "blob", sha: null },
      // ... all files in directory
    ]
  }

Steps 4-5: Create commit + update ref (same pattern)
```

> **Note**: Must list ALL files in the directory for deletion. Use Contents API to list directory contents first.

### 5.8 Update Flow (SHA-based Optimistic Locking)

When loading a post for editing, store the file's `sha`. On update:

1. Read current file SHA from GitHub
2. Compare with stored SHA
3. If match → proceed with update
4. If mismatch → show "Content was modified externally. Reload and merge changes." error (409 Conflict from API)

### 5.9 Branch Naming Convention

```
content/{slug-without-leading-slash}
```

Example: Post with slug `/devops-new-post-240115` → branch `content/devops-new-post-240115`

### 5.10 Rate Limit Handling

| Operation | API Calls | Notes |
|-----------|----------|-------|
| List posts | 1 (directory) + N (file contents) | Cacheable |
| Read post | 1-2 (file + directory for images) | Cacheable |
| Create post | 4-6 (ref + tree + blobs + commit + ref update + PR) | Not cacheable |
| Update post | 4-6 (same as create) | Not cacheable |
| Delete post | 3-5 (list dir + ref + tree + commit + ref update) | Not cacheable |

**GitHub rate limit**: 5,000 requests/hour (authenticated).

**Mitigation**:
- Use `@octokit/plugin-throttling` for automatic rate limit handling
- Cache directory listings client-side (TanStack Query, 1min staleTime)
- Batch read operations where possible (list post frontmatter without full body)

---

## 6. Data Models (TypeScript Interfaces)

### 6.1 Post Types

```typescript
// src/types/post.ts

/** Frontmatter fields for a blog post */
export interface PostFrontmatter {
  title: string
  description: string
  date: string                    // YYYY-MM-DD
  slug: string                    // e.g., "/devops-slug-240115"
  tags: string[]
  banner?: string                 // e.g., "./article-banner.png"
  canonicalUrl?: string
  defer?: boolean
}

/** Post as returned by the API (list view — no body) */
export interface PostListItem {
  frontmatter: PostFrontmatter
  directoryName: string           // e.g., "240115-devops-slug"
  directoryPath: string           // e.g., "content/posts/240115-devops-slug"
  sha: string                     // Git SHA of index.mdx
  hasBanner: boolean
  images: string[]                // List of co-located image filenames
}

/** Post as returned by the API (detail view — includes body) */
export interface PostDetail extends PostListItem {
  body: string                    // MDX body (without frontmatter)
  rawContent: string              // Full file content (frontmatter + body)
}

/** Input for creating a new post */
export interface CreatePostInput {
  frontmatter: PostFrontmatter
  body: string                    // MDX body
  images: ImageUpload[]           // Images to commit alongside MDX
  mode: PublishMode
}

/** Input for updating an existing post */
export interface UpdatePostInput {
  frontmatter: PostFrontmatter
  body: string
  sha: string                     // Required for optimistic locking
  images: ImageUpload[]           // New/changed images
  removedImages: string[]         // Filenames to remove
  mode: PublishMode
}

export type PublishMode = "direct" | "branch-pr"
```

### 6.2 Page Types

```typescript
// src/types/page.ts

export interface PageFrontmatter {
  title: string
  slug: string                    // e.g., "/about"
}

export interface PageListItem {
  frontmatter: PageFrontmatter
  directoryName: string           // e.g., "about"
  directoryPath: string           // e.g., "content/pages/about"
  sha: string
}

export interface PageDetail extends PageListItem {
  body: string
  rawContent: string
}

export interface CreatePageInput {
  frontmatter: PageFrontmatter
  body: string
  mode: PublishMode
}

export interface UpdatePageInput {
  frontmatter: PageFrontmatter
  body: string
  sha: string
  mode: PublishMode
}
```

### 6.3 Tag Types

```typescript
// src/types/index.ts

export interface Tag {
  name: string
  count: number
  posts: Array<{
    title: string
    slug: string
    date: string
  }>
  lastUsed: string               // Most recent post date using this tag
}
```

### 6.4 Image Types

```typescript
// src/types/index.ts

export interface ImageUpload {
  filename: string               // e.g., "article-banner.png" or "image-1.png"
  content: string                // base64-encoded image data
  type: "banner" | "inline"
}

export interface ExistingImage {
  filename: string
  path: string                   // Full GitHub path
  sha: string
  size: number
  url: string                    // GitHub raw content URL
}
```

### 6.5 GitHub API Response Types

```typescript
// src/types/github.ts

export interface GitHubContentFile {
  name: string
  path: string
  sha: string
  size: number
  type: "file"
  content: string                 // base64 encoded
  encoding: "base64"
}

export interface GitHubContentDirectory {
  name: string
  path: string
  sha: string
  type: "dir"
}

export type GitHubContent = GitHubContentFile | GitHubContentDirectory

export interface GitHubRef {
  ref: string
  object: {
    sha: string
    type: string
  }
}

export interface GitHubCommit {
  sha: string
  tree: {
    sha: string
  }
  message: string
  parents: Array<{ sha: string }>
}

export interface GitHubTree {
  sha: string
  tree: GitHubTreeEntry[]
}

export interface GitHubTreeEntry {
  path: string
  mode: "100644" | "100755" | "040000" | "160000" | "120000"
  type: "blob" | "tree" | "commit"
  sha: string | null              // null = delete
  content?: string                // inline content (alternative to sha)
}

export interface GitHubBlob {
  sha: string
  url: string
}

export interface GitHubPullRequest {
  number: number
  html_url: string
  state: "open" | "closed"
  title: string
  mergeable: boolean | null
  head: { ref: string; sha: string }
  base: { ref: string }
}
```

### 6.6 API Response Types

```typescript
// src/types/index.ts

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: {
    message: string
    code: string                  // e.g., "CONFLICT", "NOT_FOUND", "VALIDATION_ERROR"
    details?: Record<string, string[]>  // Field-level validation errors
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface PublishResult {
  mode: PublishMode
  commitSha: string
  prUrl?: string                  // Only for branch-pr mode
  prNumber?: number
  deployUrl?: string              // Vercel preview URL (for PR mode)
}
```

### 6.7 Zod Validation Schemas

```typescript
// src/lib/mdx/schema.ts
import { z } from "zod"

export const postFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  slug: z.string().min(1).regex(/^\/[a-z0-9-]+$/, "Slug must start with / and contain only lowercase alphanumeric and hyphens"),
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
  banner: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  defer: z.boolean().optional(),
})

export const pageFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).regex(/^\/[a-z0-9-]+$/, "Slug must start with /"),
})

export const createPostSchema = z.object({
  frontmatter: postFrontmatterSchema,
  body: z.string().min(1, "Post body is required"),
  images: z.array(z.object({
    filename: z.string(),
    content: z.string(),           // base64
    type: z.enum(["banner", "inline"]),
  })).default([]),
  mode: z.enum(["direct", "branch-pr"]).default("branch-pr"),
})

export const updatePostSchema = createPostSchema.extend({
  sha: z.string().min(1, "SHA is required for update"),
  removedImages: z.array(z.string()).default([]),
})
```

---

## 7. UI/UX Design

### 7.1 Design System: Vercel-Inspired Dark Theme

**Philosophy**: Minimal, monochromatic, content-focused. No decorative elements. Let the content breathe.

### 7.2 Color Tokens (CSS Variables)

Applied via `.dark` class in `globals.css` (shadcn/ui + Tailwind v4):

| Token | Value (oklch) | Hex Approx | Usage |
|-------|--------------|------------|-------|
| `--background` | `oklch(0.145 0 0)` | `#0a0a0a` | Page background |
| `--foreground` | `oklch(0.985 0 0)` | `#ededed` | Primary text |
| `--card` | `oklch(0.205 0 0)` | `#171717` | Card backgrounds |
| `--card-foreground` | `oklch(0.985 0 0)` | `#ededed` | Card text |
| `--muted` | `oklch(0.269 0 0)` | `#262626` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.708 0 0)` | `#a3a3a3` | Secondary text |
| `--border` | `oklch(1 0 0 / 10%)` | `rgba(255,255,255,0.1)` | Borders |
| `--input` | `oklch(1 0 0 / 15%)` | `rgba(255,255,255,0.15)` | Input borders |
| `--primary` | `oklch(0.922 0 0)` | `#e5e5e5` | Primary buttons |
| `--primary-foreground` | `oklch(0.205 0 0)` | `#171717` | Primary button text |
| `--destructive` | `oklch(0.704 0.191 22.216)` | `#ee0000` | Delete actions |
| `--accent` | `oklch(0.269 0 0)` | `#262626` | Hover states |
| `--sidebar` | `oklch(0.205 0 0)` | `#171717` | Sidebar background |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` | `rgba(255,255,255,0.1)` | Sidebar border |

### 7.3 Typography

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Page title | Geist Sans | 24px | 700 | -0.04em |
| Section heading | Geist Sans | 18px | 600 | -0.02em |
| Body text | Geist Sans | 14px | 400 | -0.01em |
| Small/muted | Geist Sans | 12px | 400 | 0 |
| Monospace (slugs, dates, IDs) | Geist Mono | 12-14px | 400 | 0 |
| Button text | Geist Sans | 14px | 500 | 0 |

**Font installation**: `next/font/google` or `geist` npm package.

### 7.4 Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────────────────────────┐ │
│ │          │ │ Header: SidebarTrigger + Breadcrumbs      [user]│ │
│ │ Sidebar  │ ├─────────────────────────────────────────────────┤ │
│ │          │ │                                                 │ │
│ │ ● Dash   │ │  Main Content Area                              │ │
│ │ ● Posts  │ │                                                 │ │
│ │ ● Pages  │ │  (page-specific content)                        │ │
│ │ ● Tags   │ │                                                 │ │
│ │          │ │                                                 │ │
│ │          │ │                                                 │ │
│ │ ──────── │ │                                                 │ │
│ │ ○ Blog ↗ │ │                                                 │ │
│ │ ○ GitHub↗│ │                                                 │ │
│ │          │ │                                                 │ │
│ │ [avatar] │ │                                                 │ │
│ │ Sign Out │ │                                                 │ │
│ └──────────┘ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Sidebar** (shadcn Sidebar component, variant `"inset"`, collapsible `"icon"`):
- Width: 256px (expanded), 48px (collapsed, icon-only)
- Navigation groups:
  1. **Content**: Dashboard, Posts, Pages, Tags
  2. **External**: Blog (external link), GitHub (external link)
  3. **Footer**: User avatar + name, Sign Out button

**Header**: 56px height, border-bottom, contains:
- Sidebar toggle button (hamburger icon)
- Breadcrumbs (e.g., Dashboard > Posts > Edit "Post Title")

**Main content**: Flex-1, padding 24px, max-width 1200px for content pages.

### 7.5 Page Wireframes

#### Dashboard (`/`)

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Posts    7│ │ Pages   1│ │ Tags   21│ │ Month   0│        │
│ │ Total    │ │ Total    │ │ Unique   │ │ This mo  │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│ ┌──────────────────────────┐ ┌────────────────────────────┐ │
│ │ Recent Posts              │ │ Quick Actions              │ │
│ │                          │ │                            │ │
│ │ ● Post 1    2023-03-21  │ │ [+ New Post]  [+ New Page] │ │
│ │ ● Post 2    2022-11-23  │ │ [↗ View Blog] [↗ GitHub]   │ │
│ │ ● Post 3    2022-06-01  │ │                            │ │
│ │ ● Post 4    2022-04-27  │ └────────────────────────────┘ │
│ │ ● Post 5    2022-03-20  │                                │
│ └──────────────────────────┘ ┌────────────────────────────┐ │
│                              │ Tag Distribution            │ │
│                              │ devops       ████████ 4     │ │
│                              │ development  ██████   3     │ │
│                              │ typescript   ████     2     │ │
│                              │ ...                         │ │
│                              └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Posts List (`/posts`)

```
┌─────────────────────────────────────────────────────────────┐
│ Posts                                        [+ New Post]    │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search posts...]                                        │
├─────────────────────────────────────────────────────────────┤
│ Title                  Slug                Date     Tags  ⋮ │
│ ─────────────────────────────────────────────────────────── │
│ Sign and Send Pubkey   /error-sign-..     23-03-21  2    ⋮ │
│ Continuous Deploy EC2  /devops-cont..     22-11-23  6    ⋮ │
│ Fatal Error VIPS       /error-fatal..     22-06-01  3    ⋮ │
│ Deploy Gatsby DO       /devops-depl..     22-04-27  3    ⋮ │
│ NestJS UseCase Test    /development..     22-03-20  4    ⋮ │
│ Unofficial Driver      /development..     22-02-28  4    ⋮ │
│ Better Way Handle Env  /devops-bett..     21-03-08  2    ⋮ │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 Component Library (shadcn/ui Components Used)

| Component | Usage |
|-----------|-------|
| `Sidebar` | Main navigation |
| `Button` | All actions |
| `Card` | Dashboard stats, content cards |
| `Input` | Form text inputs |
| `Textarea` | Description field |
| `Label` | Form labels |
| `Badge` | Tags, status indicators |
| `Dialog` | Confirmation dialogs, publish options |
| `Sheet` | Mobile sidebar |
| `Command` | Tag search/selection |
| `Table` | Posts/Pages data tables |
| `Dropdown Menu` | Row actions (edit, delete, view) |
| `Form` | All forms (react-hook-form + zod) |
| `Select` | Category selection |
| `Tabs` | Editor tabs (if needed) |
| `Toast` | Success/error notifications (sonner) |
| `Tooltip` | Icon button labels |
| `Separator` | Visual dividers |
| `Breadcrumb` | Page navigation trail |
| `Avatar` | User avatar in sidebar |
| `Skeleton` | Loading states |
| `Calendar` | Date picker |
| `Popover` | Date picker container |
| `Checkbox` | Boolean fields (defer) |
| `Switch` | Publish mode toggle |

---

## 8. Tech Stack

| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| Next.js | 15.x | Framework | App Router, API routes, SSR, middleware |
| TypeScript | 5.x | Language | Type safety across full stack |
| React | 19.x | UI Library | Comes with Next.js 15 |
| pnpm | 9.x | Package manager | Fast, disk efficient |
| Tailwind CSS | 4.x | Styling | Utility-first, shadcn/ui requires it |
| shadcn/ui | latest | Component library | Beautiful, accessible, customizable |
| @mdxeditor/editor | latest | MDX editor | Native MDX, rich editing, Lexical-based |
| NextAuth.js | v5 (beta) | Authentication | First-party Next.js auth, GitHub OAuth |
| Octokit | @octokit/rest 22.x | GitHub API client | Official GitHub SDK |
| @octokit/plugin-throttling | 9.x | Rate limiting | Automatic retry on rate limits |
| TanStack Query | v5 | Server state | Caching, mutations, optimistic updates |
| gray-matter | 4.x | Frontmatter parsing | Parse/serialize YAML frontmatter |
| zod | 3.x | Validation | Schema validation for forms + API |
| date-fns | 3.x | Date utilities | Lightweight date formatting |
| next-themes | 0.4.x | Theme management | Dark mode with class strategy |
| Geist | latest | Font | Vercel's design system font |
| sonner | latest | Toast notifications | Modern toast component |
| react-hook-form | 7.x | Form management | Performant forms with shadcn/ui |
| @hookform/resolvers | 3.x | Form validation | Zod resolver for react-hook-form |
| lucide-react | latest | Icons | Consistent icon set for shadcn/ui |
| Vitest | 2.x | Unit testing | Fast, Vite-powered, TypeScript native |
| @testing-library/react | 16.x | Component testing | React testing utilities |
| Playwright | latest | E2E testing | Cross-browser E2E tests |
| Vercel | — | Deployment | Auto-deploy from Git, preview deploys |

---

## 9. API Specifications

### 9.1 Common Patterns

**Authentication**: All API routes (except `/api/auth/*`) require valid session.

```typescript
// Common auth check pattern
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return NextResponse.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 }
    )
  }
  return session
}
```

**Error Response Format**:
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { "field": ["validation error"] }
  }
}
```

**Error Codes**:
| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | SHA mismatch (stale content) |
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `GITHUB_API_ERROR` | 502 | GitHub API returned error |
| `RATE_LIMITED` | 429 | GitHub API rate limit hit |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 9.2 Posts API

#### `GET /api/posts` — List Posts

**Response** `200 OK`:
```json
{
  "data": [
    {
      "frontmatter": {
        "title": "Post Title",
        "description": "Post description",
        "date": "2024-01-15",
        "slug": "/devops-post-title-240115",
        "tags": ["devops", "typescript"],
        "banner": "./article-banner.png"
      },
      "directoryName": "240115-devops-post-title",
      "directoryPath": "content/posts/240115-devops-post-title",
      "sha": "abc123...",
      "hasBanner": true,
      "images": ["article-banner.png", "image-1.png"]
    }
  ]
}
```

**Implementation**:
1. `octokit.repos.getContent({ path: "content/posts" })` → list directories
2. For each directory: `getContent({ path: "{dir}/index.mdx" })` → decode + parse frontmatter
3. Check for images in directory listing
4. Sort by date descending

#### `POST /api/posts` — Create Post

**Request body**:
```json
{
  "frontmatter": {
    "title": "New Post",
    "description": "Description",
    "date": "2024-01-15",
    "slug": "/devops-new-post-240115",
    "tags": ["devops"]
  },
  "body": "# Hello World\n\nPost content here...",
  "images": [
    { "filename": "article-banner.png", "content": "base64...", "type": "banner" }
  ],
  "mode": "branch-pr"
}
```

**Response** `201 Created`:
```json
{
  "data": {
    "mode": "branch-pr",
    "commitSha": "def456...",
    "prUrl": "https://github.com/stevejkang/blog/pull/42",
    "prNumber": 42
  }
}
```

**Validation**: `createPostSchema` (Zod)
**Side effects**: Creates directory + files via Git Trees API

#### `GET /api/posts/[slug]` — Get Post Detail

**Response** `200 OK`:
```json
{
  "data": {
    "frontmatter": { "...": "..." },
    "body": "# Hello World\n\nPost content...",
    "rawContent": "---\ntitle: ...\n---\n# Hello World...",
    "directoryName": "240115-devops-post-title",
    "directoryPath": "content/posts/240115-devops-post-title",
    "sha": "abc123...",
    "hasBanner": true,
    "images": ["article-banner.png"]
  }
}
```

**Note**: `slug` parameter is URL-encoded and decoded server-side. Match against frontmatter `slug` field across all posts.

#### `PUT /api/posts/[slug]` — Update Post

**Request body**: Same as Create + `sha` field + `removedImages` array.
**Response**: Same as Create.
**409 Conflict**: If `sha` doesn't match current file SHA.

#### `DELETE /api/posts/[slug]` — Delete Post

**Response** `200 OK`:
```json
{
  "data": {
    "deleted": true,
    "directoryPath": "content/posts/240115-devops-post-title",
    "commitSha": "ghi789..."
  }
}
```

### 9.3 Pages API

Same patterns as Posts API with simplified frontmatter. See Section 4.3.

### 9.4 Tags API

#### `GET /api/tags` — List Tags

**Response** `200 OK`:
```json
{
  "data": [
    {
      "name": "devops",
      "count": 4,
      "posts": [
        { "title": "Post 1", "slug": "/slug-1", "date": "2024-01-15" }
      ],
      "lastUsed": "2024-01-15"
    }
  ]
}
```

### 9.5 Images API

#### `POST /api/images` — Upload Image

**Request**: `multipart/form-data`
- `file`: Image file (max 5MB)
- `postSlug`: Target post slug (for path generation)

**Response** `200 OK`:
```json
{
  "data": {
    "filename": "image-1.png",
    "relativePath": "./image-1.png",
    "size": 245632,
    "type": "image/png"
  }
}
```

> **Note**: This endpoint stores the image in memory/temporary storage during editing. The actual Git commit happens via the Posts API create/update endpoints.

### 9.6 Publish API

#### `POST /api/publish` — Publish or Create PR

**Request body**:
```json
{
  "action": "merge-pr",
  "prNumber": 42
}
```

**Response** `200 OK`:
```json
{
  "data": {
    "merged": true,
    "commitSha": "jkl012..."
  }
}
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Wave 1)
**Goal**: Project scaffolding, auth, GitHub client, core types
**Completion Criteria**: `pnpm build` passes, auth works, GitHub API connected

Tasks:
- Project initialization (Next.js 15 + pnpm + TypeScript)
- shadcn/ui + Tailwind v4 + dark theme setup
- NextAuth v5 + GitHub OAuth + single-user restriction
- Octokit client with throttling
- TypeScript types + Zod schemas
- Query client + provider setup

### Phase 2: Core API (Wave 2)
**Goal**: All GitHub content operations working
**Completion Criteria**: All API routes respond correctly, CRUD tested

Tasks:
- GitHub content read utilities (files, directories, frontmatter parsing)
- Git Trees API atomic commit logic
- Branch + PR creation logic
- Posts API routes (CRUD)
- Pages API routes (CRUD)
- Tags API route
- Images handling logic

### Phase 3: UI Shell (Wave 2-3, parallel with API)
**Goal**: Layout, navigation, all page shells
**Completion Criteria**: All pages render, navigation works

Tasks:
- Dashboard layout (sidebar + header + main content)
- Sidebar navigation component
- Posts list page + data table
- Pages list page + data table
- Tags page
- Loading skeletons + error boundaries

### Phase 4: Editor + Forms (Wave 3)
**Goal**: MDX editor working, all forms functional
**Completion Criteria**: Create/edit posts with rich editor

Tasks:
- MDX editor integration (dynamic import + plugins)
- Post create/edit form (two-column layout)
- Page create/edit form
- Image upload handling (drag-drop, paste)
- Publish dialog (mode selection)

### Phase 5: Polish (Wave 4)
**Goal**: Dashboard stats, SEO preview, final polish
**Completion Criteria**: All features working, all tests passing

Tasks:
- Dashboard stats cards
- Dashboard widgets (recent posts, tags, quick actions)
- SEO preview component (SERP + OG card)
- Delete confirmation flows
- Toast notifications
- Empty states
- Final testing + bug fixes

### Phase Summary

| Phase | Tasks | Parallel | Depends On |
|-------|-------|----------|------------|
| 1: Foundation | 6 | All parallel | Nothing |
| 2: Core API | 7 | All parallel | Phase 1 (types, GitHub client) |
| 3: UI Shell | 6 | Parallel with Phase 2 | Phase 1 (layout, theme) |
| 4: Editor + Forms | 5 | After Phase 2 + 3 | API routes + page shells |
| 5: Polish | 7 | After Phase 4 | Editor + forms working |

---

## 11. Constraints & Risks

### 11.1 Technical Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| GitHub API rate limit: 5,000/hr | Heavy listing operations consume quota | Cache with TanStack Query, batch reads |
| GitHub file size limit: 100MB | Large images won't upload | Client-side 5MB limit, validate before upload |
| GitHub Contents API: 1MB per file | Large MDX files may fail via Contents API | Use Git Trees API for all writes (no limit) |
| MDXEditor client-only | Cannot SSR the editor | Dynamic import with `ssr: false` |
| No database | No server-side state | Git is the source of truth, TanStack Query for caching |
| Single repo dependency | Blog repo must exist and be accessible | Validate connection on app start |

### 11.2 Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| GitHub API downtime | Low | High (app non-functional) | Show clear error state, retry logic |
| OAuth token expiry | Medium | Medium (auth fails) | NextAuth handles refresh, clear error UX |
| Concurrent edits (same user, 2 tabs) | Low | Medium (data loss) | SHA-based optimistic locking |
| MDXEditor breaking changes | Medium | Medium (editor non-functional) | Pin version, test before upgrading |
| Large post listing (100+ posts) | Low (currently 7) | Low (slow API) | Pagination when needed, progressive loading |
| Git Trees API misuse (missing base_tree) | Low | Critical (repo data loss) | Strict validation, always include base_tree |
| Vercel build failure after push | Low | Medium (deploy fails) | PR mode allows preview before merge |

### 11.3 GitHub API Specific Limits

| Limit | Value | Relevant Operations |
|-------|-------|-------------------|
| Requests per hour | 5,000 (authenticated) | All operations |
| Secondary rate limit | ~100 concurrent | Batch operations |
| File content size | 1MB (Contents API) | Reading large MDX files |
| Blob creation | 100MB | Image uploads |
| Tree entries per request | ~1000 | Atomic commits with many files |

---

## 12. Non-Functional Requirements

### 12.1 Performance

| Metric | Target | How to Achieve |
|--------|--------|---------------|
| Posts list load | < 3s | Server-side prefetch, TanStack Query cache |
| Post edit load | < 2s | Single API call + prefetch |
| Editor input latency | < 50ms | Client-side editor, no server round-trips |
| Image upload feedback | < 1s | Client-side preview before server upload |
| Publish action | < 10s | Git Trees API atomic commit (3-5 API calls) |
| Dashboard load | < 3s | Parallel data fetching |

### 12.2 Security

| Requirement | Implementation |
|------------|---------------|
| Authentication required | middleware.ts blocks all unauthenticated routes |
| Single-user access | signIn callback checks GitHub username |
| CSRF protection | NextAuth built-in |
| Token security | Server-side only (GITHUB_TOKEN), httpOnly cookies |
| Input validation | Zod schemas on all API inputs |
| XSS prevention | React's built-in escaping + MDX sanitization |

### 12.3 Accessibility

| Requirement | Standard | Implementation |
|-------------|----------|---------------|
| Color contrast | WCAG 2.1 AA | Dark theme tokens meet 4.5:1 ratio |
| Keyboard navigation | Full | shadcn/ui components are keyboard-accessible |
| Screen reader | Basic | Semantic HTML, aria-labels on icons |
| Focus indicators | Visible | Ring utility on focus-visible |
| Reduced motion | Respected | `prefers-reduced-motion` media query |

### 12.4 Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

> Desktop-first design. Mobile is functional (responsive sidebar) but not optimized.

<!-- PRD_SECTIONS_END -->

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — Start Immediately, ALL PARALLEL):
├── T1:  Project scaffolding + configs [quick]
├── T2:  shadcn/ui + dark theme + fonts [visual-engineering]
├── T3:  TypeScript types + Zod schemas [quick]
├── T4:  NextAuth v5 + GitHub OAuth [deep]
├── T5:  Octokit client + throttling [quick]
├── T6:  TanStack Query setup [quick]
└── T7:  Vitest + testing infrastructure [quick]

Wave 2 (Core API + UI Shell — After Wave 1, MAX PARALLEL):
├── T8:  GitHub content read utilities (depends: T3, T5) [deep]
├── T9:  Git Trees API atomic commits (depends: T3, T5) [deep]
├── T10: Branch + PR management (depends: T5, T9) [unspecified-high]
├── T11: Posts API routes (depends: T3, T8, T9) [deep]
├── T12: Pages API routes (depends: T3, T8, T9) [unspecified-high]
├── T13: Tags API route (depends: T8) [quick]
├── T14: Dashboard layout + sidebar (depends: T2) [visual-engineering]
└── T15: Login page (depends: T2, T4) [quick]

Wave 3 (UI Pages + Editor — After Wave 2):
├── T16: Posts list page + data table (depends: T6, T11, T14) [visual-engineering]
├── T17: Pages list page + data table (depends: T6, T12, T14) [visual-engineering]
├── T18: Tags management page (depends: T6, T13, T14) [visual-engineering]
├── T19: MDX editor integration (depends: T2) [deep]
├── T20: Image upload handler (depends: T9) [unspecified-high]
├── T21: Post create/edit form (depends: T11, T16, T19, T20) [deep]
└── T22: Page create/edit form (depends: T12, T17, T19) [unspecified-high]

Wave 4 (Integration + Polish — After Wave 3):
├── T23: Publish dialog + workflow (depends: T10, T21) [unspecified-high]
├── T24: SEO preview component (depends: T21) [visual-engineering]
├── T25: Dashboard widgets (depends: T11, T13, T14) [visual-engineering]
├── T26: Delete flows + error handling (depends: T11, T12, T16, T17) [unspecified-high]
├── T27: Toast notifications + loading + empty states (depends: T14) [quick]
└── T28: E2E tests with Playwright (depends: T21, T22, T23) [deep]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright skill)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 | — | T4, T5, T6, T7 | 1 |
| T2 | — | T14, T15, T19 | 1 |
| T3 | — | T8, T9, T11, T12 | 1 |
| T4 | — | T15 | 1 |
| T5 | — | T8, T9, T10 | 1 |
| T6 | — | T16, T17, T18 | 1 |
| T7 | — | all tests | 1 |
| T8 | T3, T5 | T11, T12, T13 | 2 |
| T9 | T3, T5 | T10, T11, T12, T20 | 2 |
| T10 | T5, T9 | T23 | 2 |
| T11 | T3, T8, T9 | T16, T21, T25, T26 | 2 |
| T12 | T3, T8, T9 | T17, T22, T26 | 2 |
| T13 | T8 | T18, T25 | 2 |
| T14 | T2 | T16-T18, T25, T27 | 2 |
| T15 | T2, T4 | — | 2 |
| T16 | T6, T11, T14 | T21, T26 | 3 |
| T17 | T6, T12, T14 | T22, T26 | 3 |
| T18 | T6, T13, T14 | — | 3 |
| T19 | T2 | T21, T22 | 3 |
| T20 | T9 | T21 | 3 |
| T21 | T11, T16, T19, T20 | T23, T24, T28 | 3 |
| T22 | T12, T17, T19 | T28 | 3 |
| T23 | T10, T21 | T28 | 4 |
| T24 | T21 | — | 4 |
| T25 | T11, T13, T14 | — | 4 |
| T26 | T11, T12, T16, T17 | — | 4 |
| T27 | T14 | — | 4 |
| T28 | T21, T22, T23 | FINAL | 4 |

### Agent Dispatch Summary

- **Wave 1**: 7 tasks — T1 `quick`, T2 `visual-engineering`, T3 `quick`, T4 `deep`, T5 `quick`, T6 `quick`, T7 `quick`
- **Wave 2**: 8 tasks — T8 `deep`, T9 `deep`, T10 `unspecified-high`, T11 `deep`, T12 `unspecified-high`, T13 `quick`, T14 `visual-engineering`, T15 `quick`
- **Wave 3**: 7 tasks — T16 `visual-engineering`, T17 `visual-engineering`, T18 `visual-engineering`, T19 `deep`, T20 `unspecified-high`, T21 `deep`, T22 `unspecified-high`
- **Wave 4**: 6 tasks — T23 `unspecified-high`, T24 `visual-engineering`, T25 `visual-engineering`, T26 `unspecified-high`, T27 `quick`, T28 `deep`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

**Critical Path**: T1 → T5 → T9 → T11 → T21 → T23 → T28 → FINAL
**Parallel Speedup**: ~65% faster than sequential
**Max Concurrent**: 8 (Wave 2)

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> TDD: Each task writes tests FIRST, then implements.
> PRD Reference: Each task references specific PRD sections for context.

---

### Wave 1: Foundation (All Parallel — No Dependencies)

- [ ] 1. Project Scaffolding + Configuration

  **What to do**:
  - Initialize Next.js 15 project with App Router: `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - Configure `tsconfig.json` with strict mode, path aliases (`@/*` → `src/*`)
  - Configure `next.config.ts` (output: standalone for Vercel)
  - Create `.env.example` with all required env vars (see PRD §2.2)
  - Create `.env.local` template (gitignored)
  - Create `.gitignore` (node_modules, .next, .env.local, .sisyphus)
  - Add `pnpm` config to `package.json` (`"packageManager": "pnpm@9.x"`)
  - Add scripts: `dev`, `build`, `start`, `lint`, `type-check` (`tsc --noEmit`)
  - Install core dependencies: `zod`, `date-fns`, `gray-matter`

  **Must NOT do**:
  - Install shadcn/ui (T2), auth (T4), or Octokit (T5) — separate tasks
  - Create any React components
  - Configure testing (T7)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Standard project initialization, no complex logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2-T7)
  - **Blocks**: T4, T5, T6, T7 (they need package.json to exist)
  - **Blocked By**: None

  **References**:
  - PRD §3.3 (Project Directory Structure)
  - PRD §2.2 (Environment Variables)
  - PRD §8 (Tech Stack — versions)

  **Acceptance Criteria**:
  - [ ] `pnpm install` completes without errors
  - [ ] `pnpm build` produces `.next/` output
  - [ ] `pnpm lint` passes
  - [ ] `pnpm type-check` passes
  - [ ] `.env.example` contains all vars from PRD §2.2

  **QA Scenarios**:
  ```
  Scenario: Fresh build succeeds
    Tool: Bash
    Steps:
      1. pnpm install
      2. pnpm build
      3. Check exit code is 0
    Expected Result: Build completes with "✓ Generating static pages" message
    Evidence: .sisyphus/evidence/task-1-build.txt

  Scenario: Type check passes
    Tool: Bash
    Steps:
      1. pnpm type-check
      2. Check exit code is 0
    Expected Result: No type errors reported
    Evidence: .sisyphus/evidence/task-1-typecheck.txt
  ```

  **Commit**: YES
  - Message: `chore: initialize next.js 15 project with pnpm`
  - Files: `package.json, tsconfig.json, next.config.ts, .env.example, .gitignore, src/app/*`

---

- [ ] 2. shadcn/ui + Tailwind v4 + Dark Theme + Fonts

  **What to do**:
  - Run `pnpm dlx shadcn@latest init` (default style, neutral base, CSS variables: yes)
  - Install `next-themes`, `geist` font package, `tw-animate-css`
  - Configure `src/app/globals.css` with Tailwind v4 + shadcn tokens + Vercel dark overrides (see PRD §7.2)
  - Set dark theme CSS variables exactly as specified in PRD §7.2 (oklch values)
  - Create `src/components/theme-provider.tsx` (next-themes, dark default, class strategy)
  - Update `src/app/layout.tsx` with ThemeProvider (defaultTheme="dark", enableSystem=false)
  - Configure Geist Sans + Geist Mono fonts via `next/font`
  - Install initial shadcn components: `pnpm dlx shadcn@latest add button card input label badge separator skeleton`
  - Verify `components.json` matches PRD §3.3 aliases

  **Must NOT do**:
  - Create layout structure (T14)
  - Install sidebar/complex components (T14)
  - Create any page content

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Theme system, CSS variables, design tokens — visual domain

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T14, T15, T19
  - **Blocked By**: None (but needs T1 to complete first for package.json)

  **References**:
  - PRD §7.2 (Color Tokens)
  - PRD §7.3 (Typography)
  - PRD §7.6 (Component Library)
  - Research: shadcn/ui Tailwind v4 setup (`globals.css` pattern from research)
  - Research: Dark mode provider pattern

  **Acceptance Criteria**:
  - [ ] `globals.css` contains all color tokens from PRD §7.2
  - [ ] `.dark` class applied to html element
  - [ ] Geist Sans and Geist Mono fonts loaded
  - [ ] `pnpm build` passes with shadcn components
  - [ ] Basic Button component renders in dark theme

  **QA Scenarios**:
  ```
  Scenario: Dark theme renders correctly
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Assert html element has class "dark"
      3. Assert body background-color is approximately rgb(10, 10, 10) (#0a0a0a)
      4. Screenshot full page
    Expected Result: Page renders with dark background, light text
    Evidence: .sisyphus/evidence/task-2-dark-theme.png

  Scenario: Fonts loaded correctly
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Assert body font-family contains "Geist"
      3. Check computed styles of a text element
    Expected Result: Geist font family applied
    Evidence: .sisyphus/evidence/task-2-fonts.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add shadcn/ui with vercel-like dark theme`
  - Files: `globals.css, components.json, src/components/ui/*, src/components/theme-provider.tsx, src/app/layout.tsx`

---

- [ ] 3. TypeScript Types + Zod Validation Schemas

  **What to do**:
  - Create `src/types/post.ts` with all Post types (PRD §6.1)
  - Create `src/types/page.ts` with all Page types (PRD §6.2)
  - Create `src/types/github.ts` with GitHub API response types (PRD §6.5)
  - Create `src/types/index.ts` with shared types: Tag, ImageUpload, ExistingImage, ApiResponse, ApiError, ApiResult, PublishResult, PublishMode (PRD §6.3, §6.4, §6.6)
  - Create `src/lib/mdx/schema.ts` with Zod schemas (PRD §6.7): postFrontmatterSchema, pageFrontmatterSchema, createPostSchema, updatePostSchema
  - Write unit tests for Zod schemas: valid data passes, invalid data fails with correct errors
  - Create `src/lib/mdx/slug.ts` with slug/directory generation utilities:
    - `generateDirectoryName(date, category, title)` → `YYMMDD-category-slug-words`
    - `generateSlug(date, category, title)` → `/category-slug-words-YYMMDD`
    - `parseDirectoryName(dirName)` → `{ date, category, slug }`
  - Write unit tests for slug utilities

  **Must NOT do**:
  - Implement API routes (T11-T13)
  - Implement frontmatter parsing (T8)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`test-driven-development`]
  - Reason: Pure type definitions and simple utilities with TDD

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T8, T9, T11, T12
  - **Blocked By**: None

  **References**:
  - PRD §6 (all Data Models subsections)
  - PRD §5.2 (Directory Naming Convention)
  - PRD §5.3 (Frontmatter Generation)
  - Blog repo actual posts: `210308-devops-better-way-to-handle-env`, `220228-development-unofficial-driver-license-verification-with-nestjs`, etc.

  **Acceptance Criteria**:
  - [ ] All TypeScript interfaces compile without errors
  - [ ] Zod schemas validate correct data and reject invalid data
  - [ ] `generateDirectoryName("2024-01-15", "devops", "Better Way to Handle Env")` → `"240115-devops-better-way-to-handle-env"`
  - [ ] `generateSlug("2024-01-15", "devops", "Better Way to Handle Env")` → `"/devops-better-way-to-handle-env-240115"`
  - [ ] All tests pass: `pnpm test src/lib/mdx/`

  **QA Scenarios**:
  ```
  Scenario: Zod schema validates correct post frontmatter
    Tool: Bash (vitest)
    Steps:
      1. Run pnpm test tests/lib/mdx/schema.test.ts
      2. Test passes valid frontmatter object
      3. Test rejects missing title, invalid date, empty tags
    Expected Result: All schema validation tests pass
    Evidence: .sisyphus/evidence/task-3-schema-tests.txt

  Scenario: Slug generation matches blog repo pattern
    Tool: Bash (vitest)
    Steps:
      1. Run pnpm test tests/lib/mdx/slug.test.ts
      2. Test with actual blog repo examples:
         - Date "2021-03-08", category "devops", title "Better Way to Handle Env in Travis"
         - Expected dir: "210308-devops-better-way-to-handle-env-in-travis"
         - Expected slug: "/devops-better-way-to-handle-env-in-travis-210308"
    Expected Result: Generated names match blog repo conventions
    Evidence: .sisyphus/evidence/task-3-slug-tests.txt
  ```

  **Commit**: YES
  - Message: `feat(types): add typescript types and zod validation schemas`
  - Files: `src/types/*.ts, src/lib/mdx/schema.ts, src/lib/mdx/slug.ts, tests/lib/mdx/*.test.ts`

---

- [ ] 4. NextAuth v5 + GitHub OAuth + Single-User Restriction

  **What to do**:
  - Install `next-auth@beta`
  - Create `src/auth.ts` with config per PRD §2.4:
    - GitHub provider
    - JWT session strategy (30 day maxAge)
    - `signIn` callback: restrict to `ALLOWED_USERS` array
    - `session` callback: attach user ID
    - Custom pages: `/login` for signIn, `/login` for error
  - Create `src/app/api/auth/[...nextauth]/route.ts` with handlers
  - Create `src/middleware.ts` per PRD §2.5 (protect all routes except login, api/auth, static)
  - Create helper `src/lib/auth.ts` with `requireAuth()` function for API routes
  - Run `npx auth secret` to generate AUTH_SECRET
  - Write tests: signIn callback rejects non-allowed users, allows allowed user

  **Must NOT do**:
  - Create login page UI (T15)
  - Configure Octokit (T5)
  - Create any dashboard pages

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
  - Reason: Auth is security-critical, needs careful implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T15
  - **Blocked By**: None (but needs T1 package.json)

  **References**:
  - PRD §2 (entire section)
  - Research: NextAuth v5 setup, signIn callback, middleware pattern
  - Research: GitHub OAuth callback URL configuration

  **Acceptance Criteria**:
  - [ ] `src/auth.ts` exports `{ handlers, signIn, signOut, auth }`
  - [ ] middleware redirects unauthenticated users to `/login`
  - [ ] signIn callback returns false for non-allowed GitHub users
  - [ ] API routes return 401 without valid session
  - [ ] Tests pass for auth logic

  **QA Scenarios**:
  ```
  Scenario: Unauthenticated user redirected to login
    Tool: Bash (curl)
    Steps:
      1. curl -I http://localhost:3000/ (no cookies)
      2. Assert response is 307 redirect to /login
    Expected Result: Location header contains "/login"
    Evidence: .sisyphus/evidence/task-4-redirect.txt

  Scenario: API route rejects unauthenticated request
    Tool: Bash (curl)
    Steps:
      1. curl http://localhost:3000/api/posts (no auth)
      2. Assert response status 401
      3. Assert body contains "UNAUTHORIZED"
    Expected Result: 401 Unauthorized response
    Evidence: .sisyphus/evidence/task-4-api-auth.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): add github oauth with single-user restriction`
  - Files: `src/auth.ts, src/middleware.ts, src/lib/auth.ts, src/app/api/auth/[...nextauth]/route.ts`

---

- [ ] 5. Octokit Client + Throttling

  **What to do**:
  - Install `@octokit/rest`, `@octokit/plugin-throttling`
  - Create `src/lib/github/client.ts`:
    - Initialize Octokit with `GITHUB_TOKEN` from env
    - Apply throttling plugin with retry on rate limit (max 2 retries)
    - Export singleton `octokit` instance
    - Export `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` constants
  - Write test: client initializes without error, constants are exported

  **Must NOT do**:
  - Implement content reading (T8)
  - Implement Git Trees API (T9)
  - Add any API routes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple client initialization, straightforward

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T8, T9, T10
  - **Blocked By**: None

  **References**:
  - PRD §5.10 (Rate Limit Handling)
  - Research: Octokit throttling plugin setup

  **Acceptance Criteria**:
  - [ ] Octokit instance created with throttling
  - [ ] Rate limit handler retries up to 2 times
  - [ ] Constants exported for owner, repo, branch
  - [ ] Type-check passes

  **QA Scenarios**:
  ```
  Scenario: Octokit client exports correctly
    Tool: Bash (vitest)
    Steps:
      1. Run test that imports { octokit, GITHUB_OWNER, GITHUB_REPO } from client
      2. Assert octokit is an Octokit instance
      3. Assert constants match expected values
    Expected Result: All exports available and correctly typed
    Evidence: .sisyphus/evidence/task-5-client.txt
  ```

  **Commit**: YES
  - Message: `feat(github): add octokit client with rate limit throttling`
  - Files: `src/lib/github/client.ts, tests/lib/github/client.test.ts`

---

- [ ] 6. TanStack Query Setup

  **What to do**:
  - Install `@tanstack/react-query`, `@tanstack/react-query-devtools`
  - Create `src/lib/query-client.ts` with singleton pattern per research findings:
    - Server: always new QueryClient
    - Browser: singleton QueryClient
    - Default staleTime: 60s, refetchOnWindowFocus: false
  - Create `src/lib/query-keys.ts` with centralized key factory (PRD §6):
    - `queryKeys.posts.all`, `.lists()`, `.detail(slug)`
    - `queryKeys.pages.all`, `.lists()`, `.detail(slug)`
    - `queryKeys.tags.all`
  - Create `src/components/providers.tsx` wrapping QueryClientProvider + ReactQueryDevtools
  - Update `src/app/layout.tsx` to include Providers wrapper
  - Create `src/lib/api/client.ts` — client-side fetch wrapper with error handling

  **Must NOT do**:
  - Create query hooks (T16+)
  - Create API integration functions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Standard setup, following documented patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T16, T17, T18
  - **Blocked By**: None

  **References**:
  - Research: TanStack Query SSR setup, singleton pattern, HydrationBoundary
  - Research: Query key factory pattern

  **Acceptance Criteria**:
  - [ ] QueryClientProvider wraps app in layout.tsx
  - [ ] ReactQueryDevtools visible in development
  - [ ] Query key factory exports typed key arrays
  - [ ] Build passes with providers

  **QA Scenarios**:
  ```
  Scenario: Query provider initializes
    Tool: Bash
    Steps:
      1. pnpm build (ensures provider is valid)
      2. pnpm dev & (start dev server)
      3. curl http://localhost:3000 (page loads)
    Expected Result: Page loads without React hydration errors
    Evidence: .sisyphus/evidence/task-6-provider.txt
  ```

  **Commit**: YES
  - Message: `feat(query): add tanstack query client and provider`
  - Files: `src/lib/query-client.ts, src/lib/query-keys.ts, src/components/providers.tsx, src/lib/api/client.ts`

---

- [ ] 7. Vitest + Testing Infrastructure

  **What to do**:
  - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react`
  - Create `vitest.config.ts`:
    - Environment: `jsdom`
    - Path aliases matching tsconfig (`@/*` → `src/*`)
    - Setup files: `tests/setup.ts`
    - Include: `tests/**/*.test.ts`, `tests/**/*.test.tsx`
    - Coverage: `@vitest/coverage-v8`
  - Create `tests/setup.ts`:
    - Import `@testing-library/jest-dom/vitest`
    - Mock `next/navigation` (useRouter, usePathname, etc.)
    - Mock `next-auth/react` (useSession)
  - Add scripts to `package.json`:
    - `"test": "vitest run"`
    - `"test:watch": "vitest"`
    - `"test:coverage": "vitest run --coverage"`
  - Create a sample test to verify setup works
  - Install Playwright: `pnpm create playwright` (for E2E in T28)

  **Must NOT do**:
  - Write application tests (those come with each task)
  - Configure CI/CD

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`test-driven-development`]
  - Reason: Infrastructure setup, TDD skill knows testing patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: All subsequent test execution
  - **Blocked By**: None

  **References**:
  - PRD Verification Strategy (Vitest + React Testing Library + Playwright)

  **Acceptance Criteria**:
  - [ ] `pnpm test` runs and passes sample test
  - [ ] Path aliases work in tests (`@/` resolves correctly)
  - [ ] React component test renders without errors
  - [ ] `pnpm test:coverage` generates coverage report

  **QA Scenarios**:
  ```
  Scenario: Test infrastructure works
    Tool: Bash
    Steps:
      1. pnpm test
      2. Assert exit code 0
      3. Check output contains "Tests  1 passed"
    Expected Result: Sample test passes
    Evidence: .sisyphus/evidence/task-7-test-infra.txt
  ```

  **Commit**: YES
  - Message: `chore(test): add vitest and testing infrastructure`
  - Files: `vitest.config.ts, tests/setup.ts, tests/sample.test.ts, playwright.config.ts`

---

### Wave 2: Core API + UI Shell (After Wave 1)

- [ ] 8. GitHub Content Read Utilities

  **What to do**:
  - Create `src/lib/github/content.ts` with functions:
    - `listPostDirectories()`: List all directories in `content/posts/`, return `{ name, path, sha }[]`
    - `listPageDirectories()`: List all directories in `content/pages/`
    - `readFile(path)`: Read single file, decode base64, return `{ content, sha }`
    - `readDirectory(path)`: List directory contents (files + their types)
    - `listPostImages(directoryPath)`: List image files in a post directory
  - Create `src/lib/mdx/frontmatter.ts` with functions:
    - `parseFrontmatter(rawContent)`: Use `gray-matter` to split frontmatter + body
    - `serializeFrontmatter(frontmatter, body)`: Combine into full MDX file content
    - `parsePostList(directories)`: Read all post directories, parse frontmatter, return `PostListItem[]`
    - `parsePostDetail(directoryPath)`: Read single post with body, return `PostDetail`
  - Write comprehensive unit tests with mocked Octokit responses
  - Test frontmatter parsing with actual blog repo frontmatter examples

  **Must NOT do**:
  - Create API routes (T11-T13)
  - Implement write operations (T9)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
  - Reason: Core data layer, complex parsing logic, needs thorough testing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T9-T15)
  - **Blocks**: T11, T12, T13
  - **Blocked By**: T3 (types), T5 (Octokit client)

  **References**:
  - PRD §5.2 (Directory Naming Convention)
  - PRD §5.3 (Frontmatter Generation)
  - PRD §6.1 (Post Types — PostListItem, PostDetail)
  - Research: Octokit Contents API — `repos.getContent()`, base64 decode
  - Blog repo actual frontmatter examples from explore agent findings

  **Acceptance Criteria**:
  - [ ] `listPostDirectories()` returns array of directory info
  - [ ] `readFile()` decodes base64 content correctly
  - [ ] `parseFrontmatter()` correctly splits YAML frontmatter from MDX body
  - [ ] `serializeFrontmatter()` produces valid MDX with frontmatter
  - [ ] Round-trip: parse → serialize → parse produces identical output
  - [ ] All tests pass: `pnpm test tests/lib/github/content.test.ts tests/lib/mdx/frontmatter.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Parse actual blog post frontmatter
    Tool: Bash (vitest)
    Steps:
      1. Test with real frontmatter from blog repo:
         "---\ntitle: \"Better Way to Handle Env\"\ndescription: \"desc\"\ndate: 2021-03-08\nslug: \"/devops-better-way-to-handle-env-210308\"\ntags:\n  - devops\n  - travis\nbanner: ./article-banner.png\n---\n# Content"
      2. Assert frontmatter.title === "Better Way to Handle Env"
      3. Assert frontmatter.tags === ["devops", "travis"]
      4. Assert body starts with "# Content"
    Expected Result: All frontmatter fields parsed correctly
    Evidence: .sisyphus/evidence/task-8-frontmatter.txt

  Scenario: Frontmatter round-trip preserves data
    Tool: Bash (vitest)
    Steps:
      1. Parse sample MDX → get frontmatter + body
      2. Serialize back to MDX string
      3. Parse again
      4. Assert deep equality of both parse results
    Expected Result: No data loss in round-trip
    Evidence: .sisyphus/evidence/task-8-roundtrip.txt
  ```

  **Commit**: YES
  - Message: `feat(github): add content reading and frontmatter parsing`
  - Files: `src/lib/github/content.ts, src/lib/mdx/frontmatter.ts, tests/lib/github/content.test.ts, tests/lib/mdx/frontmatter.test.ts`

---

- [ ] 9. Git Trees API Atomic Commit Module

  **What to do**:
  - Create `src/lib/github/commits.ts` with functions:
    - `getLatestCommit(branch?)`: Get HEAD SHA + tree SHA for a branch
    - `createBlob(content, encoding)`: Create a blob in the repo
    - `createTree(baseTreeSha, entries)`: Create a new tree with file entries
    - `createCommit(treeSha, parentSha, message)`: Create a commit
    - `updateRef(branch, commitSha)`: Update branch ref to new commit
    - `atomicCommit({ branch, message, files, deletions })`: High-level function that orchestrates the full 5-step commit flow (PRD §5.5)
      - files: `{ path: string, content: string }[]`
      - deletions: `{ path: string }[]`
      - Returns: `{ commitSha: string }`
  - Each low-level function wraps Octokit calls with error handling
  - `atomicCommit` MUST always pass `base_tree` to preserve existing files
  - Write unit tests with mocked Octokit (mock all 5 steps)
  - Test: atomic commit with MDX + image creates correct tree entries
  - Test: deletion sets sha to null in tree entry

  **Must NOT do**:
  - Branch management (T10)
  - API routes (T11-T12)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
  - Reason: Critical Git operation, data integrity at stake, must be thoroughly tested

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T10, T11, T12, T20
  - **Blocked By**: T3 (types), T5 (Octokit client)

  **References**:
  - PRD §5.5 (Direct to Main — 6-step flow)
  - PRD §5.7 (Delete Flow)
  - PRD §5.4 (Commit Convention)
  - Research: Git Trees API 5-step process (ref → commit → blobs → tree → commit → ref update)
  - Research: CRITICAL — always include `base_tree` to avoid deleting existing files

  **Acceptance Criteria**:
  - [ ] `atomicCommit` creates correct blob for each file
  - [ ] `atomicCommit` creates tree with `base_tree` (CRITICAL)
  - [ ] `atomicCommit` commit message follows convention
  - [ ] Deletion creates tree entries with `sha: null`
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Atomic commit with MDX + image
    Tool: Bash (vitest)
    Steps:
      1. Mock Octokit calls for all 5 steps
      2. Call atomicCommit with MDX content + banner image
      3. Assert createTree was called with base_tree (NOT without it)
      4. Assert tree entries contain both index.mdx and article-banner.png
      5. Assert createCommit was called with correct parent SHA
    Expected Result: All 5 API calls made in correct order with correct params
    Evidence: .sisyphus/evidence/task-9-atomic-commit.txt

  Scenario: Delete creates null SHA entries
    Tool: Bash (vitest)
    Steps:
      1. Call atomicCommit with deletions: ["content/posts/dir/index.mdx"]
      2. Assert tree entry has { sha: null } for deleted file
    Expected Result: Delete entries use null SHA
    Evidence: .sisyphus/evidence/task-9-delete.txt
  ```

  **Commit**: YES
  - Message: `feat(github): add git trees api atomic commit module`
  - Files: `src/lib/github/commits.ts, tests/lib/github/commits.test.ts`

---

- [ ] 10. Branch + PR Management

  **What to do**:
  - Create `src/lib/github/branches.ts`:
    - `createBranch(branchName, fromSha)`: Create new branch from SHA
    - `deleteBranch(branchName)`: Delete a branch
    - `branchExists(branchName)`: Check if branch exists
    - `getBranchName(slug)`: Generate branch name from slug per PRD §5.9
  - Create `src/lib/github/pull-requests.ts`:
    - `createPR({ title, body, head, base })`: Create a pull request
    - `getPR(prNumber)`: Get PR details (including mergeable status)
    - `listContentPRs()`: List open PRs with `content/` branch prefix
    - `mergePR(prNumber, method?)`: Merge a PR (squash default)
  - Write tests for branch naming convention and PR creation

  **Must NOT do**:
  - Implement publish UI (T23)
  - Modify atomic commit module (T9)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]
  - Reason: Multiple GitHub API integrations, needs careful testing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T23
  - **Blocked By**: T5 (Octokit), T9 (commits — PR needs commit on branch)

  **References**:
  - PRD §5.6 (Branch+PR flow)
  - PRD §5.9 (Branch naming convention)
  - Research: Octokit PRs API — `pulls.create()`, `pulls.get()`, `pulls.merge()`

  **Acceptance Criteria**:
  - [ ] `getBranchName("/devops-new-post-240115")` → `"content/devops-new-post-240115"`
  - [ ] `createBranch` creates ref via Git Refs API
  - [ ] `createPR` returns PR URL and number
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Branch name generation
    Tool: Bash (vitest)
    Steps:
      1. Test getBranchName with various slugs
      2. Assert "/devops-slug-240115" → "content/devops-slug-240115"
      3. Assert leading slash is stripped
    Expected Result: Branch names follow convention
    Evidence: .sisyphus/evidence/task-10-branch.txt
  ```

  **Commit**: YES
  - Message: `feat(github): add branch and pull request management`
  - Files: `src/lib/github/branches.ts, src/lib/github/pull-requests.ts, tests/lib/github/branches.test.ts, tests/lib/github/pull-requests.test.ts`

---

- [ ] 11. Posts API Routes (CRUD)

  **What to do**:
  - Create `src/app/api/posts/route.ts`:
    - `GET`: List all posts using `parsePostList()` from T8, return `PostListItem[]`
    - `POST`: Create post — validate with `createPostSchema`, generate directory name + frontmatter, call `atomicCommit()` from T9, optionally create PR from T10
  - Create `src/app/api/posts/[slug]/route.ts`:
    - `GET`: Get single post detail using `parsePostDetail()` from T8
    - `PUT`: Update post — validate with `updatePostSchema`, check SHA match, call `atomicCommit()`, handle image additions/removals
    - `DELETE`: Delete post — list directory contents, call `atomicCommit()` with all file deletions
  - All routes: require auth via `requireAuth()`, handle errors with standard ApiError format
  - Write integration tests (mock Octokit, test full route handler logic)

  **Must NOT do**:
  - Create UI components (T16, T21)
  - Handle image uploads via separate endpoint (T20 handles upload, this commits them)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
  - Reason: Most complex API routes, orchestrate multiple modules

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T16, T21, T25, T26
  - **Blocked By**: T3 (types/schemas), T8 (content reading), T9 (atomic commits)

  **References**:
  - PRD §9.2 (Posts API — all endpoints with request/response schemas)
  - PRD §9.1 (Common Patterns — auth, error codes)
  - PRD §5.4 (Commit Convention)
  - PRD §5.5 (Direct to Main flow)
  - PRD §5.6 (Branch+PR flow)

  **Acceptance Criteria**:
  - [ ] `GET /api/posts` returns list of posts sorted by date desc
  - [ ] `POST /api/posts` creates post directory + MDX file via Git Trees API
  - [ ] `PUT /api/posts/[slug]` updates with SHA check, returns 409 on mismatch
  - [ ] `DELETE /api/posts/[slug]` removes entire directory
  - [ ] All routes return 401 without auth
  - [ ] All routes return 422 on validation failure
  - [ ] Tests pass: `pnpm test tests/api/posts.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Create post via API
    Tool: Bash (curl)
    Preconditions: Dev server running with valid GITHUB_TOKEN
    Steps:
      1. curl -X POST http://localhost:3000/api/posts -H "Content-Type: application/json" -d '{"frontmatter":{"title":"Test Post","description":"Test","date":"2024-01-15","slug":"/test-post-240115","tags":["test"]},"body":"# Hello","images":[],"mode":"direct"}'
      2. Assert response status 201
      3. Assert response contains commitSha
    Expected Result: Post created with valid commit
    Evidence: .sisyphus/evidence/task-11-create-post.txt

  Scenario: Validation error returns 422
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/api/posts -H "Content-Type: application/json" -d '{"frontmatter":{"title":""},"body":"","images":[]}'
      2. Assert response status 422
      3. Assert error.code === "VALIDATION_ERROR"
    Expected Result: Validation errors returned with field details
    Evidence: .sisyphus/evidence/task-11-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(api): add posts crud api routes`
  - Files: `src/app/api/posts/route.ts, src/app/api/posts/[slug]/route.ts, tests/api/posts.test.ts`

---

- [ ] 12. Pages API Routes (CRUD)

  **What to do**:
  - Create `src/app/api/pages/route.ts` (GET list, POST create) — same pattern as Posts but with simplified frontmatter
  - Create `src/app/api/pages/[slug]/route.ts` (GET detail, PUT update, DELETE)
  - Use `pageFrontmatterSchema` for validation
  - Directory: `content/pages/{name}/index.mdx`
  - Write integration tests

  **Must NOT do**:
  - Create UI (T17, T22)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]
  - Reason: Similar to T11 but simpler, follows established pattern

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T17, T22, T26
  - **Blocked By**: T3, T8, T9

  **References**:
  - PRD §4.3 (Pages CRUD)
  - PRD §9.3 (Pages API)
  - PRD §6.2 (Page Types)

  **Acceptance Criteria**:
  - [ ] All CRUD operations work for pages
  - [ ] Simplified frontmatter (title + slug only)
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: List pages returns about page
    Tool: Bash (curl)
    Steps:
      1. curl http://localhost:3000/api/pages
      2. Assert response contains page with slug "/about"
    Expected Result: About page listed
    Evidence: .sisyphus/evidence/task-12-pages.txt
  ```

  **Commit**: YES
  - Message: `feat(api): add pages crud api routes`
  - Files: `src/app/api/pages/route.ts, src/app/api/pages/[slug]/route.ts, tests/api/pages.test.ts`

---

- [ ] 13. Tags API Route

  **What to do**:
  - Create `src/app/api/tags/route.ts`:
    - `GET`: Scan all post frontmatter, aggregate tags with counts
    - Return: `Tag[]` sorted by count desc (PRD §6.3)
    - Include: post titles/slugs/dates per tag, lastUsed date
  - Write tests with mocked post data

  **Must NOT do**:
  - Create tags UI (T18)
  - Tag editing (tags are managed through posts)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`test-driven-development`]
  - Reason: Single endpoint, straightforward aggregation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T18, T25
  - **Blocked By**: T8 (content reading)

  **References**:
  - PRD §4.5 (Tag Management — aggregation logic)
  - PRD §9.4 (Tags API)
  - PRD §6.3 (Tag Types)

  **Acceptance Criteria**:
  - [ ] `GET /api/tags` returns tags sorted by count desc
  - [ ] Each tag has correct count and post references
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Tags aggregated correctly
    Tool: Bash (curl)
    Steps:
      1. curl http://localhost:3000/api/tags
      2. Assert response is array of Tag objects
      3. Assert "devops" tag has count >= 4 (from actual blog data)
    Expected Result: Tags with correct counts
    Evidence: .sisyphus/evidence/task-13-tags.txt
  ```

  **Commit**: YES
  - Message: `feat(api): add tags aggregation api route`
  - Files: `src/app/api/tags/route.ts, tests/api/tags.test.ts`

---

- [ ] 14. Dashboard Layout + Sidebar Navigation

  **What to do**:
  - Install sidebar component: `pnpm dlx shadcn@latest add sidebar breadcrumb dropdown-menu avatar collapsible`
  - Create `src/app/(dashboard)/layout.tsx`:
    - SidebarProvider (defaultOpen, sidebar width 256px)
    - AppSidebar + SidebarInset
    - Header with SidebarTrigger + Breadcrumbs
    - Main content area with padding
  - Create `src/components/app-sidebar.tsx`:
    - Navigation groups per PRD §7.4:
      - Content: Dashboard (LayoutDashboard), Posts (FileText), Pages (File), Tags (Tag)
      - External: Blog (ExternalLink → juneyoung.io), GitHub (Github → repo URL)
      - Footer: User avatar + name (from session), Sign Out button
    - Active state highlighting based on current route
    - Collapsible to icon-only mode
  - Create `src/components/nav-main.tsx`: Navigation menu item component
  - Create `src/components/shared/loading-skeleton.tsx`: Page loading skeleton
  - Create `src/components/shared/error-boundary.tsx`: Error boundary component

  **Must NOT do**:
  - Create page content (T16-T18, T25)
  - Create forms or editors

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Layout design, navigation, visual polish

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T16, T17, T18, T25, T27
  - **Blocked By**: T2 (shadcn/ui + theme)

  **References**:
  - PRD §7.4 (Layout Structure — ASCII wireframe)
  - PRD §7.6 (Component Library — Sidebar, Breadcrumb, Avatar, etc.)
  - Research: shadcn sidebar layout pattern (`SidebarProvider` + `SidebarInset`)
  - Research: Collapsible navigation component pattern

  **Acceptance Criteria**:
  - [ ] Sidebar renders with all navigation items
  - [ ] Sidebar collapses to icon-only mode
  - [ ] Active route highlighted in sidebar
  - [ ] Breadcrumbs show current page hierarchy
  - [ ] User avatar and sign out shown in footer
  - [ ] Layout responsive (sidebar as sheet on mobile)

  **QA Scenarios**:
  ```
  Scenario: Sidebar navigation works
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000 (authenticated)
      2. Assert sidebar contains "Dashboard", "Posts", "Pages", "Tags"
      3. Click "Posts" nav item
      4. Assert URL is /posts
      5. Assert "Posts" item has active styling
      6. Screenshot
    Expected Result: Navigation items link correctly and show active state
    Evidence: .sisyphus/evidence/task-14-sidebar.png

  Scenario: Sidebar collapses
    Tool: Playwright
    Steps:
      1. Click sidebar trigger button
      2. Assert sidebar width reduces to ~48px
      3. Assert nav items show only icons
      4. Screenshot
    Expected Result: Sidebar collapses to icon mode
    Evidence: .sisyphus/evidence/task-14-collapsed.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add dashboard layout with sidebar navigation`
  - Files: `src/app/(dashboard)/layout.tsx, src/components/app-sidebar.tsx, src/components/nav-main.tsx, src/components/shared/*.tsx`

---

- [ ] 15. Login Page

  **What to do**:
  - Create `src/app/(auth)/login/page.tsx`:
    - Centered card layout (dark background)
    - App logo/title: "Blog Admin"
    - "Sign in with GitHub" button (GitHub icon from Lucide)
    - Uses NextAuth `signIn("github")` on click
    - Error message display if redirected from auth error
    - If already authenticated, redirect to dashboard
  - Style consistent with Vercel dark theme

  **Must NOT do**:
  - Implement auth logic (T4)
  - Add registration or password forms

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Single page, simple UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T2 (theme), T4 (auth)

  **References**:
  - PRD §2.3 (Authentication Flow)
  - PRD §7.2 (Color Tokens)

  **Acceptance Criteria**:
  - [ ] Login page renders with GitHub sign-in button
  - [ ] Click triggers GitHub OAuth flow
  - [ ] Error message shown when auth fails
  - [ ] Redirects to `/` when already authenticated

  **QA Scenarios**:
  ```
  Scenario: Login page renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/login
      2. Assert page contains "Blog Admin" text
      3. Assert button with text "Sign in with GitHub" exists
      4. Screenshot
    Expected Result: Login page with GitHub button
    Evidence: .sisyphus/evidence/task-15-login.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add login page with github oauth button`
  - Files: `src/app/(auth)/login/page.tsx`

---

### Wave 3: UI Pages + Editor (After Wave 2)

- [ ] 16. Posts List Page + Data Table

  **What to do**:
  - Install: `pnpm dlx shadcn@latest add table dropdown-menu`
  - Create `src/hooks/use-posts.ts`:
    - `usePosts()`: TanStack Query hook fetching `GET /api/posts`
    - `usePost(slug)`: Single post detail query
    - `useCreatePost()`: Mutation with cache invalidation
    - `useUpdatePost()`: Mutation with cache invalidation
    - `useDeletePost()`: Mutation with cache invalidation
  - Create `src/lib/api/posts.ts`: Client-side fetch functions for all post endpoints
  - Create `src/app/(dashboard)/posts/page.tsx`:
    - Server-side prefetch with `HydrationBoundary`
    - Page header: "Posts" title + "New Post" button (→ /posts/new)
    - Search input (client-side title filter)
  - Create `src/components/posts/posts-table.tsx`:
    - Data table per PRD §4.2.1 (columns: Title, Slug, Date, Tags, Banner, Actions)
    - Title links to edit page
    - Date sorted desc by default (monospace font)
    - Tags shown as badges (first 3 + "+N")
    - Banner: image icon indicator
    - Actions dropdown: Edit, Delete, View on blog (external link)
  - Create `src/components/posts/post-actions.tsx`: Row actions dropdown

  **Must NOT do**:
  - Create/edit forms (T21)
  - Implement delete confirmation (T26)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `test-driven-development`]
  - Reason: Data table UI, visual component, needs testing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T17-T22)
  - **Blocks**: T21, T26
  - **Blocked By**: T6 (TanStack Query), T11 (Posts API), T14 (Layout)

  **References**:
  - PRD §4.2.1 (Posts List — column spec)
  - PRD §7.5 (Posts List wireframe)
  - Research: TanStack Query mutation patterns with cache invalidation
  - Research: shadcn data table pattern

  **Acceptance Criteria**:
  - [ ] Posts table displays all columns from PRD §4.2.1
  - [ ] Search filters posts by title (client-side, instant)
  - [ ] Date column sorted desc by default
  - [ ] Tags shown as badges
  - [ ] Actions dropdown has Edit, Delete, View items
  - [ ] Empty state shown when no posts

  **QA Scenarios**:
  ```
  Scenario: Posts table renders with data
    Tool: Playwright
    Steps:
      1. Navigate to /posts (authenticated)
      2. Assert table has columns: Title, Slug, Date, Tags, Actions
      3. Assert at least 1 row present (from blog repo data)
      4. Assert dates are in monospace font (font-family contains "mono")
      5. Screenshot full page
    Expected Result: Posts table with correct columns and data
    Evidence: .sisyphus/evidence/task-16-posts-table.png

  Scenario: Search filters posts
    Tool: Playwright
    Steps:
      1. Navigate to /posts
      2. Type "travis" in search input
      3. Assert only posts with "travis" in title are visible
      4. Clear search
      5. Assert all posts visible again
    Expected Result: Client-side filtering works
    Evidence: .sisyphus/evidence/task-16-search.png
  ```

  **Commit**: YES
  - Message: `feat(posts): add posts list page with data table`
  - Files: `src/app/(dashboard)/posts/page.tsx, src/components/posts/posts-table.tsx, src/components/posts/post-actions.tsx, src/hooks/use-posts.ts, src/lib/api/posts.ts`

---

- [ ] 17. Pages List Page + Data Table

  **What to do**:
  - Create `src/hooks/use-pages.ts`: Query + mutation hooks (same pattern as T16)
  - Create `src/lib/api/pages.ts`: Client-side fetch functions
  - Create `src/app/(dashboard)/pages/page.tsx`: Pages list with HydrationBoundary
  - Create `src/components/pages/pages-table.tsx`: Simplified data table (Title, Slug, Actions)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Same pattern as T16, simpler

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T22, T26
  - **Blocked By**: T6, T12, T14

  **References**:
  - PRD §4.3.1 (Pages List)
  - T16 implementation (follow same patterns)

  **Acceptance Criteria**:
  - [ ] Pages table displays Title, Slug, Actions
  - [ ] About page listed from blog repo

  **QA Scenarios**:
  ```
  Scenario: Pages table renders
    Tool: Playwright
    Steps:
      1. Navigate to /pages
      2. Assert table contains row with title "About"
      3. Screenshot
    Expected Result: Pages table with about page
    Evidence: .sisyphus/evidence/task-17-pages.png
  ```

  **Commit**: YES
  - Message: `feat(pages): add pages list page with data table`
  - Files: `src/app/(dashboard)/pages/page.tsx, src/components/pages/pages-table.tsx, src/hooks/use-pages.ts, src/lib/api/pages.ts`

---

- [ ] 18. Tags Management Page

  **What to do**:
  - Create `src/hooks/use-tags.ts`: Query hook for tags API
  - Create `src/app/(dashboard)/tags/page.tsx`:
    - Page header with total tag count
    - Search input for filtering tags
    - Tag list per PRD §4.5.2 (name, post count, last used, low-usage indicator)
    - Expandable rows showing posts per tag

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Data visualization, UI component

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: T6, T13, T14

  **References**:
  - PRD §4.5 (Tag Management)
  - PRD §4.5.2 (Tag Management UI wireframe)

  **Acceptance Criteria**:
  - [ ] Tags displayed with counts sorted desc
  - [ ] Search filters tags by name
  - [ ] Low-usage indicator on tags with count = 1
  - [ ] Click tag expands to show posts

  **QA Scenarios**:
  ```
  Scenario: Tags page renders with data
    Tool: Playwright
    Steps:
      1. Navigate to /tags
      2. Assert tag "devops" is listed with count >= 4
      3. Assert total count shown in header
      4. Screenshot
    Expected Result: Tags with correct counts
    Evidence: .sisyphus/evidence/task-18-tags.png
  ```

  **Commit**: YES
  - Message: `feat(tags): add tags management page`
  - Files: `src/app/(dashboard)/tags/page.tsx, src/hooks/use-tags.ts`

---

- [ ] 19. MDX Editor Integration

  **What to do**:
  - Install `@mdxeditor/editor`
  - Create `src/components/editor/initialized-editor.tsx` (`'use client'`):
    - Import ALL plugins per PRD §4.4.2
    - Configure toolbar per PRD §4.4.3
    - Configure `diffSourcePlugin` for source/rich toggle
    - Apply dark theme styling (override editor CSS variables for dark bg)
  - Create `src/components/editor/mdx-editor.tsx`:
    - Dynamic import with `ssr: false` (CRITICAL for Next.js)
    - ForwardRef pattern for `MDXEditorMethods` access
  - Create `src/components/editor/editor-toolbar.tsx`:
    - Custom toolbar layout matching PRD §4.4.3 wireframe
  - Style editor for dark theme (editor default is light — must override)
  - Test: editor loads without hydration errors, markdown round-trips correctly

  **Must NOT do**:
  - Image upload handler (T20)
  - Form integration (T21)
  - Frontmatter plugin (not needed — frontmatter handled by form fields)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Complex client-side component, SSR gotchas, dark theme override

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T21, T22
  - **Blocked By**: T2 (theme)

  **References**:
  - PRD §4.4 (entire MDX Editor section)
  - Research: MDXEditor two-file pattern for Next.js
  - Research: All available plugins and toolbar components
  - Research: SSR issues and dynamic import solution

  **Acceptance Criteria**:
  - [ ] Editor loads without hydration errors
  - [ ] All toolbar features functional (bold, italic, headings, lists, links, code, tables, images, quotes, horizontal rule)
  - [ ] Source/rich toggle switches between markdown source and rich text
  - [ ] Editor styled for dark theme (dark background, light text)
  - [ ] `getMarkdown()` returns valid MDX string
  - [ ] `setMarkdown()` loads content into editor

  **QA Scenarios**:
  ```
  Scenario: Editor loads and accepts input
    Tool: Playwright
    Steps:
      1. Navigate to page with editor (create a test page if needed)
      2. Assert editor component is visible (no SSR error)
      3. Click into editor area
      4. Type "# Hello World"
      5. Assert heading element appears in rich mode
      6. Click source toggle
      7. Assert markdown source shows "# Hello World"
      8. Screenshot
    Expected Result: Editor renders, accepts input, toggles modes
    Evidence: .sisyphus/evidence/task-19-editor.png

  Scenario: Editor dark theme
    Tool: Playwright
    Steps:
      1. Navigate to page with editor
      2. Assert editor background is dark (not white)
      3. Assert editor text is light
      4. Screenshot
    Expected Result: Editor matches dark theme
    Evidence: .sisyphus/evidence/task-19-dark-editor.png
  ```

  **Commit**: YES
  - Message: `feat(editor): integrate mdxeditor with dark theme and all plugins`
  - Files: `src/components/editor/initialized-editor.tsx, src/components/editor/mdx-editor.tsx, src/components/editor/editor-toolbar.tsx`

---

- [ ] 20. Image Upload Handler

  **What to do**:
  - Create `src/components/editor/image-upload.ts`:
    - `imageUploadHandler(file: File)`: Handler for MDXEditor's `imagePlugin`
    - Validates file type and size (PRD §4.7.4)
    - Generates filename: `image-{timestamp}.{ext}`
    - Stores image in component state (not committed yet)
    - Returns relative path `./image-{timestamp}.{ext}` for MDX reference
  - Create `src/app/api/images/route.ts`:
    - `POST`: Accept multipart/form-data, validate file, return metadata
    - Store temporarily (in memory for the session or pass through to commit)
  - Create banner upload component for post form sidebar:
    - Drag-and-drop zone
    - Clipboard paste support
    - Preview thumbnail
    - Remove button
  - Write tests for validation logic

  **Must NOT do**:
  - Commit images to Git (that's done by T11/T21 on publish)
  - Image optimization or CDN integration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]
  - Reason: File handling, upload logic, client-server coordination

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T21
  - **Blocked By**: T9 (commit module — needs to know image format)

  **References**:
  - PRD §4.7 (Image Management — all subsections)
  - PRD §4.4.4 (Image Upload Handler)
  - Research: MDXEditor `imagePlugin` with custom `imageUploadHandler`

  **Acceptance Criteria**:
  - [ ] Image upload validates type (.png, .jpg, .jpeg, .webp) and size (≤5MB)
  - [ ] Banner upload supports drag-drop and clipboard paste
  - [ ] Upload returns relative path for MDX reference
  - [ ] Preview thumbnail shown immediately
  - [ ] Tests pass for validation logic

  **QA Scenarios**:
  ```
  Scenario: Valid image upload
    Tool: Bash (vitest)
    Steps:
      1. Create mock File with type "image/png", size 1MB
      2. Call imageUploadHandler
      3. Assert returns path starting with "./"
      4. Assert filename matches pattern "image-{timestamp}.png"
    Expected Result: Valid path returned
    Evidence: .sisyphus/evidence/task-20-upload.txt

  Scenario: Oversized image rejected
    Tool: Bash (vitest)
    Steps:
      1. Create mock File with size 6MB
      2. Call imageUploadHandler
      3. Assert throws error with "exceeds 5MB" message
    Expected Result: Error thrown for oversized file
    Evidence: .sisyphus/evidence/task-20-oversize.txt
  ```

  **Commit**: YES
  - Message: `feat(images): add image upload handler with validation`
  - Files: `src/components/editor/image-upload.ts, src/app/api/images/route.ts, tests/lib/images.test.ts`

---

- [ ] 21. Post Create/Edit Form

  **What to do**:
  - Install: `pnpm dlx shadcn@latest add form select popover calendar textarea switch toast command`
  - Install: `react-hook-form`, `@hookform/resolvers`, `sonner`
  - Create `src/components/posts/post-form.tsx`:
    - Two-column layout per PRD §4.2.2 wireframe
    - Left (65%): MDX editor (from T19)
    - Right (35%): Metadata sidebar with fields per PRD §4.2.2 table:
      - Title (large input), Description (textarea), Date (calendar picker)
      - Category (text input), Slug (auto-generated, editable)
      - Tags (multi-select using Command component)
      - Banner image (drop zone from T20)
      - Optional: canonicalUrl, defer checkbox
      - SEO preview panel (placeholder — T24)
      - Publish button (with dropdown for mode selection)
    - Auto-generate slug and directory name as user types (PRD §4.2.2 auto-generation rules)
    - react-hook-form + Zod resolver for validation
    - Dirty state tracking (warn on unsaved changes via beforeunload)
  - Create `src/app/(dashboard)/posts/new/page.tsx`: Create post page, renders PostForm
  - Create `src/app/(dashboard)/posts/[slug]/edit/page.tsx`:
    - Load post detail via `usePost(slug)` hook
    - Render PostForm with pre-populated data
    - Track SHA for optimistic locking
  - Integrate publish flow: form submit → API call → toast notification → redirect

  **Must NOT do**:
  - Publish dialog details (T23)
  - SEO preview implementation (T24)
  - Delete flow (T26)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`frontend-ui-ux`, `test-driven-development`]
  - Reason: Most complex UI component, form + editor + auto-generation + API integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (but has many dependencies)
  - **Parallel Group**: Wave 3 (later in wave, after T19 + T20)
  - **Blocks**: T23, T24, T28
  - **Blocked By**: T11 (Posts API), T16 (Posts hooks), T19 (Editor), T20 (Image upload)

  **References**:
  - PRD §4.2.2 (Create Post — wireframe, field specs, auto-generation)
  - PRD §4.2.3 (Edit Post — load flow, update flow, SHA tracking)
  - PRD §6.7 (Zod schemas for form validation)
  - Research: react-hook-form + Zod resolver pattern with shadcn/ui

  **Acceptance Criteria**:
  - [ ] Two-column layout matches PRD wireframe
  - [ ] All form fields present and validated
  - [ ] Slug auto-generates from title + category + date
  - [ ] MDX editor loads and functions
  - [ ] Banner image upload works
  - [ ] Form submits to API and shows toast
  - [ ] Edit page loads existing post data
  - [ ] Unsaved changes warning on navigation

  **QA Scenarios**:
  ```
  Scenario: Create new post
    Tool: Playwright
    Steps:
      1. Navigate to /posts/new
      2. Fill title: "Test Post Title"
      3. Fill description: "A test post description"
      4. Select date: today
      5. Fill category: "development"
      6. Assert slug auto-generated to "/development-test-post-title-{YYMMDD}"
      7. Add tag "test" using tag input
      8. Type "# Hello World" in editor
      9. Click "Publish" button
      10. Assert toast shows success message
      11. Assert redirected to /posts
      12. Screenshot
    Expected Result: Post created successfully
    Evidence: .sisyphus/evidence/task-21-create.png

  Scenario: Edit existing post loads data
    Tool: Playwright
    Steps:
      1. Navigate to /posts
      2. Click "Edit" on first post
      3. Assert title field is pre-populated
      4. Assert editor contains post body
      5. Assert tags are shown
      6. Screenshot
    Expected Result: All fields populated from existing post
    Evidence: .sisyphus/evidence/task-21-edit.png
  ```

  **Commit**: YES
  - Message: `feat(posts): add post create and edit forms with mdx editor`
  - Files: `src/components/posts/post-form.tsx, src/app/(dashboard)/posts/new/page.tsx, src/app/(dashboard)/posts/[slug]/edit/page.tsx`

---

- [ ] 22. Page Create/Edit Form

  **What to do**:
  - Create `src/components/pages/page-form.tsx`:
    - Single-column layout (simpler than post form)
    - Fields: title, slug, MDX editor
    - Uses same MDX editor component from T19
    - react-hook-form + Zod resolver
  - Create `src/app/(dashboard)/pages/new/page.tsx`
  - Create `src/app/(dashboard)/pages/[slug]/edit/page.tsx`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Same pattern as T21 but simpler

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T28
  - **Blocked By**: T12, T17, T19

  **References**:
  - PRD §4.3.2 (Create Page)
  - PRD §4.3.3 (Edit/Delete Page)
  - T21 implementation (follow same patterns)

  **Acceptance Criteria**:
  - [ ] Single-column form with title, slug, editor
  - [ ] Create and edit pages work end-to-end

  **QA Scenarios**:
  ```
  Scenario: Edit about page
    Tool: Playwright
    Steps:
      1. Navigate to /pages
      2. Click edit on "About" page
      3. Assert title field shows "About"
      4. Assert slug shows "/about"
      5. Assert editor has content
      6. Screenshot
    Expected Result: About page loads for editing
    Evidence: .sisyphus/evidence/task-22-page-edit.png
  ```

  **Commit**: YES
  - Message: `feat(pages): add page create and edit forms`
  - Files: `src/components/pages/page-form.tsx, src/app/(dashboard)/pages/new/page.tsx, src/app/(dashboard)/pages/[slug]/edit/page.tsx`

---

### Wave 4: Integration + Polish (After Wave 3)

- [ ] 23. Publish Dialog + Workflow

  **What to do**:
  - Create `src/components/posts/publish-dialog.tsx`:
    - Dialog triggered from post form's Publish button
    - Two options with descriptions per PRD §4.2.2:
      - "Create PR" (default): Branch + PR → Vercel Preview
      - "Publish Now": Direct to main → production deploy
    - Shows PR URL/preview link on success (for PR mode)
    - Loading state during publish
    - Error state with retry option
  - Create `src/hooks/use-publish.ts`:
    - `usePublishPost()`: Mutation for post publishing (handles both modes)
    - `usePublishPage()`: Same for pages
    - `useMergePR(prNumber)`: Mutation for merging a PR
  - Create `src/app/api/publish/route.ts`:
    - `POST { action: "merge-pr", prNumber }`: Merge an open PR
  - Integrate with post form: Publish button triggers dialog → mode selection → API call → result display

  **Must NOT do**:
  - Modify Git commit module (T9) or branch module (T10)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]
  - Reason: Workflow orchestration, two publish paths, error handling

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T24-T28)
  - **Blocks**: T28
  - **Blocked By**: T10 (branch/PR), T21 (post form)

  **References**:
  - PRD §4.2.2 (Publish Flow)
  - PRD §5.5 (Direct to Main)
  - PRD §5.6 (Branch + PR)
  - PRD §9.6 (Publish API)

  **Acceptance Criteria**:
  - [ ] Publish dialog shows two mode options
  - [ ] "Create PR" mode creates branch + PR + returns PR URL
  - [ ] "Publish Now" mode commits directly to main
  - [ ] Success state shows relevant info (commit SHA, PR URL)
  - [ ] Error state with retry
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Publish via PR mode
    Tool: Playwright
    Steps:
      1. Navigate to /posts/new, fill in all fields
      2. Click "Publish"
      3. Select "Create PR" option
      4. Assert loading indicator shown
      5. Assert success message with PR URL
      6. Screenshot
    Expected Result: PR created with preview link
    Evidence: .sisyphus/evidence/task-23-publish-pr.png

  Scenario: Publish direct to main
    Tool: Playwright
    Steps:
      1. Navigate to /posts/new, fill in all fields
      2. Click "Publish"
      3. Select "Publish Now" option
      4. Assert success message with commit SHA
    Expected Result: Commit pushed to main
    Evidence: .sisyphus/evidence/task-23-publish-direct.png
  ```

  **Commit**: YES
  - Message: `feat(publish): add publish dialog with branch-pr and direct modes`
  - Files: `src/components/posts/publish-dialog.tsx, src/hooks/use-publish.ts, src/app/api/publish/route.ts`

---

- [ ] 24. SEO Preview Component

  **What to do**:
  - Create `src/components/seo/seo-preview.tsx`:
    - Google SERP preview per PRD §4.6.1:
      - URL line: `juneyoung.io › {slug}`
      - Title: Truncated at 60 chars, color indicator (green/yellow/red)
      - Description: Truncated at 160 chars, color indicator
    - OG Card preview per PRD §4.6.2:
      - Card with banner image (or placeholder)
      - Site name, title, description
    - Live update as form fields change (reactive to title, description, slug, banner)
  - Create `src/components/seo/seo-fields.tsx`:
    - Character count indicators for title (60 char guide) and description (160 char guide)
    - Color coding: green (optimal) → yellow (warning) → red (too long)
  - Integrate into post form sidebar (right column, below banner upload)

  **Must NOT do**:
  - Actual SEO optimization or meta tag generation (that's Gatsby's job)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Visual preview component, design precision needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T21 (post form — integrates into it)

  **References**:
  - PRD §4.6.1 (Google SERP Preview — rendering rules)
  - PRD §4.6.2 (OG Card Preview — rendering rules)

  **Acceptance Criteria**:
  - [ ] SERP preview shows URL, title (truncated at 60), description (truncated at 160)
  - [ ] Character count indicators with color coding
  - [ ] OG card shows banner image or placeholder
  - [ ] Preview updates live as form fields change

  **QA Scenarios**:
  ```
  Scenario: SEO preview updates live
    Tool: Playwright
    Steps:
      1. Navigate to /posts/new
      2. Type title: "A Very Long Title That Exceeds Sixty Characters Limit For SEO Testing"
      3. Assert SERP title truncated with "..." after ~60 chars
      4. Assert character count indicator is red
      5. Type description with < 155 chars
      6. Assert description indicator is green
      7. Screenshot
    Expected Result: Live preview with color indicators
    Evidence: .sisyphus/evidence/task-24-seo.png
  ```

  **Commit**: YES
  - Message: `feat(seo): add google serp and og card preview components`
  - Files: `src/components/seo/seo-preview.tsx, src/components/seo/seo-fields.tsx`

---

- [ ] 25. Dashboard Widgets

  **What to do**:
  - Create `src/app/(dashboard)/page.tsx`: Dashboard overview page with server prefetch
  - Create `src/components/dashboard/stats-cards.tsx`:
    - 4 stat cards per PRD §4.1.1 (Total Posts, Total Pages, Total Tags, This Month)
    - Each card: Lucide icon, large number, label, trend indicator
  - Create `src/components/dashboard/recent-posts.tsx`:
    - 5 most recent posts per PRD §4.1.2
    - Each row: title, date (monospace), slug (muted), tag count, edit link
  - Create `src/components/dashboard/tag-distribution.tsx`:
    - Tag usage bar chart per PRD §4.1.3
    - CSS-based bars (no chart library)
  - Create `src/components/dashboard/quick-actions.tsx`:
    - 4 action buttons per PRD §4.1.4 (New Post, New Page, View Blog, View Repo)

  **Must NOT do**:
  - Analytics integration
  - Complex charting library

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Dashboard visual design, multiple widgets

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T11 (posts data), T13 (tags data), T14 (layout)

  **References**:
  - PRD §4.1 (Dashboard — all subsections)
  - PRD §7.5 (Dashboard wireframe)
  - PRD §7.3 (Typography — monospace for dates)

  **Acceptance Criteria**:
  - [ ] 4 stat cards with correct counts
  - [ ] Recent posts show 5 most recent
  - [ ] Tag distribution shows bars with counts
  - [ ] Quick actions navigate correctly
  - [ ] All widgets have loading skeletons

  **QA Scenarios**:
  ```
  Scenario: Dashboard renders all widgets
    Tool: Playwright
    Steps:
      1. Navigate to / (dashboard)
      2. Assert 4 stat cards visible
      3. Assert "Posts" card shows count >= 7
      4. Assert recent posts widget has entries
      5. Assert tag distribution widget shows "devops"
      6. Assert quick action buttons present
      7. Screenshot full page
    Expected Result: All dashboard widgets render with data
    Evidence: .sisyphus/evidence/task-25-dashboard.png
  ```

  **Commit**: YES
  - Message: `feat(dashboard): add stats cards, recent posts, tags, and quick actions`
  - Files: `src/app/(dashboard)/page.tsx, src/components/dashboard/*.tsx`

---

- [ ] 26. Delete Flows + Error Handling

  **What to do**:
  - Create `src/components/shared/confirm-dialog.tsx`:
    - Reusable confirmation dialog
    - Destructive variant (red confirm button)
    - Props: title, description, confirmLabel, onConfirm, destructive
  - Add delete confirmation to post actions (PRD §4.2.4):
    - "Delete '{title}'? This will remove the post and all associated images."
    - Calls `useDeletePost` mutation
    - On success: toast + redirect to posts list + invalidate cache
  - Add delete confirmation to page actions (same pattern)
  - Add error handling patterns:
    - 409 Conflict: "Content was modified externally" with reload button
    - 502 GitHub API Error: "GitHub is unavailable" with retry button
    - 429 Rate Limited: "Too many requests" with countdown timer
    - Network error: "Connection lost" with retry
  - Create error boundary for page-level errors

  **Must NOT do**:
  - Modify API routes (error responses already defined)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Multiple UI patterns, error UX design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T11, T12, T16, T17

  **References**:
  - PRD §4.2.4 (Delete Post)
  - PRD §9.1 (Error Codes — CONFLICT, GITHUB_API_ERROR, RATE_LIMITED)

  **Acceptance Criteria**:
  - [ ] Delete dialog shows with correct title and warning
  - [ ] Confirm triggers deletion API call
  - [ ] 409 error shows "modified externally" message
  - [ ] Network errors show retry option
  - [ ] All error states visually consistent

  **QA Scenarios**:
  ```
  Scenario: Delete post with confirmation
    Tool: Playwright
    Steps:
      1. Navigate to /posts
      2. Click actions dropdown on a post
      3. Click "Delete"
      4. Assert confirmation dialog appears with post title
      5. Assert destructive button text "Delete"
      6. Screenshot dialog
    Expected Result: Confirmation dialog with correct content
    Evidence: .sisyphus/evidence/task-26-delete.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add delete confirmations and error handling patterns`
  - Files: `src/components/shared/confirm-dialog.tsx, updated post-actions.tsx, updated page-actions.tsx`

---

- [ ] 27. Toast Notifications + Loading States + Empty States

  **What to do**:
  - Install `sonner` for toast notifications
  - Add `<Toaster />` component to root layout
  - Add toast notifications to all mutations:
    - Post created: "Post published successfully" (with link to blog)
    - Post updated: "Post updated"
    - Post deleted: "Post deleted"
    - PR created: "Pull request created" (with link to PR)
    - Error: Red toast with error message
  - Add loading skeletons to all list pages:
    - Posts table skeleton (rows with shimmer)
    - Pages table skeleton
    - Tags list skeleton
    - Dashboard cards skeleton
  - Add empty states to all list pages:
    - Posts: "No posts yet" illustration + "Create your first post" button
    - Pages: "No pages yet" + "Create a page" button
    - Tags: "No tags yet" (auto-populates when posts exist)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Repetitive UI additions, straightforward

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T14 (layout)

  **References**:
  - PRD §7.6 (Toast component — sonner)
  - PRD §4.2.1 (Empty state description)

  **Acceptance Criteria**:
  - [ ] Toast appears on all CRUD operations
  - [ ] Loading skeletons shown while data fetches
  - [ ] Empty states shown when no data exists
  - [ ] All toasts dismiss automatically after 5 seconds

  **QA Scenarios**:
  ```
  Scenario: Toast notification on action
    Tool: Playwright
    Steps:
      1. Navigate to /posts/new
      2. Fill form and submit
      3. Assert toast notification appears
      4. Assert toast contains success message
      5. Screenshot with toast visible
    Expected Result: Toast appears and auto-dismisses
    Evidence: .sisyphus/evidence/task-27-toast.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add toast notifications, loading skeletons, and empty states`
  - Files: `updated layout.tsx, src/components/shared/loading-skeleton.tsx, various pages updated`

---

- [ ] 28. E2E Tests with Playwright

  **What to do**:
  - Create `tests/e2e/auth.spec.ts`:
    - Test: unauthenticated user redirected to login
    - Test: login page renders with GitHub button
  - Create `tests/e2e/posts.spec.ts`:
    - Test: posts list loads and displays data
    - Test: create new post flow (fill form → publish → verify in list)
    - Test: edit post flow (load → modify → save → verify changes)
    - Test: search posts by title
  - Create `tests/e2e/dashboard.spec.ts`:
    - Test: dashboard widgets load with data
    - Test: quick action buttons navigate correctly
  - Configure Playwright to run against dev server
  - Use test fixtures for authenticated state (save auth state)
  - Mock GitHub API responses where needed for stable tests

  **Must NOT do**:
  - Test against real GitHub API (use mocks for E2E reliability)
  - Test complex Git operations (covered by unit tests)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
  - Reason: Complex E2E test setup, multiple scenarios, auth fixtures

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (late)
  - **Blocks**: FINAL verification
  - **Blocked By**: T21 (post form), T22 (page form), T23 (publish)

  **References**:
  - PRD §3.3 (test directory structure)
  - All QA scenarios from previous tasks (use as E2E test basis)
  - Playwright skill for browser automation patterns

  **Acceptance Criteria**:
  - [ ] All E2E tests pass: `pnpm exec playwright test`
  - [ ] Auth flow tested
  - [ ] Posts CRUD flow tested end-to-end
  - [ ] Dashboard tested
  - [ ] Tests run in < 2 minutes

  **QA Scenarios**:
  ```
  Scenario: Full E2E test suite passes
    Tool: Bash
    Steps:
      1. pnpm exec playwright test
      2. Assert exit code 0
      3. Check all tests passed
    Expected Result: All E2E tests green
    Evidence: .sisyphus/evidence/task-28-e2e.txt
  ```

  **Commit**: YES
  - Message: `test(e2e): add playwright e2e tests for auth, posts, and dashboard`
  - Files: `tests/e2e/*.spec.ts, playwright.config.ts`

<!-- TODOS_END -->

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

> Each task produces ONE atomic commit upon completion.
> Commits follow the project's conventional commit format.

| Task | Commit Message | Pre-commit Check |
|------|---------------|-----------------|
| T1 | `chore: initialize next.js 15 project with pnpm` | `pnpm build` |
| T2 | `feat(ui): add shadcn/ui with vercel-like dark theme` | `pnpm build` |
| T3 | `feat(types): add typescript types and zod validation schemas` | `pnpm test tests/lib/mdx/` |
| T4 | `feat(auth): add github oauth with single-user restriction` | `pnpm build` |
| T5 | `feat(github): add octokit client with rate limit throttling` | `pnpm type-check` |
| T6 | `feat(query): add tanstack query client and provider` | `pnpm build` |
| T7 | `chore(test): add vitest and testing infrastructure` | `pnpm test` |
| T8 | `feat(github): add content reading and frontmatter parsing` | `pnpm test tests/lib/github/content.test.ts tests/lib/mdx/frontmatter.test.ts` |
| T9 | `feat(github): add git trees api atomic commit module` | `pnpm test tests/lib/github/commits.test.ts` |
| T10 | `feat(github): add branch and pull request management` | `pnpm test tests/lib/github/` |
| T11 | `feat(api): add posts crud api routes` | `pnpm test tests/api/posts.test.ts` |
| T12 | `feat(api): add pages crud api routes` | `pnpm test tests/api/pages.test.ts` |
| T13 | `feat(api): add tags aggregation api route` | `pnpm test tests/api/tags.test.ts` |
| T14 | `feat(ui): add dashboard layout with sidebar navigation` | `pnpm build` |
| T15 | `feat(auth): add login page with github oauth button` | `pnpm build` |
| T16 | `feat(posts): add posts list page with data table` | `pnpm build` |
| T17 | `feat(pages): add pages list page with data table` | `pnpm build` |
| T18 | `feat(tags): add tags management page` | `pnpm build` |
| T19 | `feat(editor): integrate mdxeditor with dark theme and all plugins` | `pnpm build` |
| T20 | `feat(images): add image upload handler with validation` | `pnpm test tests/lib/images.test.ts` |
| T21 | `feat(posts): add post create and edit forms with mdx editor` | `pnpm build` |
| T22 | `feat(pages): add page create and edit forms` | `pnpm build` |
| T23 | `feat(publish): add publish dialog with branch-pr and direct modes` | `pnpm build` |
| T24 | `feat(seo): add google serp and og card preview components` | `pnpm build` |
| T25 | `feat(dashboard): add stats cards, recent posts, tags, and quick actions` | `pnpm build` |
| T26 | `feat(ui): add delete confirmations and error handling patterns` | `pnpm build` |
| T27 | `feat(ui): add toast notifications, loading skeletons, and empty states` | `pnpm build` |
| T28 | `test(e2e): add playwright e2e tests for auth, posts, and dashboard` | `pnpm exec playwright test` |

---

## Success Criteria

### Verification Commands
```bash
pnpm build          # Expected: Build succeeds, zero errors
pnpm test           # Expected: All tests pass
pnpm lint           # Expected: Zero warnings
pnpm type-check     # Expected: tsc --noEmit passes
```

### Final Checklist
- [ ] All "Must Have" items implemented and verified
- [ ] All "Must NOT Have" items absent from codebase
- [ ] All tests pass (`vitest run`)
- [ ] Build succeeds (`next build`)
- [ ] Lint passes (`eslint .`)
- [ ] Type check passes (`tsc --noEmit`)
- [ ] Authentication works with GitHub OAuth
- [ ] Posts CRUD works end-to-end
- [ ] Pages CRUD works end-to-end
- [ ] Image upload and management works
- [ ] Branch+PR workflow creates valid PR
- [ ] Direct-to-main triggers deploy
- [ ] Dashboard displays correct statistics
- [ ] SEO preview renders correctly
- [ ] All pages pass WCAG 2.1 AA contrast ratios
- [ ] Lighthouse accessibility ≥ 90
