// Function to set the initial theme on page load
function initializeTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    body.classList.add("dark-theme");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    }
  } else {
    body.classList.remove("dark-theme");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    }
  }
}

// Function to toggle the theme
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");

  body.classList.toggle("dark-theme");

  if (body.classList.contains("dark-theme")) {
    localStorage.setItem("theme", "dark");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    }
  } else {
    localStorage.setItem("theme", "light");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    }
  }
}

// Run initialization when the page loads
document.addEventListener("DOMContentLoaded", initializeTheme);
