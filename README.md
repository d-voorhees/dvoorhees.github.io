# dvoorhees.com

A technical blog covering software architecture, integrations, and systems strategy. The site is static, built with **Jekyll**, and deployed through **GitHub Pages**. A custom Ruby/Rake pipeline handles everything Jekyll doesn't do on its own.

Jekyll and Ruby are the entire build chain. SEO, sitemap, and JSON feeds are compiled in Liquid with no plugins.

The goal was a blog that loads fast, costs nothing to host, and has zero moving parts.

## How it's built

- **Jekyll 4.4.1**, Ruby-based static site generator
- **GitHub Pages** hosting with a custom domain via `CNAME` (auto-deploys on push to `main` with no CI config needed)
- A custom **Rakefile** build task (`rake build`) that chains a Ruby preprocessing step before the Jekyll build (see [`JEKYLL_BUILD_PROCESS.md`](JEKYLL_BUILD_PROCESS.md) for the full pipeline breakdown)

## Custom-built automation

**Self-updating category system.** Categories are not maintained in a config file. [`update_categories.rb`](update_categories.rb) runs before every build, scans every post's front matter, and regenerates [`_data/categories.yml`](_data/categories.yml). It extracts categories from `categories:` front matter across all posts, auto-generates URL-safe slugs (handling `&`, `/`, punctuation, whitespace), counts posts per category, and keeps counts current. Manually-set fields like category color are preserved across regeneration through a merge instead of an overwrite. Categories with no remaining posts are pruned. The result is written as Jekyll data and consumed via `site.data.categories` in Liquid.

Adding a new category requires no manual YAML editing.

**Zero-plugin SEO layer.** [`_includes/seo-meta.html`](_includes/seo-meta.html) is a single reusable Liquid include that generates Open Graph, Twitter Card, and article metadata for every page. It uses a cascading fallback chain (page-level to site-level defaults) so posts only need to override what is different.

**Self-generating sitemap and content feed.** `sitemap.xml` and `all_content.json` are both `layout: null` Liquid templates that loop over `site.pages` / `site.posts` at build time. There is no `jekyll-sitemap` plugin and no external tooling. `all_content.json` doubles as a lightweight JSON API the frontend fetches client-side.

**Client-side category browser.** The `/categories/` page is server-rendered by Jekyll for the category list. A small vanilla-JS layer then fetches `all_content.json` and filters posts by category in the browser, using `history.pushState` so filtered views produce shareable, bookmarkable URLs without a full page reload or a JS framework.

## Other features

- Light/dark theme toggle, persisted in `localStorage`
- Custom Jekyll collections for `projects` and standalone `pages` with clean permalinks
- Claps/reactions on posts (Lyket) plus an external clap-count API integration
- No JS framework, no npm build step: vanilla JS and Bootstrap

## Local development

```bash
bundle install
rake build          # runs the category script, then jekyll build
bundle exec jekyll serve   # local dev server at localhost:4000
```

Running `bundle exec jekyll build` directly skips the category regeneration step. Use `rake build` (or just `rake`) instead. Full details are in [`JEKYLL_BUILD_PROCESS.md`](JEKYLL_BUILD_PROCESS.md).

## Deploy

Push to `main`. GitHub Pages builds and deploys automatically. There is no manual step, and `_site/` is not committed (it is gitignored and regenerated server-side on every push).