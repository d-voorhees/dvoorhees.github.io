# Changelog

## 2026-07-24

- Fixed stale category data: `_data/categories.yml` had a `deployment` category with a post count left over from a post that no longer references it, and `github projects` was undercounted. Ran `update_categories.rb` to resync counts against actual post front matter, which also pruned the now-empty `deployment` category.
- Added a tracked `pre-commit` git hook (`.githooks/pre-commit`) that runs `update_categories.rb` and stages the result automatically before every commit. GitHub Pages' default build only runs `jekyll build` — it does not execute the Rakefile or custom Ruby scripts — so `_data/categories.yml` could previously drift out of date in production even though `rake build` handled it locally. The hook is committed to the repo (git ignores `.git/hooks/` by design) and activated via `git config core.hooksPath .githooks`.
- Updated category colors: `github projects` → `#129b69`, `product development` → `#1d6d50`.
