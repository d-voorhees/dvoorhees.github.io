// Function to set the initial theme on page load
function initializeTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleTwo = document.getElementById("theme-toggle-two");
  const logo = document.getElementById("main-logo");
  const savedTheme = localStorage.getItem("theme");
  const offcanvasMenu = document.getElementById("offcanvasMenu");

  if (savedTheme === "dark") {
    body.classList.add("dark-theme");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    }

    if (themeToggleTwo) {
      themeToggleTwo.innerHTML = '<i class="jam jam-moon"></i>';
    }

    if (logo) {
      logo.src = "/assets/img/deepdive-lt.svg";
    }

    // Update all logos with navbar-logo class
    document.querySelectorAll("img.navbar-logo").forEach((img) => {
      img.src = "/assets/img/deepdive-lt.svg";
    });

    if (offcanvasMenu) {
      offcanvasMenu.classList.add("dark-theme");
    }
  } else {
    body.classList.remove("dark-theme");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    }

    if (themeToggleTwo) {
      themeToggleTwo.innerHTML = '<i class="jam jam-brightness-up"></i>';
    }

    if (logo) {
      logo.src = "/assets/img/deepdive.svg";
    }

    // Update all logos with navbar-logo class
    document.querySelectorAll("img.navbar-logo").forEach((img) => {
      img.src = "/assets/img/deepdive.svg";
    });

    if (offcanvasMenu) {
      offcanvasMenu.classList.remove("dark-theme");
    }
  }
}

// Function to toggle the theme
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const logo = document.getElementById("main-logo");
  const offcanvasMenu = document.getElementById("offcanvasMenu");

  body.classList.toggle("dark-theme");

  if (body.classList.contains("dark-theme")) {
    localStorage.setItem("theme", "dark");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
    }

    if (logo) {
      logo.src = "/assets/img/deepdive-lt.svg";
    }

    // Update all logos with navbar-logo class
    document.querySelectorAll("img.navbar-logo").forEach((img) => {
      img.src = "/assets/img/deepdive-lt.svg";
    });

    if (offcanvasMenu) {
      offcanvasMenu.classList.add("dark-theme");
    }
  } else {
    localStorage.setItem("theme", "light");

    if (themeToggle) {
      themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
    }

    if (logo) {
      logo.src = "/assets/img/deepdive.svg";
    }

    // Update all logos with navbar-logo class
    document.querySelectorAll("img.navbar-logo").forEach((img) => {
      img.src = "/assets/img/deepdive.svg";
    });

    if (offcanvasMenu) {
      offcanvasMenu.classList.remove("dark-theme");
    }
  }
}

// Function to toggle the theme on mobile
function toggleThemeTwo() {
  const body = document.body;
  const themeToggleTwo = document.getElementById("theme-toggle-two");
  const logo = document.getElementById("main-logo");
  const offcanvasMenu = document.getElementById("offcanvasMenu");

  body.classList.toggle("dark-theme");

  if (body.classList.contains("dark-theme")) {
    localStorage.setItem("theme", "dark");

    if (themeToggleTwo) {
      themeToggleTwo.innerHTML = '<i class="jam jam-moon"></i>';
    }

    if (logo) {
      logo.src = "/assets/img/deepdive-lt.svg";
    }

    // Update all logos with navbar-logo class
    document.querySelectorAll("img.navbar-logo").forEach((img) => {
      img.src = "/assets/img/deepdive-lt.svg";
    });

    if (offcanvasMenu) {
      offcanvasMenu.classList.add("dark-theme");
    }
  } else {
    localStorage.setItem("theme", "light");

    if (themeToggleTwo) {
      themeToggleTwo.innerHTML = '<i class="jam jam-brightness-up"></i>';
    }

    if (logo) {
      logo.src = "/assets/img/deepdive.svg";
    }

    // Update all logos with navbar-logo class
    document.querySelectorAll("img.navbar-logo").forEach((img) => {
      img.src = "/assets/img/deepdive.svg";
    });

    if (offcanvasMenu) {
      offcanvasMenu.classList.remove("dark-theme");
    }
  }
}

// Run initialization when the page loads
document.addEventListener("DOMContentLoaded", initializeTheme);
