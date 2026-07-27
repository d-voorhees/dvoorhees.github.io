---
date: 2024-12-13
layout: post
title: "Automatically Write Categories to the Data File in Jekyll"
introduction: "Tired of manually adding new categories to a YAML file every time you have a radically new idea begetting a new category? Here's your solution."
seo_title: "Automatically Write Categories to the Data File in Jekyll"
seo_description: "Tired of manually writing new categories to Jekyll every time you have a radically new idea requiring a new category? Look no further."
seo_image: "/assets/images/blog-post-image.jpg"
categories: [jekyll, ruby, tutorials]
---

## Writing new Jekyll categories to data files

If a Jekyll theme displays content by category, something usually has to maintain a list of every category the site uses, often in a `_data/categories.yml` file with color assignments or other metadata attached. Jekyll does not update that file for you. Add a new category to a post's front matter and the data file just does not know about it until someone edits it by hand.

This gets tedious fast if you write across a lot of different topics, so instead of adding each new category to the YAML file manually, this Ruby script scans every post, pulls out the categories in use, and writes the results to `_data/categories.yml` for you.

### Solution: Use a Ruby Script to Extract Categories

1. **Add categories in front matter.**
    Every post needs a `categories` field in its front matter, in brackets, separated by commas:

   <pre><code>---
   layout: post
   title: "Sample Post"
   categories: [Tech, Jekyll, Developer Portfolios]
   ---</code></pre>

2. **Create a script to extract categories.**
    This script parses every post, extracts its categories, and writes them into a YAML file in the `_data` folder. It also tracks a `color` field per category, since this is written for the "dev herald" theme (free on GitHub), which assigns each category a color. If your theme does not use category colors, the `color` key will just sit unused; it will not break anything.

```
require 'yaml'
require 'date'

posts_dir = "_posts"
data_file = "_data/categories.yml"

# Load existing categories from the YAML file
existing_categories = if File.exist?(data_file)
                        YAML.load_file(data_file) || []
                      else
                        []
                      end

# Convert the existing categories array to a hash for easier merging
existing_categories_hash = existing_categories.each_with_object({}) do |category, hash|
  hash[category['name']] = category
end

# Collect categories from posts and count occurrences
new_categories = {}
category_counts = Hash.new(0)

Dir.glob("#{posts_dir}/**/*.md").each do |file|
  front_matter = File.read(file).match(/---\s*\n(.*?)\n---/m)
  next unless front_matter

  data = YAML.safe_load(front_matter, permitted_classes: [Date])
  next unless data['categories']

  categories_list = data['categories']
  categories_list = [categories_list] if categories_list.is_a?(String)

  categories_list.each do |category|
    new_categories[category] ||= { 'name' => category }
    category_counts[category] += 1
  end
end

# Merge new categories into the existing ones, preserving color information
merged_categories = existing_categories_hash.merge(new_categories) do |_key, old_val, new_val|
  old_val.merge(new_val)
end

# Update posts_count for each category
merged_categories.each do |name, category|
  category['posts_count'] = category_counts[name]
  category['color'] ||= '' # Ensure color key exists, set to empty string if not present
end

# Convert merged hash back to an array for YAML output
merged_categories_array = merged_categories.values

# Write results to the _data/categories.yml file
File.open(data_file, "w") { |f| f.write(merged_categories_array.to_yaml) }

puts "Categories written to #{data_file}"
```

A few things worth knowing about how this behaves before you rely on it:

- The regex-based front matter parser expects clean YAML between two `---` lines. A post with malformed front matter gets silently skipped, not flagged, so a typo in a post's front matter means that post's categories just never make it into the data file.
- The merge step preserves any `color` you have manually set on an existing category and updates its `posts_count`, so this is not a full overwrite of your color scheme each run. It does rewrite the entire file on every run, and it does not remove a category that no longer appears on any post, so your category list will only ever grow unless you prune it by hand.
- On a large site, this script re-reads every post file on every build, which is fine at a few hundred posts and worth watching if that number gets much larger.

### Automatically run this script when compiling Jekyll

To run this automatically on every build, add a Rakefile at the root of your Jekyll project:

<pre><code>touch Rakefile</code></pre>

Open it in your editor and add:

<pre><code>task :default => :build

task :build do
  puts 'Extracting categories...'
  ruby 'update_categories.rb'
  puts 'Building Jekyll site...'
  system 'bundle exec jekyll build'
end</code></pre>

From then on, build the site with:

<pre><code>bundle exec rake build
</code></pre>

instead of a plain `jekyll build`. This runs the category extraction script first, then builds the site, so `_data/categories.yml` is always current before Jekyll reads it. The tradeoff is that `rake build` is now a required step. A teammate who runs `jekyll build` directly, out of habit, will get a site built against a stale categories file.

## Displaying these categories

**On post pages, with colors:**
{% raw %}

<pre><code>{% assign post_categories = page.categories %}
{% for category in post_categories %}
    {% assign category_info = site.data.categories | where: "name", category | first %}
    {% if category_info %}
        {% assign category_color = category_info.color | default: "#cccccc" %}
&lt;div class="square" style="background-color: {{ category_color }}; border-radius: 15px; display: inline-block;"&gt;&lt;/div&gt;
&lt;a href="/categories/?category={{ category | slugify }}" class="category-link"&gt;
    {{ category | capitalize }}
&lt;/a&gt;
    {% endif %}
{% endfor %}</code></pre>

{% endraw %}

**Sorted by post count, most to least:**
{% raw %}

<pre><code>{% assign sorted_categories = site.data.categories | sort: "posts_count" | reverse %}
{% for category in sorted_categories %}
    &lt;div class="category-item"&gt;
        &lt;div class="square" style="background-color: {{ category.color | default: '#cccccc' }};"&gt;&lt;/div&gt;
        &lt;a href="/categories/?category={{ category.name | slugify }}" class="category-link"&gt;
            {{ category.name | capitalize }}
        &lt;/a&gt;
    &lt;/div&gt;
{% endfor %}
</code></pre>

{% endraw %}

Run the extraction script whenever you add a post with a new category. Everything downstream, the colored squares, the sorted category list, reads from that one data file, so keeping it current is the only maintenance this setup actually needs.
