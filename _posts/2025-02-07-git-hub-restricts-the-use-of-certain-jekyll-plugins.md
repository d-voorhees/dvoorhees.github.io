---
date: 2025-02-07
layout: post
title: "Allowed Jekyll Plugins on GitHub Pages: What You Can Use  "
introduction: "GitHub restricts the use of certain Jekyll plugins for security and performance reasons. Discover which Jekyll plugins are allowed on GitHub Pages, why some are restricted, and how to optimize your site within GitHub’s approved plugin list for security and performance."
seo_title: "Allowed Jekyll Plugins on GitHub Pages: What You Can Use  "
seo_description: "GitHub restricts the use of certain Jekyll plugins for security and performance reasons. Discover which Jekyll plugins are allowed on GitHub Pages, why some are restricted, and how to optimize your site within GitHub’s approved plugin list for security and performance."

categories: ["github", "jekyll"]
---

# Allowed Jekyll Plugins on GitHub Pages: What You Can Use

GitHub restricts the use of certain Jekyll plugins for security and performance reasons. When GitHub Pages builds a site, it runs in a controlled environment where allowing arbitrary plugins could introduce vulnerabilities, such as executing unsafe code, exposing sensitive data, or enabling unauthorized access to system resources. Additionally, some plugins can significantly slow down the build process or require external dependencies that GitHub's infrastructure does not support. To maintain a stable, secure, and efficient hosting environment, GitHub limits the plugins to a predefined set that it has vetted for safety and compatibility.

The deciding criteria for which Jekyll plugins are allowed primarily revolve around security, performance, and maintainability. Allowed plugins must be safe to run in a multi-tenant environment without exposing security risks. They should not require external services or dependencies that could complicate or slow down the build process. Additionally, GitHub favors plugins that provide widely useful functionality, such as syntax highlighting, pagination, and metadata management, while avoiding those that introduce unnecessary complexity or unpredictability. If a plugin meets these standards and aligns with GitHub Pages' goals of simplicity and reliability, it may be included in the approved list.

GitHub Pages supports a curated list of Jekyll plugins that are included in the `github-pages` gem, which ensures compatibility and security. Here's a breakdown of the key details:

### Supported Plugins

GitHub Pages automatically installs these plugins when using the `github-pages` gem:

- **Core plugins**:`jekyll` (v3.9.x), `jekyll-sass-converter`, `kramdown`, `liquid`, `rouge`, and `jekyll-commonmark-ghpages`.
- **Commonly used whitelisted plugins**:
  - `jekyll-feed` (RSS feed generation)
  - `jekyll-redirect-from` (URL redirection)
  - `jemoji` (GitHub-style emoji support)
  - `jekyll-seo-tag` (SEO metadata)
  - `jekyll-paginate` (pagination.

### Restrictions

- GitHub Pages only supports specific plugin versions tied to the `github-pages` gem. For example, as of 2025, Jekyll 4+ is **not natively supported**—GitHub Pages still uses Jekyll 3.9.x.
- Custom/third-party plugins (e.g., `jekyll-scholar`, `jekyll-admin`) are **not allowed** unless you use workarounds.

### Workarounds for Unsupported Plugins

1. **GitHub Actions**:
   Use a custom GitHub Actions workflow to build your site locally with any plugins and deploy the static `_site` output to GitHub Pages
2. **CloudCannon Outputs**:
   Build the site externally (e.g., via CloudCannon) and push the pre-rendered files to the `gh-pages` branch.
3. **Local Builds**:
   Generate the site locally with unsupported plugins and manually push the `_site` directory to GitHub.

### Configuration Tips

- Specify plugins in your `_config.yml` under `plugins:` or `gems:`.
- Use a `Gemfile` to lock versions (though `Gemfile.lock` is ignored by GitHub Pages).
- For Markdown, GitHub Pages defaults to `kramdown`, but you can use `commonmark` via `jekyll-commonmark-ghpages`.

For the latest supported versions, see [GitHub Pages Dependency Versions](https://pages.github.com/versions/).
