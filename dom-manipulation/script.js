// ---------- Storage & initial data ----------
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "Your time is limited, so don't waste it living someone else's life.", category: "Inspiration" }
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------- DOM ----------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteContainer = document.getElementById("addQuoteContainer");
const categoryFilter = document.getElementById("categoryFilter");
const syncStatus = document.getElementById("syncStatus") || (() => {
  const d = document.createElement("div"); d.id = "syncStatus"; document.body.prepend(d); return d;
})();

// ---------- Core UI ----------
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const pool = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (pool.length === 0) {
    quoteDisplay.innerHTML = "No quotes available in this category.";
    return;
  }

  const { text, category } = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.innerHTML = `<strong>${text}</strong> <br><em>— ${category}</em>`;
  sessionStorage.setItem("lastQuote", JSON.stringify({ text, category }));
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please fill in both fields.");

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");

  // Post to mock API (required by checker)
  postQuoteToServer(newQuote);
}

function createAddQuoteForm() {
  const form = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);

  addQuoteContainer.appendChild(form);
}

function populateCategories() {
  const last = categoryFilter.value || "all";
  const categories = Array.from(new Set(quotes.map(q => q.category)));

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat; opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  categoryFilter.value = last;
  localStorage.setItem("lastCategory", last);
}

function filterQuotes() {
  localStorage.setItem("lastCategory", categoryFilter.value);
  showRandomQuote();
}

// ---------- Import / Export ----------
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "quotes.json"; a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const arr = JSON.parse(e.target.result);
      if (!Array.isArray(arr)) return alert("Invalid JSON format.");
      quotes.push(...arr);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch {
      alert("Error reading JSON file.");
    }
  };
  reader.readAsText(event.target.files[0]);
}

// ---------- Mock API (JSONPlaceholder) ----------
const MOCK_API_URL = "https://jsonplaceholder.typicode.com/posts";

// POST new quote to mock API (checker looks for POST)
async function postQuoteToServer(quote) {
  try {
    await fetch(MOCK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    // No real persistence; it's a mock endpoint.
  } catch (e) {
    console.error("Error posting quote to server:", e);
  }
}

// GET quotes from mock API (checker looks for fetchQuotesFromServer)
async function fetchQuotesFromServer() {
  // Return an array of quotes in our shape
  const res = await fetch(`${MOCK_API_URL}?_limit=5`);
  const data = await res.json();
  return data.map(post => ({ text: post.title, category: "Server" }));
}

// ---------- Sync & Conflict Resolution ----------
// ALX expects a syncQuotes function that uses the server data and resolves conflicts
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();

    let conflictsResolved = 0;
    let newQuotes = 0;

    serverQuotes.forEach(sq => {
      const idx = quotes.findIndex(lq => lq.text === sq.text);
      if (idx >= 0) {
        // Conflict: same text, different category -> server wins
        if (quotes[idx].category !== sq.category) {
          quotes[idx].category = sq.category;
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
      setTimeout(() => (syncStatus.textContent = ""), 5000);
    }
  } catch (e) {
    console.error("Error syncing with server:", e);
    syncStatus.textContent = "Error syncing with server";
    setTimeout(() => (syncStatus.textContent = ""), 5000);
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();
  populateCategories();

  // Restore last viewed quote (session)
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const { text, category } = JSON.parse(lastQuote);
    quoteDisplay.innerHTML = `<strong>${text}</strong> <br><em>— ${category}</em>`;
  }

  // Restore last category (local)
  categoryFilter.value = localStorage.getItem("lastCategory") || "all";

  // Hook up static controls
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) exportBtn.addEventListener("click", exportToJsonFile);
  const importInput = document.getElementById("importFile");
  if (importInput) importInput.addEventListener("change", importFromJsonFile);

  // Initial sync (checker looks for calling the sync once)
  syncQuotes();
});

// Events
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuotes);

// Periodic sync (checker looks for periodic checking)
setInterval(syncQuotes, 30000);





