document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault(); 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", data.email);  // Store the email for future use
        alert(data.message);
        window.location.href = "/Index.html";  
    } else {
        const errorData = await response.json();
        alert(errorData.message || "Login failed");
    }
});
