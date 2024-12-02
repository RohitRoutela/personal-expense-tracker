// Function to toggle login/logout button and handle authentication state
function toggleAuth() {
    const authBtn = document.getElementById("auth-btn");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (isLoggedIn) {
        // If logged in, show "Log Out"
        authBtn.textContent = "Log Out";
        authBtn.onclick = function () {
            logoutUser(); 
        };
    } else {
        // If logged out, show "Login / Sign Up"
        authBtn.textContent = "Login / Sign Up";
        authBtn.onclick = function () {
            window.location.href = "/LogIn/LogIn.html";
        };
    }
}

// Function to log out the user
function logoutUser() {
    localStorage.setItem("isLoggedIn", "false");
    localStorage.removeItem("email");

    alert("You have been logged out.");
    window.location.href = "/index.html";
}

// Function to verify if the user is logged in
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
        alert("You need to log in to access this page.");
        window.location.href = "/LogIn/LogIn.html";
    }
}

// Call toggleAuth on DOM load
document.addEventListener("DOMContentLoaded", toggleAuth);
