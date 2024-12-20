import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


function showMessage(elementId, message, type = "loading") {
  const element = document.getElementById(elementId);
  element.style.display = "block";
  element.textContent = message;
  element.className = type === "error" ? "error-message" : "loading-message";
}

function hideMessage(elementId) {
  const element = document.getElementById(elementId);
  element.style.display = "none";
}

// Auth state 
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (window.location.pathname === "/index.html" || window.location.pathname === "/register.html") {
      window.location.href = "dashboard.html"; 
    }
  } else {
    if (window.location.pathname !== "/index.html" && window.location.pathname !== "/register.html") {
      window.location.href = "index.html"; 
    }
  }
});

// Login 
if (document.getElementById("login-form")) {
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    showMessage("login-loading", "Logging in...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html"; 
    } catch (error) {
      showMessage("login-error", `Error: ${error.message}`, "error");
    } finally {
      hideMessage("login-loading");
    }
  });
}

// Register 
if (document.getElementById("register-form")) {
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      showMessage("register-error", "Passwords do not match!", "error");
      return;
    }

    showMessage("register-loading", "Registering...");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Registration successful! You can now log in.");
      window.location.href = "index.html"; 
    } catch (error) {
      showMessage("register-error", `Error: ${error.message}`, "error");
    } finally {
      hideMessage("register-loading");
    }
  });
}

// Logout
if (document.getElementById("logout-button")) {
  document.getElementById("logout-button").addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.href = "index.html";
    } catch (error) {
      alert(`Error logging out: ${error.message}`);
    }
  });
}
