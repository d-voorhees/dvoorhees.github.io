require 'yaml'
require 'date'

def remove_empty_categories(categories_hash, counts_hash)
  categories_hash.each do |key, category|
    if counts_hash[key].nil? || counts_hash[key] == 0
      categories_hash.delete(key)
    end
  end
end

posts_dir = "_posts"
data_file = "_data/categories.yml"

existing_categories = File.exist?(data_file) ? YAML.load_file(data_file) : []
existing_categories_hash = existing_categories.each_with_object({}) do |category, hash|
  hash[category['name'].downcase] = category
end

new_categories = {}
category_counts = Hash.new(0)

Dir.glob("#{posts_dir}/**/*.md").each do |file|
  front_matter = File.read(file).match(/---\s*\n(.*?)\n---/m)
  next unless front_matter

  data = YAML.safe_load(front_matter[1], permitted_classes: [Date])
  next unless data['categories']

  categories_list = Array(data['categories'])

  categories_list.each do |category|
    category_key = category.downcase
    
    new_categories[category_key] ||= { 
      'name' => category,
      'slug' => category.downcase.gsub(/&/, 'and')
                        .gsub('/', '-')  # Replace '/' with '-' in slug
                        .gsub(/[^a-z0-9\s-]/, '')
                        .squeeze(' ')
                        .tr(' ', '-')
    }
    
    category_counts[category_key] += 1
  end
end

merged_categories = existing_categories_hash.merge(new_categories) do |key, old_val, new_val|
  old_val.merge(new_val) { |k, old_v, new_v| k == 'slug' ? (old_v || new_v) : new_v }
end

merged_categories.each do |key, category|
  category['posts_count'] = category_counts[key]
  category['color'] ||= ''
  
  unless category.key?('slug')
    category['slug'] = category['name'].downcase.gsub(/&/, 'and')
                                  .gsub('/', '-')  # Replace '/' with '-' in slug
                                  .gsub(/[^a-z0-9\s-]/, '')
                                  .squeeze(' ')
                                  .tr(' ', '-')
  end
end

remove_empty_categories(merged_categories, category_counts)

# Proper YAML escaping with special characters
merged_categories_array = merged_categories.values.sort_by { |c| c['name'] }
yaml_output = merged_categories_array.to_yaml.gsub(/\\\'/, "'")  # Fix single quote escaping

File.write(data_file, yaml_output)

puts "Categories successfully written to #{data_file}"
