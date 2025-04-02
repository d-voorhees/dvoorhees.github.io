// Function to set the initial theme on page load
function initializeTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const navbarLogo = document.querySelector(".navbar-logo");
  const offcanvasMenu = document.getElementById("offcanvasMenu");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    body.classList.add("dark-theme");
    themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    navbarLogo.src = "/assets/img/deepdive-lt.svg";
    offcanvasMenu.classList.add("dark-theme");
  } else {
    body.classList.remove("dark-theme");
    themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    navbarLogo.src = "/assets/img/deepdive.svg";
    offcanvasMenu.classList.remove("dark-theme");
  }
}

// Function to toggle the theme
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const navbarLogo = document.querySelector(".navbar-logo");
  const offcanvasMenu = document.getElementById("offcanvasMenu");

  // Toggle the dark-theme class on the body
  body.classList.toggle("dark-theme");

  // Check if dark-theme is active and update elements accordingly
  if (body.classList.contains("dark-theme")) {
    localStorage.setItem("theme", "dark");
    themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    navbarLogo.src = "/assets/img/deepdive-lt.svg";
    offcanvasMenu.classList.add("dark-theme");
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    navbarLogo.src = "/assets/img/deepdive.svg";
    offcanvasMenu.classList.remove("dark-theme");
  }
}

// Add event listener for the theme toggle button
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme(); // Initialize theme on page load

  // Ensure the toggle button works properly
  const themeToggleButton = document.getElementById("theme-toggle");
  themeToggleButton.addEventListener("click", toggleTheme);
});
