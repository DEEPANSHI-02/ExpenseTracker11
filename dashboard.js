import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js"; // Replace with your actual config

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Redirect User Based on Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    loadDashboardData(user.uid);
  } else {
    console.log("No user logged in.");
    window.location.href = "index.html"; // Redirect to login if not logged in
  }
});

// Load Dashboard Data
async function loadDashboardData(uid) {
  try {
    const financesRef = collection(db, "users", uid, "finances");
    const q = query(financesRef, orderBy("timestamp", "desc"), limit(1)); // Get latest finance data
    const querySnapshot = await getDocs(q);

    let latestFinances = null;

    querySnapshot.forEach((doc) => {
      latestFinances = doc.data(); 
    });

    // If data exists, show it, else set the form to zero
    if (latestFinances) {
      document.getElementById("income").value = latestFinances.income || 0;
      document.getElementById("budget").value = latestFinances.budget || 0;
      document.getElementById("savings").value = latestFinances.savings || 0;
      document.getElementById("expenses").value = latestFinances.expenses || 0;

      // Update sections on the page
      updateDashboardSection(latestFinances);
    } else {
      console.log("No finances data found for this user.");
      resetForm();
    }
  } catch (error) {
    console.error("Error loading finances: ", error);
    alert("Failed to load dashboard data. Please try again.");
  }
}

// Update the sections (income, budget, savings, expenses) on the page
function updateDashboardSection(finances) {
  document.getElementById("income-section").textContent = `Income: ₹${finances.income || 0}`;
  document.getElementById("budget-section").textContent = `Budget: ₹${finances.budget || 0}`;
  document.getElementById("savings-section").textContent = `Savings: ₹${finances.savings || 0}`;
  document.getElementById("expenses-section").textContent = `Expenses: ₹${finances.expenses || 0}`;
}

// Reset form to 0
function resetForm() {
  document.getElementById("income").value = 0;
  document.getElementById("budget").value = 0;
  document.getElementById("savings").value = 0;
  document.getElementById("expenses").value = 0;
}

// Handle Finance Management Form Submission
document.getElementById("manage-finances-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const income = parseFloat(document.getElementById("income").value);
  const budget = parseFloat(document.getElementById("budget").value);
  const savings = parseFloat(document.getElementById("savings").value);
  const expenses = parseFloat(document.getElementById("expenses").value);

  // Validation
  if (isNaN(income) || isNaN(budget) || isNaN(savings) || isNaN(expenses)) {
    alert("Please enter valid numbers for all fields!");
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to manage your finances.");
      return;
    }

    // Save to Firestore
    const financesRef = collection(db, "users", user.uid, "finances");
    const docRef = await addDoc(financesRef, {
      income,
      budget,
      savings,
      expenses,
      timestamp: new Date(),
    });

    alert("Finances updated successfully!");
    console.log("Document written with ID: ", docRef.id);

    // Refresh Dashboard Data
    await loadDashboardData(user.uid);
  } catch (error) {
    console.error("Error saving finances: ", error);
    alert("Failed to update finances. Please try again.");
  }
});

// Sign Out Functionality
document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await auth.signOut();
    window.location.href = "index.html"; // Redirect to login page after sign out
  } catch (error) {
    console.error("Error signing out: ", error);
    alert("Failed to log out. Please try again.");
  }
});
