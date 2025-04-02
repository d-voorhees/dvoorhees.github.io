// Function to set the initial theme on page load
function initializeTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const navbarLogo = document.querySelector(".navbar-logo");
  const offcanvasMenu = document.getElementById("offcanvasMenu");
  const savedTheme = localStorage.getItem("theme");

  // Apply saved theme or default to light
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

  // Toggle dark-theme class on body and other elements
  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    localStorage.setItem("theme", "light");
    themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    navbarLogo.src = "/assets/img/deepdive.svg";
    offcanvasMenu.classList.remove("dark-theme");
  } else {
    body.classList.add("dark-theme");
    localStorage.setItem("theme", "dark");
    themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    navbarLogo.src = "/assets/img/deepdive-lt.svg";
    offcanvasMenu.classList.add("dark-theme");
  }
}

// Add event listener for the theme toggle button
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme(); // Initialize theme on page load

  const themeToggleButton = document.getElementById("theme-toggle");
  themeToggleButton.addEventListener("click", toggleTheme);
});
