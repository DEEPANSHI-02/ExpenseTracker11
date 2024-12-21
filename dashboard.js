import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js"; 


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//  Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    loadDashboardData(user.uid);
    checkForReminders(user.uid);
  } else {
    console.log("No user logged in.");
    window.location.href = "index.html"; 
  }
});

// Dashboard 
async function loadDashboardData(uid) {
  try {
    const financesRef = collection(db, "users", uid, "finances");
    const q = query(financesRef, orderBy("timestamp", "desc"), limit(1)); 
    const querySnapshot = await getDocs(q);

    let latestFinances = null;

    querySnapshot.forEach((doc) => {
      latestFinances = doc.data(); 
    });

    if (latestFinances) {
      document.getElementById("income").value = latestFinances.income || 0;
      document.getElementById("budget").value = latestFinances.budget || 0;
      document.getElementById("savings").value = latestFinances.savings || 0;
      document.getElementById("expenses").value = latestFinances.expenses || 0;

      updateDashboardSection(latestFinances);
      calculateTax();
    } else {
      console.log("No finances data found for this user.");
      resetForm();
    }
  } catch (error) {
    console.error("Error loading finances: ", error);
    alert("Failed to load dashboard data. Please try again.");
  }
}

function updateDashboardSection(finances) {
  document.getElementById("income-section").textContent = `Income: ₹${finances.income || 0}`;
  document.getElementById("budget-section").textContent = `Budget: ₹${finances.budget || 0}`;
  document.getElementById("savings-section").textContent = `Savings: ₹${finances.savings || 0}`;
  document.getElementById("expenses-section").textContent = `Expenses: ₹${finances.expenses || 0}`;
}

function resetForm() {
  document.getElementById("income").value = 0;
  document.getElementById("budget").value = 0;
  document.getElementById("savings").value = 0;
  document.getElementById("expenses").value = 0;
}


document.getElementById("manage-finances-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const income = parseFloat(document.getElementById("income").value);
  const budget = parseFloat(document.getElementById("budget").value);
  const savings = parseFloat(document.getElementById("savings").value);
  const expenses = parseFloat(document.getElementById("expenses").value);

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

    await loadDashboardData(user.uid);
    calculateTax();
  } catch (error) {
    console.error("Error saving finances: ", error);
    alert("Failed to update finances. Please try again.");
  }
});

// Tax Calculation Function
// Function to calculate tax based on income, deductions, and selected tax regime
function calculateTax() {
    let income = parseFloat(document.getElementById('total-income').value);
    let deductions = parseFloat(document.getElementById('deductions').value);
    let taxRegime = document.getElementById('tax-regime').value;
    let tax = 0;

    if (isNaN(income) || income <= 0) {
        document.getElementById('tax-section').innerText = "Please enter a valid income.";
        return;
    }

    if (taxRegime === 'old') {
        // Old Tax Regime with deductions
        let taxableIncome = income - deductions - 50000; // Standard Deduction ₹50,000

        if (taxableIncome <= 250000) {
            tax = 0;
        } else if (taxableIncome <= 500000) {
            tax = taxableIncome * 0.05;
        } else if (taxableIncome <= 1000000) {
            tax = 250000 * 0.05 + (taxableIncome - 500000) * 0.2;
        } else {
            tax = 250000 * 0.05 + 500000 * 0.2 + (taxableIncome - 1000000) * 0.3;
        }
    } else {
        // New Tax Regime (No deductions)
        if (income <= 250000) {
            tax = 0;
        } else if (income <= 500000) {
            tax = income * 0.05;
        } else if (income <= 1000000) {
            tax = 250000 * 0.05 + (income - 500000) * 0.1;
        } else {
            tax = 250000 * 0.05 + 500000 * 0.1 + (income - 1000000) * 0.15;
        }
    }

    document.getElementById('tax-section').innerText = "Tax Payable: ₹" + tax.toFixed(2);
}

// Event listener for the tax calculation button
document.getElementById('calculate-tax-button').addEventListener('click', calculateTax);

// Function to handle form submission for managing finances (income, expenses, savings, budget)
document.getElementById('manage-finances-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let income = document.getElementById('income').value;
    let expenses = document.getElementById('expenses').value;
    let savings = document.getElementById('savings').value;
    let budget = document.getElementById('budget').value;

    document.getElementById('income-section').innerText = "₹" + (income || 0);
    document.getElementById('expenses-section').innerText = "₹" + (expenses || 0);
    document.getElementById('savings-section').innerText = "₹" + (savings || 0);
    document.getElementById('budget-section').innerText = "₹" + (budget || 0);

   
});

// Event listener for adding bill reminders
document.getElementById('add-bill-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let billName = document.getElementById('bill-name').value;
    let amount = document.getElementById('amount').value;
    let dueDate = document.getElementById('due-date').value;

    if (billName && amount && dueDate) {
        let billItem = document.createElement('li');
        billItem.classList.add('py-2', 'text-gray-500');
        billItem.innerHTML = `${billName} - ₹${amount} - Due: ${dueDate}`;
        document.getElementById('reminder-list').appendChild(billItem);
    }
});

// Event listener for the "Logout" button
document.getElementById('sign-out').addEventListener('click', function() {
    // Handle sign-out logic (e.g., clearing session or redirecting to login page)
    alert("Logged out successfully!");
});


// Check for Reminders
async function checkForReminders(uid) {
  const today = new Date();
  const financesRef = collection(db, "users", uid, "finances");
  const q = query(financesRef, where("dueDate", "<=", today), where("status", "==", "unpaid"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const bill = doc.data();
    alert(`Reminder: Your ${bill.billName} of ₹${bill.amount} is overdue.`);
  });
}

document.getElementById("total-income").addEventListener("input", calculateTax);
document.getElementById("deductions").addEventListener("input", calculateTax);
document.getElementById("calculate-tax-button").addEventListener("click", (e) => {
    e.preventDefault();
    calculateTax();
});

document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing out: ", error);
    alert("Failed to log out. Please try again.");
  }
});

document.getElementById("pay-tax").addEventListener("click", function () {
    // Get tax amount from the tax section
    const taxAmountText = document.getElementById("tax-section").textContent;
    const taxAmount = parseFloat(taxAmountText.replace(/[^\d.]/g, "")) || 0;

    // If tax is 0, prevent payment
    if (taxAmount <= 0) {
        alert("No tax payable. Please check your calculations.");
        return;
    }

    // Convert to paise (Razorpay requires amount in paise)
    const amountInPaise = taxAmount * 100;

    // Razorpay options
    var options = {
        "key": "rzp_test_pJNGzxwmko1Sp3",  // Replace with your Razorpay API Key
        "amount": amountInPaise,
        "currency": "INR",
        "name": "FinTech Simplified",
        "description": "Tax Payment",
        "image": "https://example.com/logo.png",
        "handler": function (response) {
            alert("Tax Payment Successful! Payment ID: " + response.razorpay_payment_id);
        },
        "prefill": {
            "name": "Deepanshi",
            "email": "deepanshi@example.com",
            "contact": "9999999999"
        },
        "theme": {
            "color": "#3399cc"
        }
    };

    // Open Razorpay checkout
    var rzp1 = new Razorpay(options);
    rzp1.open();
});

