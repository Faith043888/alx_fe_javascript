// Load quotes from local storage or use default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "Your time is limited, so don't waste it living someone else's life.", category: "Inspiration" }
];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteContainer = document.getElementById("addQuoteContainer");

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available. Please add some!";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[randomIndex];
  quoteDisplay.innerHTML = `<strong>${text}</strong> <br><em>— ${category}</em>`;

  // Save last viewed quote to session storage
  sessionStorage.setItem("lastQuote", JSON.stringify({ text, category }));
}

// Add new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill in both fields.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");
}

// Create the Add Quote form dynamically
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  addQuoteContainer.appendChild(formContainer);
}

// Export quotes as JSON
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error reading JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();

  // Load last viewed quote if available
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const { text, category } = JSON.parse(lastQuote);
    quoteDisplay.innerHTML = `<strong>${text}</strong> <br><em>— ${category}</em>`;
  }

  // Connect Export/Import buttons from static HTML
  const exportBtn = document.getElementById("exportBtn");
  exportBtn.addEventListener("click", exportToJsonFile);

  const importInput = document.getElementById("importFile");
  importInput.addEventListener("change", importFromJsonFile);
});

// Event listener for showing new quotes
newQuoteBtn.addEventListener("click", showRandomQuote);

