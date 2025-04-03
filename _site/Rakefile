task :default => :build

 task :build do
   puts 'Extracting categories...'
   ruby 'update_categories.rb'
   puts 'Building Jekyll site...'
   system 'bundle exec jekyll build'
 end
 
