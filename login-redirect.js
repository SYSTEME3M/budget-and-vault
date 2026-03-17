// login-redirect.js
document.addEventListener("DOMContentLoaded", function() {
    // Vérifie si l'utilisateur est connecté
    if (window.currentUser && window.currentUser.loggedIn) {
        // Redirige automatiquement vers le dashboard
        window.location.href = "/dashboard"; // change "/dashboard" si ton dashboard a un autre chemin
    }
});
