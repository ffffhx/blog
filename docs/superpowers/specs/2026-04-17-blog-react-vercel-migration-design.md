# Blog React Vercel Migration Design

**Date:** 2026-04-17

## Goal

Rebuild the current Hexo-based blog as a hand-written React application using TypeScript, Tailwind CSS, and Vercel deployment, while preserving all existing written content and local post assets.

The migration removes theme-package and Hexo runtime dependencies from the serving path. Content remains in the repository as Markdown files, but rendering, routing, styling, and page composition move to a custom React implementation.

## Scope

Included:

- Replace Hexo theme rendering with a custom React application
- Use TypeScript for application and content-pipeline code
- Use Tailwind CSS for styling
- Deploy on Vercel
- Preserve all existing post and page content
- Preserve current post metadata fields: `title`, `date`, `categories`, `tags`, `excerpt`
- Preserve Markdown rendering, code blocks, blockquotes, tables, lists, and local images
- Preserve support for Hexo-style `{% asset_img ... %}` tags by translating them during content compilation
- Preserve article TOC behavior in a React-native implementation

Excluded from the first migration:

- Keeping old Hexo URL structure
- Tag index pages
- Comments, search backends, analytics backends, RSS, or admin/editor tooling
- Dynamic server features beyond what Vercel already supports

## Constraints

- Existing content files should stay in `source/_posts` and `source/about`
- The new app should not depend on the `hexo-theme-landscape` package or Hexo rendering pipeline
- The new site should be suitable for Vercel Hobby deployment for a personal, non-commercial blog
- The implementation should optimize for future React-based feature expansion

## Chosen Approach

Use a Next.js App Router application as the new site shell and build a local content compilation layer that reads Markdown files directly from the repository.

This approach was chosen over a Vite + custom prerender setup because:

- Vercel supports Next.js directly with less deployment glue
- App Router gives a clean route model for page composition and future expansion
- Static and server-enhanced rendering options remain available later without another rewrite
- Metadata, 404 handling, and route generation fit a blog use case better than a fully custom prerender pipeline

## Architecture

The new system has four main layers.

### 1. App Routing Layer

Next.js App Router pages handle the site entry points:

- `/`
- `/about`
- `/category/[slug]`
- `/post/[slug]`
- not-found page

These routes are responsible only for request-to-page composition. They should not own Markdown parsing logic.

### 2. Content Compilation Layer

`lib/content` will read raw Markdown from the repository and produce typed content objects used by the route layer.

Responsibilities:

- Discover post files in `source/_posts`
- Read `source/about/index.md`
- Parse front matter
- Generate stable slugs
- Parse Markdown into React-renderable structures
- Translate `{% asset_img file.ext %}` to a renderable image node bound to the current post asset directory
- Extract heading data for TOC generation
- Build category aggregations

The content layer is the replacement for the old Hexo data and filter pipeline.

### 3. React Component Layer

`components/` will contain hand-written site UI primitives and page sections, including:

- site shell
- header and navigation
- post list cards
- article renderer wrappers
- TOC sidebar
- category badges and metadata rows
- empty-state and not-found views

The component layer should stay independent from file-system concerns. It renders typed data only.

### 4. Static Assets Layer

Global assets such as banner and favicon should live in the Next.js static asset path. Local post asset images must remain accessible through stable paths generated from each post source directory.

The migration should normalize post asset delivery so the React renderer can refer to them consistently without relying on Hexo asset helpers at runtime.

## Route Model

The route structure is intentionally more React-native than the current Hexo permalink structure.

- Home page: `/`
- About page: `/about`
- Category pages: `/category/tech`, `/category/fitness`
- Post pages: `/post/[slug]`

Category slug mapping is explicit instead of inferred from display text:

- `技术` -> `tech`
- `健身` -> `fitness`

Post slugs should be generated from the source filename and normalized into stable, URL-safe identifiers. The goal is readability and stability, not continuity with the previous Hexo URLs.

## Content Compatibility

The migration must support the current content corpus as-is.

### Front Matter

Supported keys:

- `title`
- `date`
- `categories`
- `tags`
- `excerpt`

Missing optional fields should degrade gracefully.

### Markdown Features

Required support:

- headings
- paragraphs
- emphasis and strong text
- ordered and unordered lists
- blockquotes
- fenced code blocks
- inline code
- links
- tables
- standard Markdown images

### Hexo Asset Tags

Current content contains many `{% asset_img ... %}` tags. These must be translated during preprocessing rather than editing source articles.

Design choice:

- detect the tag in raw content
- resolve the referenced file relative to the current article asset directory
- emit a normalized image node or equivalent Markdown replacement before final rendering

This keeps the source content unchanged while removing Hexo from the runtime.

## TOC and Article Rendering

The current blog has an article TOC with conditional rendering. The React version should preserve the behavior in product terms, not implementation terms.

Requirements:

- build TOC from headings `h2` through `h4`
- only render TOC when heading count reaches a configured threshold
- keep the TOC as a React component, not an injected HTML mutation
- support active-section highlighting on the client

The article body renderer and TOC should share heading metadata from the content layer so there is one source of truth.

## Styling Direction

The site should be fully styled with Tailwind CSS. No theme package CSS should remain on the critical path.

Visual direction:

- clean but intentional editorial feel
- strong typography hierarchy
- cards and spacing tuned for long-form reading
- responsive layout that works on desktop and mobile
- custom prose styling for Markdown content

The migration is a code rewrite, not a content rewrite. The styling should improve consistency without changing article meaning.

## Testing Strategy

This migration changes rendering infrastructure, so tests should focus on the content pipeline and route-critical behaviors.

Minimum required coverage:

- front matter parsing
- post discovery and sorting
- category aggregation
- slug generation
- `{% asset_img %}` translation
- heading extraction for TOC
- about page content loading

Build verification must include a production build for the new app.

## Deployment Strategy

The old GitHub Pages workflow should be replaced with Vercel-oriented scripts and documentation.

The repository should become deployable as a standard Vercel project:

- install dependencies
- build Next.js app
- deploy through Vercel Git integration

The codebase should not require Hexo generation steps after the migration.

## Risks and Mitigations

### Risk: Content regression from Hexo-specific syntax

Mitigation:

- add focused tests for the asset tag transformation
- verify rendered output on representative posts from both technical and fitness categories

### Risk: Asset path breakage

Mitigation:

- centralize post asset URL generation
- avoid ad-hoc string manipulation in page components

### Risk: Over-scoping the first migration

Mitigation:

- do not implement tag index pages or extra product features in the first pass
- prioritize parity for existing content and core navigation first

## Success Criteria

The migration is successful when:

- the site runs as a TypeScript + React + Tailwind application
- Hexo theme rendering is removed from the served site
- all current posts and the about page render correctly
- `{% asset_img %}` content still displays correctly
- category pages and article pages work
- TOC works on long posts
- the project builds successfully for Vercel deployment
