function checkUser() {
    if (window.currentUser && window.currentUser.loggedIn) {
        window.location.href = "/dashboard";
    } 
    else if (window.currentUser && !window.currentUser.loggedIn) {
        window.location.href = "/";
    }
}

let attempts = 0;
const maxAttempts = 20;

const interval = setInterval(() => {
    if (window.currentUser !== undefined || attempts >= maxAttempts) {
        checkUser();
        clearInterval(interval);
    }
    attempts++;
}, 300);
