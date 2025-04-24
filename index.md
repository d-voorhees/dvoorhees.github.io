---
layout: default
title: Dev Logs - Experiments in Code, Communication & Strategy
description: A technical builder's journey through growth engineering and practical tooling. Insights on SaaS, open source, developer relations, and AI integration—from Ruby to Jekyll, with methods that scale and pitfalls to note.
seo_title: Dev Logs - Experiments in Code, Communication & Strategy
seo_description: A technical builder's journey through growth engineering and practical tooling. Insights on SaaS, open source, developer relations, and AI integration—from Ruby to Jekyll, with methods that scale and pitfalls to note.
---

<!-- Jumbotron Section -->
<section class="jumbotron bg-gray">
  <div class="container">
  <div class="col-sm-10 col-12">
    <h1 class="h1">Experiments in Code, Communication & Strategy</h1>
  </div>
  </div>
</section>

<!-- Blog Posts Section -->
<section class="container my-5">
    <div class="col-12">
        <div class="row">
          <h2 class="section-title">Writing about code and projects</h2>
        {% for post in site.posts limit:5 %}
          <div class="blog-post">
            <div class="category-list">
              {% for category in post.categories %}
                {% assign category_slug = category | downcase | replace: '&', 'and' | replace: ' ', '-' | replace: ',', '' %}
                {% assign category_info = site.data.categories | where: "slug", category_slug | first %}
                <span class="category-item">
                  <div class="square" style="background-color: {{ category_info.color | default: '#cccccc' }}; border-radius: 15px; display: inline-block; width: 15px; height: 15px; margin-right: 5px; vertical-align: middle;"></div>
                  <a href="{{ site.baseurl }}/categories/?category={{ category_slug }}" class="category-link">
                    {{ category }}
                  </a>
                </span>
              {% endfor %}
            </div>
            <div>
              <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
              <p>{{ post.introduction }}</p>
            </div>
          </div>
        {% endfor %}
        </div>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
            <a href="{{ site.baseurl }}/blog/" style="text-decoration:none;" class="more-link"><h3>more writing <i class="jam jam-arrow-right ml-4" style="vertical-align: middle;"></i></h3></a>
        </div>
    </div>
</section>
