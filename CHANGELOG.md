# Changelog

## 2026-07-29

- Added `github_url` front matter support: posts that link to a GitHub project now show a "GitHub project discussed in this post" callout in the header. Extracted the real repo links from body text and added the front matter field to the 7 posts that link to one.
- Fixed a regression where removing the old GitHub icon font also broke the dark/light theme toggle's sun/moon icons, since both shared the same icon stylesheet; restored the stylesheet and moved the site's own GitHub icon usages over to inline Octicons SVGs instead.
- Fixed the "More writing about [category]" section on post pages: posts shared across multiple of the current post's categories no longer show up multiple times, and categories with no unique posts left to list no longer render an empty heading.
- Various CSS style updates (badge styling, footer spacing, category colors, clap button dark-mode icon color).

## 2026-07-24

- Fixed stale category data: `_data/categories.yml` had a `deployment` category with a post count left over from a post that no longer references it, and `github projects` was undercounted. Ran `update_categories.rb` to resync counts against actual post front matter, which also pruned the now-empty `deployment` category.
- Added a tracked `pre-commit` git hook (`.githooks/pre-commit`) that runs `update_categories.rb` and stages the result automatically before every commit. GitHub Pages' default build only runs `jekyll build` — it does not execute the Rakefile or custom Ruby scripts — so `_data/categories.yml` could previously drift out of date in production even though `rake build` handled it locally. The hook is committed to the repo (git ignores `.git/hooks/` by design) and activated via `git config core.hooksPath .githooks`.
- Updated category colors: `github projects` → `#129b69`, `product development` → `#1d6d50`.
