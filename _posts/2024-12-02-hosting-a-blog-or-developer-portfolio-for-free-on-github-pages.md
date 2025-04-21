---
date: 2024-12-02
layout: post
title: "The benefits of hosting a blog or developer portfolio on GitHub Pages, and how can you do it"
introduction: "Using Jekyll and markdown, you can host your blog or developer portfolio on GitHub pages."
seo_title: "How to host a blog for free on GitHub"
seo_description: "Using Jekyll and markdown, you can host your blog on GitHub pages."
categories: [github, jekyll, "developer portfolios"]
---

# Free Hosting on GitHub: Putting your code blog up on GitHub Pages

For developers seeking a reliable and cost-effective hosting solution for their personal portfolio or writings, GitHub Pages is an excellent choice. Not only does it offer free hosting with generous bandwidth, but it also integrates seamlessly with Git's version control system, making it easy to manage and deploy your content.

GitHub Pages works like a publishing system built on Git's version control. GitHub Pages handles server maintenance and updates. Push your changes to Git, and your content deploys automatically with SSL certificates and optimized performance. The security is airtight because it's simple: static content means no databases to inject or server-side code to exploit. It's pure content delivery.

It pairs static site delivery with tools like Jekyll for site generation. Content creation becomes straightforward – write in Markdown, and your files transform into web pages. The connection between writing and deployment is seamless.

Below, I’ll walk you through the process of setting up your GitHub Pages site using both the web interface and command line methods.

## Why Choose GitHub Pages?

1. **SEO Benefits**: Your content lives on the github.io domain (or your custom domain), benefiting from GitHub's high domain authority. This can significantly enhance your site's visibility in search engine results. Additionally, you can use your custom domain while maintaining these SEO benefits, and you have full control over meta tags, schemas, and other SEO elements.

2. **Version Control**: Built on Git, GitHub Pages allows you to manage changes to your content easily. This means you can track updates, collaborate with others, and revert to previous versions if needed.

3. **Automatic Deployment**: Once you push changes to Git, your content deploys automatically with SSL certificates, ensuring secure and optimized performance. This streamlined process saves you time and effort.

4. **Security**: Since GitHub Pages hosts static content, there are no databases to inject or server-side code to exploit, making it a secure hosting option.

5. **Clean Design**: GitHub Pages pairs well with tools like Jekyll for site generation. You can write in Markdown, and your files transform into web pages seamlessly.

6. **Technical Showcase**: Your repositories on GitHub serve as a portfolio, showcasing your development skills to potential employers. Public code repositories tell the story of your work and demonstrate your capabilities.

7. **Cost-Effective**: With free hosting and no hidden fees, GitHub Pages offers enterprise features at zero cost, powered by GitHub's infrastructure and static hosting model.

## Setting Up Your GitHub Pages Site

### Using Web Interface and Desktop Tools

#### Step 1: Setting Up Your Repository

1. **Sign Up for GitHub**: If you haven't already, go to [github.com](https://github.com) and create an account.
2. **Create a New Repository**:
   - Once logged in, click the "+" icon in the top right corner and choose "New repository."
   - Name your repository exactly as `yourusername.github.io`, replacing "yourusername" with your actual GitHub username.
   - Ensure it's set to "Public."
   - Check the box that says "Add a README file."
   - Click "Create repository."

#### Step 2: Installing GitHub Desktop

1. **Download GitHub Desktop**: Visit [desktop.github.com](https://desktop.github.com) and download the application.
2. **Install and Set Up**:
   - Install GitHub Desktop on your computer.
   - When you first open it, sign in with your GitHub account.
   - It will ask if you want to clone any repositories; say yes and choose the `yourusername.github.io` repository you just created.

#### Step 3: Installing Ruby and Jekyll

1. **Install Ruby**:
   - For Windows, go to [rubyinstaller.org](https://rubyinstaller.org) and download the Ruby installer with Devkit.
   - For Mac, Ruby usually comes pre-installed, but you can check if you need to update it.
2. **Install Jekyll**:
   - Once Ruby is installed, open "Start Command Prompt with Ruby" from your Start menu (Windows).
   - In that window, type: `gem install jekyll bundler`
   - Close this window when it's done; you won't need to use the command line again.

#### Step 4: Creating Your Blog Using Jekyll

1. **Open Repository Folder**:
   - In GitHub Desktop, click "Show in Explorer" (Windows) or "Show in Finder" (Mac) to open your repository folder.
2. **Download a Jekyll Theme**:
   - Visit [jekyllthemes.io](https://jekyllthemes.io) and download a pre-made theme. The "minima" theme is a good starting point.
3. **Extract Theme Files**:
   - Extract the downloaded theme files into your repository folder, replacing any existing files.

#### Step 5: Setting Up Your Blog Structure

1. **Key Files and Folders**:
   - `_config.yml`: Controls your blog settings.
   - `_posts`: Where your blog posts go.
   - `index.md`: Your homepage.
   - `about.md`: Your about page.

#### Step 6: Customizing Your Blog

1. **Edit `_config.yml`**:
   - Open `_config.yml` in any text editor (like Notepad).
   - Change these basic settings:
     ```yaml
     title: Your Blog Name
     description: What your blog is about
     author: Your Name
     ```
2. **Create Your First Post**:
   - Go to the `_posts` folder.
   - Create a new text file named: `2025-01-28-my-first-post.md` (use today's date).
   - Open it in a text editor and add:
     ```markdown
     ---
     layout: post
     title: "My First Blog Post"
     date: 2025-01-28
     ---

     Welcome to my blog! This is my first post.
     ```

#### Step 7: Publishing Your Changes

1. **Commit Changes**:
   - Go back to GitHub Desktop.
   - You'll see your changes listed.
   - At the bottom, add a short message like "Set up blog."
   - Click "Commit to main."
2. **Push to GitHub**:
   - Click "Push origin" at the top.

### Using the Command Line

#### Step 1: Setting Up Git

1. **Sign Up for GitHub**: If you haven't already, go to [github.com](https://github.com) and create an account.
2. **Install Git**:
   - Download Git from [git-scm.com](https://git-scm.com).
   - After installing, configure Git with your name and email:
     ```bash
     git config --global user.name "Your Name"
     git config --global user.email "youremail@example.com"
     ```

#### Step 2: Creating Your Repository

1. **Create a New Repository**:
   - Log into GitHub.
   - Click the "+" icon in the top right corner.
   - Select "New repository."
   - Name it exactly as `yourusername.github.io`, replacing "yourusername" with your actual GitHub username.
   - Make it public.
   - Check "Add a README file."
   - Click "Create repository."

#### Step 3: Cloning Your Repository

1. **Clone Repository**:
   - On your new repository page, click the green "Code" button.
   - Copy the HTTPS URL (looks like `https://github.com/yourusername/yourusername.github.io.git`).
   - Open your computer's terminal or command prompt.
   - Navigate to where you want to store your blog files:
     ```bash
     cd Documents # or wherever you prefer
     ```
   - Clone the repository:
     ```bash
     git clone https://github.com/yourusername/yourusername.github.io.git
     ```

#### Step 4: Installing Jekyll

1. **Install Ruby**:
   - Visit [ruby-lang.org](https://www.ruby-lang.org/en/downloads/) to download Ruby.
   - Once Ruby is installed, open your terminal and install Jekyll:
     ```bash
     gem install bundler jekyll
     ```

#### Step 5: Creating Your Blog

1. **Create a New Jekyll Site**:

   - Navigate into your repository folder:
     ```bash
     cd yourusername.github.io
     ```
   - Create a new Jekyll site in this directory:
     ```bash
     jekyll new . --force
     ```

2. **Test Locally**:
   - Start a local server to view your blog:
     ```bash
     bundle exec jekyll serve
     ```
   - You can view your blog at `http://localhost:4000`.

#### Step 6: Pushing to GitHub

1. **Commit and Push Changes**:
   - Add all files:
     ```bash
     git add .
     ```
   - Commit with a message:
     ```bash
     git commit -m "Initial blog setup"
     ```
   - Push to GitHub:
     ```bash
     git push origin main
     ```

## Enabling GitHub Pages

1. **Navigate to Repository Settings**:

   - Go back to your repository on GitHub.
   - Click "Settings."

2. **Configure GitHub Pages**:
   - Scroll down to "Pages" in the left sidebar.
   - Under "Source", select "Deploy from a branch."
   - Choose the "main" branch and "/ (root)" folder.
   - Click "Save."

Your blog will be accessible at `https://yourusername.github.io` within a few minutes.

## Adding New Posts

1. **Create a New Post**:

   - Create a new file in the `_posts` folder following the same naming pattern: `YYYY-MM-DD-title.md`.
   - Add your content using the same format as your first post.

2. **Commit and Push Changes**:
   - Use GitHub Desktop to commit and push your changes.

## Using Your Own Domain

You can also use your own domain name (e.g., `https://yourusername.com`) with GitHub Pages. Follow the [official documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages) to set that up.

By following these steps, you'll have a professional-looking blog or portfolio hosted for free on GitHub Pages. This platform combines the power of version control with easy content management, making it an ideal choice for developers.
