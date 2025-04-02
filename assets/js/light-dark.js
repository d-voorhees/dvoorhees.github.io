// Function to set the initial theme on page load
function initializeTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const logo = document.getElementById('main-logo');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
        logo.src = '/assets/img/deepdive-lt.svg';
    } else {
        body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
        logo.src = '/assets/img/deepdive.svg';
    }
}

// Function to toggle the theme
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const logo = document.getElementById('main-logo');

    body.classList.toggle('dark-theme');

    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="jam jam-moon"></i>';
        logo.src = '/assets/img/deepdive-lt.svg';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="jam jam-brightness-up"></i>';
        logo.src = '/assets/img/deepdive.svg';
    }
}

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', initializeTheme);
