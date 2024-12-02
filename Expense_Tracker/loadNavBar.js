document.addEventListener("DOMContentLoaded", function () {
    const navbarContainer = document.getElementById("navbar-container");

    fetch("/NavBar/NavBar.html")
        .then(response => response.text())
        .then(data => {
            navbarContainer.innerHTML = data;
            toggleAuth();
        })
        .catch(error => {
            console.error("Error loading navbar:", error);
        });
});
