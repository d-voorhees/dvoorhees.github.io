---
date: 2025-02-07
layout: post
title: "Allowed Jekyll Plugins on GitHub Pages: What You Can Use"
introduction: "GitHub restricts the use of certain Jekyll plugins for security and performance reasons. Discover which Jekyll plugins are allowed on GitHub Pages, why some are restricted, and how to work within GitHub's approved plugin list for security and performance."
seo_title: "Allowed Jekyll Plugins on GitHub Pages: What You Can Use"
seo_description: "GitHub restricts the use of certain Jekyll plugins for security and performance reasons. Discover which Jekyll plugins are allowed on GitHub Pages, why some are restricted, and how to work within GitHub's approved plugin list for security and performance."

categories: ["github projects", "jekyll"]
---

# Allowed Jekyll Plugins on GitHub Pages: What You Can Use

Jekyll plugins run as Ruby code during the build itself, which means a plugin executes with the same permissions as the build process on GitHub's shared infrastructure. That is the reason GitHub Pages only allows a fixed list of plugins rather than anything installable through a Gemfile. In a shared build environment (what's usually called "multi-tenant," meaning many users' sites build on the same infrastructure), an unvetted plugin could reach outside the site being built, since it runs with the same file and network access as the build process itself. A plugin that also makes an external network call during the build, or that takes an unpredictable amount of time to run, slows down every other build sharing that infrastructure, not just yours.

A plugin gets added to the approved list when it does not need external services during the build, when it cannot reach anything outside the site being built, and when its build time stays predictable regardless of site size. `jekyll-feed` and `jekyll-seo-tag` qualify because they only read data already present in the site and write it back out as markup. A plugin like `jekyll-scholar`, by contrast, expects a bibliography file and citation-processing logic that goes well beyond reading what is already there, which is part of why it is not on the approved list.

### Supported Plugins

GitHub Pages installs these automatically through the `github-pages` gem:

- **Core plugins**: `jekyll` (v3.9.x), `jekyll-sass-converter`, `kramdown`, `liquid`, `rouge`, `jekyll-commonmark-ghpages`
- **Commonly used plugins on the approved list**:
  - `jekyll-feed` (RSS feed generation)
  - `jekyll-redirect-from` (URL redirection)
  - `jemoji` (GitHub-style emoji support)
  - `jekyll-seo-tag` (SEO metadata)
  - `jekyll-paginate` (pagination)

### Restrictions

GitHub Pages ties its supported plugins to specific versions inside the `github-pages` gem. As of 2025, that means Jekyll 4+ is not supported. GitHub Pages still builds on Jekyll 3.9.x, so any plugin or syntax that depends on Jekyll 4 features will fail silently or throw a build error. Custom and third-party plugins outside the approved list, such as `jekyll-scholar` or `jekyll-admin`, are not allowed on a standard GitHub Pages build. Getting them to work requires one of the workarounds below.

### Workarounds for Unsupported Plugins

1. **GitHub Actions**: Build the site yourself in a custom GitHub Actions workflow, with any plugins you want, then deploy the resulting `_site` output to GitHub Pages. This gets you full plugin freedom, but it also means you now own and maintain a build pipeline instead of relying on GitHub's default one, and a broken workflow file will block every future deploy until you fix it.
2. **CloudCannon**: Build the site externally through CloudCannon and push the pre-rendered files to the `gh-pages` branch. This requires a CloudCannon account and adds a third-party service as a dependency of your publishing process.
3. **Local builds**: Generate the site on your own machine with unsupported plugins, then manually push the `_site` directory to GitHub. This is the simplest option to set up, and the easiest one to get wrong: it is entirely possible to edit source files, forget to rebuild, and push a `_site` directory that no longer matches your source, with nothing in the workflow to catch that drift.

### Configuration Tips

- Specify plugins under `plugins:` (or the older `gems:` key) in `_config.yml`.
- A `Gemfile` can lock plugin versions locally, though GitHub Pages ignores `Gemfile.lock` on its own builds, so version locking only helps your local development environment, not the actual deployed build.
- GitHub Pages defaults to `kramdown` for Markdown. Use `jekyll-commonmark-ghpages` if you need CommonMark instead.

For the current supported versions, see [GitHub Pages Dependency Versions](https://pages.github.com/versions/).
