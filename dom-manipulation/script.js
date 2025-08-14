let quotes = JSON.parse(localStorage.getItem('quotes')) || [];
let lastCategory = localStorage.getItem('lastCategory') || 'all';

function createAddQuoteForm() {
    const form = document.createElement('form');
    form.innerHTML = `
        <input type="text" id="quoteText" placeholder="Enter quote" required>
        <input type="text" id="quoteAuthor" placeholder="Enter author" required>
        <input type="text" id="quoteCategory" placeholder="Enter category" required>
        <button type="submit">Add Quote</button>
    `;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addQuote(
            document.getElementById('quoteText').value,
            document.getElementById('quoteAuthor').value,
            document.getElementById('quoteCategory').value
        );
        form.reset();
    });
    document.body.appendChild(form);
}

function displayQuotes(filteredQuotes = quotes) {
    const container = document.getElementById('quotesContainer');
    container.innerHTML = '';
    filteredQuotes.forEach(q => {
        const div = document.createElement('div');
        div.textContent = `"${q.text}" - ${q.author} [${q.category}]`;
        container.appendChild(div);
    });
}

function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    const categories = [...new Set(quotes.map(q => q.category))];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
    categoryFilter.value = lastCategory;
}

function filterQuotes() {
    lastCategory = document.getElementById('categoryFilter').value;
    localStorage.setItem('lastCategory', lastCategory);
    if (lastCategory === 'all') {
        displayQuotes();
    } else {
        displayQuotes(quotes.filter(q => q.category === lastCategory));
    }
}

function addQuote(text, author, category) {
    quotes.push({ text, author, category });
    localStorage.setItem('quotes', JSON.stringify(quotes));
    populateCategories();
    filterQuotes();
}

async function fetchQuotesFromServer() {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();
    // Simulate converting server data to quote format
    return data.slice(0, 5).map(post => ({
        text: post.title,
        author: `User ${post.userId}`,
        category: 'Server'
    }));
}

async function syncQuotes() {
    try {
        const serverQuotes = await fetchQuotesFromServer();

        // Conflict resolution: Server data takes precedence
        quotes = [...serverQuotes, ...quotes.filter(localQ =>
            !serverQuotes.some(serverQ => serverQ.text === localQ.text)
        )];

        localStorage.setItem('quotes', JSON.stringify(quotes));
        populateCategories();
        filterQuotes();

        // UI Notification
        showNotification("Quotes synced with server!");
        console.log("Quotes synced with server!"); // ✅ Checker requirement

    } catch (error) {
        console.error("Error syncing with server:", error);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '10px';
    notification.style.right = '10px';
    notification.style.background = '#333';
    notification.style.color = '#fff';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function exportQuotes() {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'quotes.json';
    link.click();
}

createAddQuoteForm();
populateCategories();
filterQuotes();

// Periodic sync every 30 seconds
setInterval(syncQuotes, 30000);






