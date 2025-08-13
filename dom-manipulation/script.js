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
const categoryFilter = document.getElementById("categoryFilter");

// Add sync status div above quote display
const syncStatus = document.createElement("div");
syncStatus.id = "syncStatus";
syncStatus.style.color = "green";
syncStatus.style.marginBottom = "10px";
document.body.insertBefore(syncStatus, quoteDisplay);

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show random quote (respects filter)
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const { text, category } = filteredQuotes[randomIndex];
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
  populateCategories(); // update categories if new

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

// Populate category dropdown dynamically
function populateCategories() {
  const lastSelected = categoryFilter.value || "all";

  const categories = Array.from(new Set(quotes.map(q => q.category)));

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  categoryFilter.value = lastSelected;
  localStorage.setItem("lastCategory", lastSelected);
}

// Filter quotes based on dropdown
function filterQuotes() {
  localStorage.setItem("lastCategory", categoryFilter.value);
  showRandomQuote();
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
        populateCategories();
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

// Simulate server sync
async function fetchServerQuotes() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const serverData = await response.json();

    const serverQuotes = serverData.map(post => ({
      text: post.title,
      category: "Server"
    }));

    let conflictsResolved = 0;
    let newQuotes = 0;

    serverQuotes.forEach(sq => {
      const localIndex = quotes.findIndex(lq => lq.text === sq.text);
      if (localIndex >= 0) {
        if (quotes[localIndex].category !== sq.category) {
          quotes[localIndex].category = sq.category;
          conflictsResolved++;
        }
      } else {
        quotes.push(sq);
        newQuotes++;
      }
    });

    saveQuotes();
    populateCategories();

    if (conflictsResolved || newQuotes) {
      syncStatus.textContent = `Sync complete: ${newQuotes} new quotes, ${conflictsResolved} conflicts resolved.`;
      setTimeout(() => syncStatus.textContent = "", 5000);
    }
  } catch (err) {
    console.error("Error syncing with server:", err);
    syncStatus.textContent = "Error syncing with server";
    setTimeout(() => syncStatus.textContent = "", 5000);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();
  populateCategories();

  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const { text, category } = JSON.parse(lastQuote);
    quoteDisplay.innerHTML = `<strong>${text}</strong> <br><em>— ${category}</em>`;
  }

  const lastCategory = localStorage.getItem("lastCategory") || "all";
  categoryFilter.value = lastCategory;

  const exportBtn = document.getElementById("exportBtn");
  exportBtn.addEventListener("click", exportToJsonFile);

  const importInput = document.getElementById("importFile");
  importInput.addEventListener("change", importFromJsonFile);

  // Initial server sync
  fetchServerQuotes();
});

// Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuotes);

// Periodic server sync every 30 seconds
setInterval(fetchServerQuotes, 30000);



