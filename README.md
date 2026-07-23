# dvoorhees.com

Source for [dvoorhees.com](https://dvoorhees.com) — a technical blog on software architecture, integrations, and systems strategy. Static site built with **Jekyll**, deployed via **GitHub Pages**, with a small custom Ruby/Rake pipeline layered on top for things Jekyll doesn't do out of the box.

No frontend framework, no build step beyond Jekyll + Ruby, no plugins required for SEO/sitemap/JSON feeds — those are hand-rolled in Liquid. The goal was a blog that's fast, cheap to host, and has zero moving parts to maintain.

## How it's built

- **Jekyll 4.4.1**, Ruby-based static site generator
- **GitHub Pages** hosting, custom domain via `CNAME` (auto-deploys on push to `main` — no CI config needed)
- Custom **Rakefile** build task (`rake build`) that chains a Ruby preprocessing step before the Jekyll build (see [`JEKYLL_BUILD_PROCESS.md`](JEKYLL_BUILD_PROCESS.md) for the full pipeline breakdown)

## Automation

**Self-updating category system.** Categories aren't hand-maintained in a config file. [`update_categories.rb`](update_categories.rb) runs before every build, scans every post's front matter, and regenerates [`_data/categories.yml`](_data/categories.yml):
- Extracts categories from `categories:` front matter across all posts
- Auto-generates URL-safe slugs (handles `&`, `/`, punctuation, whitespace)
- Counts posts per category and keeps counts current
- Preserves manually-set fields (like category color) across regeneration via a merge instead of overwrite
- Prunes categories that no longer have any posts
- Writes the result as Jekyll data, consumed via `site.data.categories` in Liquid

New category, new post — no YAML to touch by hand.

**Zero-plugin SEO layer.** [`_includes/seo-meta.html`](_includes/seo-meta.html) is a single reusable Liquid include generating Open Graph, Twitter Card, and article metadata for every page, with a cascading fallback chain (page-level → site-level defaults) so posts only need to override what's different.

**Self-generating sitemap and content feed.** `sitemap.xml` and `all_content.json` are both `layout: null` Liquid templates that loop over `site.pages` / `site.posts` at build time — no `jekyll-sitemap` plugin, no external tooling. `all_content.json` doubles as a lightweight JSON API the frontend fetches client-side.

**Client-side category browser.** The `/categories/` page is server-rendered by Jekyll for the category list, then a small vanilla-JS layer fetches `all_content.json` and filters posts by category in the browser — using `history.pushState` so filtered views are shareable, bookmarkable URLs without a full page reload or a JS framework.

## Other features

- Light/dark theme toggle, persisted in `localStorage`
- Custom Jekyll collections for `projects` and standalone `pages` with clean permalinks
- Claps/reactions on posts (Lyket) plus an external clap-count API integration
- No JS framework, no npm build step — vanilla JS + Bootstrap

## Local development

```bash
bundle install
rake build          # runs the category script, then jekyll build — the real build step
bundle exec jekyll serve   # local dev server at localhost:4000
```

Running `bundle exec jekyll build` directly skips the category regeneration step. Use `rake build` (or just `rake`) instead. Full details in [`JEKYLL_BUILD_PROCESS.md`](JEKYLL_BUILD_PROCESS.md).

## Deploy

Push to `main`. GitHub Pages builds and deploys automatically — no manual step, no `_site/` committed (it's gitignored and regenerated server-side on every push).
