---
date: 2024-12-02
layout: post
title: "How to Include Non-Jekyll Content in Your Jekyll Site"
introduction: "Looking to integrate non-Jekyll content into your Jekyll-powered site? Check out this quick walkthrough for embedding static files, dynamic content, and external resources without disrupting your workflow."
seo_title: "How to Include Non-Jekyll Content in Your Jekyll Site: A Complete Guide"
seo_description: "Learn how to seamlessly integrate non-Jekyll content into your Jekyll-powered site. Explore different methods for embedding static files, dynamic content, and external resources without disrupting your workflow."
seo_image: "/assets/images/blog-post-image.jpg"
categories: [jekyll, tutorials]
---

# How to Include Non-Jekyll Content in Your Jekyll Site

Jekyll is a powerful static site generator, but what if you need to include content that doesn’t fit neatly into its framework? Whether you’re embedding raw HTML files, pulling in dynamic scripts, or integrating external applications, Jekyll provides several ways to work around its limitations. In this guide, we’ll explore how to include non-Jekyll content inside your Jekyll-powered site, ensuring flexibility while maintaining the simplicity and speed that make Jekyll so popular.

So, say you wanted to host a documentation folder like `/documentation` on your Jekyll website that uses a different set of HTML independent of the Jekyll-generated pages. Here’s how you can do it:

### 1. Place your static HTML files in the correct folder

You can simply create a folder inside your Jekyll project where you want to store the documentation pages. For example:

```
/documentation/index.html
/documentation/page1.html
/documentation/page2.html

```

### 2. Avoid Jekyll processing the files

By default, Jekyll processes all files it finds in the project. To ensure that Jekyll doesn’t process the static HTML files in the `/documentation` folder, you can add an `exclude` rule in your `_config.yml` file. For example:

```yaml
exclude:
  - documentation
```

This will tell Jekyll to ignore the `/documentation` folder and all its contents when building the site. The HTML files in this folder will be served as-is, without Jekyll processing them.

### 3. Make sure the folder is accessible

Jekyll will still serve static files from any folder in the root directory (except for those you exclude), so the `/documentation` folder will be publicly accessible at the corresponding URL (`/documentation/`).

If you want to make sure the folder is correctly mapped in the final output, ensure that it exists in the root of your Jekyll project.

### 4. Use Jekyll's layout or styles if needed

If you want to integrate the static HTML pages with your existing Jekyll site (for example, using the same styles or header/footer), you can include the necessary Jekyll includes or layouts inside your static HTML files. You can use an `include` statement in the HTML, like so:

{% raw %}

```html
{% include head.html %}
```

{% endraw %}

This way, you can manually manage the content while still leveraging the Jekyll template system where necessary.

### 5. Optionally use `jekyll-static` plugin

If you want to automate the process of handling static HTML files, there’s a plugin called `jekyll-static`. It can help handle static assets in a way that fits into Jekyll’s workflow but doesn’t require manual exclusion. However, this is usually not needed for simpler setups.

### In summary, TL,DR:

- Create a `/documentation` folder.
- Add your static HTML files.
- Exclude the `/documentation` folder from Jekyll processing in `_config.yml`.
- Your static HTML will be served as-is alongside the Jekyll-generated pages.
