---
date: 2024-12-13
layout: post
title: "Automatically Write Categories to the Data File in Jekyll"
introduction: "Tired of manually adding new categories to a YAML file every time you have a radically new idea begetting a new category? Here's your solution."
seo\_title: "Automatically Write Categories to the Data File in Jekyll"
seo\_description: "Tired of manually writing new categories to Jekyll every time you have a radically new idea requiring a new category? Look no further."
seo\_image: "/assets/images/blog-post-image.jpg"
categories: [jekyll, ruby, tutorials, automagic]
---
## Writing new Jekyll categories to data files

Have a lot of ideas across different realms of expertise? To paraphrase Whitman, we all contain multitudes. 

However in some Jekyll themes where categories are managed in order to display content by category, categories must be entered manually in category data file, as Jekyll does not have a built-in functionality to dynamically update this file. 

Enter the custom Ruby script to solve your woes. 

### Solution: Use a Ruby Script to Extract Categories

1. **Add Categories in Front Matter**  
	   Ensure each post includes the `categories` field in its front matter in brackets, separated by commas. For example:

   <pre><code>---
   layout: post
   title: "Sample Post"
   categories: [Tech, Jekyll, Developer Portfolios]
   ---</code></pre>

2. **Create a Script to Extract Categories**  
	   Write a Ruby script to parse all posts, extract their categories, and write them into a YAML file in the `_data` folder. In this example we're also including a color variable for the category, as it is written for the 'dev herald' theme which this site is using (and is available to you free on Github), and the theme uses color assignments with each category. If you don't need that don't worry, this won't trip you up.

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



## Automatically run this script when compiling Jekyll

To run this file automatically when you compile Jekyll, you'll need to create a Rakefile, a Ruby script that defines tasks and dependencies for automating various aspects of software development and project management. 

1.  **Navigate to your Jekyll project's root directory in the terminal.**
	cd
2.  **Create a new file named "Rakefile" (with no file extension):**
	bash
	<pre><code>touch Rakefile
	</code></pre>

3. **Open the Rakefile in your text editor**
	   and add the following content:
	<pre><code>task :default => :build

	task :build do
	  puts 'Extracting categories...'
	  ruby 'update_categories.rb'
	  puts 'Building Jekyll site...'
	  system 'bundle exec jekyll build'
	end</code></pre>

4.  **Save the Rakefile.**

5.  **To build your Jekyll site and run the category extraction script,** use the following command instead of jekyll build:
	<pre><code>bundle exec rake build
	</code></pre>

This setup will:
- Extract categories from your posts
- Count the number of posts in a category
- Update the `_data/categories.yml` file
- Build your Jekyll site

The Rakefile acts as a coordinator, running your custom Ruby script before initiating the Jekyll build process. This method integrates smoothly with Jekyll without requiring plugins or complex setups.

This approach ensures that your `_data/categories.yml` file stays up-to-date with all categories used across your posts. Run the script whenever you add or update posts with new categories. Running the script will overwrite the existing categories.yml page. 

## Displaying these categories

**On post pages, with colors**
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



**In a loop, linking to the category page, sorting list by most # posts in a category to least # posts in a category**
{% raw %}
<pre><code>{% assign sorted_categories = site.data.categories | sort: &#x22;posts_count&#x22; | reverse %}
{% for category in sorted_categories %}
    &#x3C;div class=&#x22;category-item&#x22;&#x3E;
        &#x3C;div class=&#x22;square&#x22; style=&#x22;background-color: {{ category.color | default: &#x27;#cccccc&#x27; }};&#x22;&#x3E;&#x3C;/div&#x3E;
        &#x3C;a href=&#x22;/categories/?category={{ category.name | slugify }}&#x22; class=&#x22;category-link&#x22;&#x3E;
            {{ category.name | capitalize }}
        &#x3C;/a&#x3E;
    &#x3C;/div&#x3E;
{% endfor %}
</code></pre>
{% endraw %}
