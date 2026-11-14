// ==========================================
// SPENDWISE - SMART EXPENSE TRACKER
// ==========================================


// GET HTML ELEMENTS

const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");
const transactionModal = document.getElementById("transactionModal");
const transactionForm = document.getElementById("transactionForm");

const transactionList = document.getElementById("transactionList");

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");

const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");

const expenseDistribution = document.getElementById("expenseDistribution");

const modalTitle = document.getElementById("modalTitle");
const saveBtn = document.getElementById("saveBtn");

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");


// LOCAL STORAGE

const STORAGE_KEY = "spendwise_transactions";

let transactions = [];

try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    transactions = savedData ? JSON.parse(savedData) : [];

    if (!Array.isArray(transactions)) {
        transactions = [];
    }
} catch (error) {
    console.error("Storage loading error:", error);
    transactions = [];
}

let editingId = null;


// SAVE DATA

function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
    );
}


// CURRENCY FORMAT

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
}


// DATE FORMAT

function formatDate(date) {
    const dateObject = new Date(date + "T00:00:00");

    return dateObject.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// OPEN MODAL

openModal.addEventListener("click", function () {
    resetForm();
    transactionModal.style.display = "flex";
});


// CLOSE MODAL

function hideModal() {
    transactionModal.style.display = "none";
    resetForm();
}

closeModal.addEventListener("click", hideModal);

transactionModal.addEventListener("click", function (event) {
    if (event.target === transactionModal) {
        hideModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        hideModal();
    }
});


// RESET FORM

function resetForm() {
    transactionForm.reset();

    editingId = null;

    modalTitle.textContent = "Add Transaction";
    saveBtn.textContent = "Save Transaction";

    dateInput.value = new Date().toLocaleDateString("en-CA");
}


// ADD OR UPDATE TRANSACTION

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!title || !category || !date) {
        alert("Please fill all required fields.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    if (!["Income", "Expense"].includes(type)) {
        alert("Invalid transaction type.");
        return;
    }

    if (date > new Date().toLocaleDateString("en-CA")) {
        alert("Future dates are not allowed.");
        return;
    }

    const transaction = {
        id: editingId || (
            "EXP" + Date.now() +
            Math.random().toString(36).slice(2, 7)
        ),
        title,
        amount,
        type,
        category,
        date,
        description
    };

    if (editingId) {

        const index = transactions.findIndex(
            item => item.id === editingId
        );

        if (index !== -1) {
            transactions[index] = transaction;
        }

    } else {

        transactions.push(transaction);

    }

    saveData();
    renderDashboard();
    hideModal();

    alert("Transaction saved successfully!");

});


// CALCULATE TOTALS

function calculateTotals() {

    let income = 0;
    let expense = 0;

    transactions.forEach(function (transaction) {

        if (transaction.type === "Income") {
            income += transaction.amount;
        }

        if (transaction.type === "Expense") {
            expense += transaction.amount;
        }

    });

    totalIncome.textContent = formatCurrency(income);
    totalExpense.textContent = formatCurrency(expense);
    totalBalance.textContent = formatCurrency(income - expense);

}


// DISPLAY TRANSACTIONS

function renderTransactions() {

    transactionList.replaceChildren();

    const searchText = searchInput.value.toLowerCase().trim();

    const filteredTransactions = [...transactions]
        .filter(function (transaction) {

            return (
                transaction.title.toLowerCase().includes(searchText) ||
                transaction.category.toLowerCase().includes(searchText) ||
                transaction.type.toLowerCase().includes(searchText)
            );

        })
        .sort(function (a, b) {

            return b.date.localeCompare(a.date) ||
                b.id.localeCompare(a.id);

        });

    if (filteredTransactions.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "empty-message";

        cell.textContent = searchText
            ? "No matching transactions found."
            : "No transactions yet. Add your first transaction!";

        row.appendChild(cell);
        transactionList.appendChild(row);

        return;
    }

    filteredTransactions.forEach(function (transaction) {

        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        titleCell.textContent = transaction.title;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(transaction.date);

        const typeCell = document.createElement("td");
        typeCell.textContent = transaction.type;

        typeCell.className = transaction.type === "Income"
            ? "type-income"
            : "type-expense";

        const amountCell = document.createElement("td");

        const sign = transaction.type === "Income" ? "+" : "-";

        amountCell.textContent =
            sign + formatCurrency(transaction.amount);

        amountCell.className = transaction.type === "Income"
            ? "amount-income"
            : "amount-expense";

        const actionCell = document.createElement("td");

        const actionContainer = document.createElement("div");
        actionContainer.className = "action-buttons";

        // EDIT BUTTON

        const editButton = document.createElement("button");

        editButton.className = "edit-btn";
        editButton.title = "Edit";

        editButton.innerHTML =
            '<i class="fa-solid fa-pen"></i>';

        editButton.addEventListener("click", function () {
            editTransaction(transaction.id);
        });

        // DELETE BUTTON

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.title = "Delete";

        deleteButton.innerHTML =
            '<i class="fa-solid fa-trash"></i>';

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        actionContainer.appendChild(editButton);
        actionContainer.appendChild(deleteButton);

        actionCell.appendChild(actionContainer);

        row.appendChild(titleCell);
        row.appendChild(categoryCell);
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(actionCell);

        transactionList.appendChild(row);

    });

}


// EDIT TRANSACTION

function editTransaction(id) {

    const transaction = transactions.find(
        item => item.id === id
    );

    if (!transaction) return;

    editingId = id;

    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;

    modalTitle.textContent = "Edit Transaction";
    saveBtn.textContent = "Update Transaction";

    transactionModal.style.display = "flex";

}


// DELETE TRANSACTION

function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    transactions = transactions.filter(
        item => item.id !== id
    );

    saveData();
    renderDashboard();

}


// EXPENSE ANALYTICS

function renderAnalytics() {

    expenseDistribution.replaceChildren();

    const categoryTotals = {};

    transactions.forEach(function (transaction) {

        if (transaction.type === "Expense") {

            const category = transaction.category;

            categoryTotals[category] =
                (categoryTotals[category] || 0) +
                transaction.amount;

        }

    });

    const categories = Object.entries(categoryTotals);

    if (categories.length === 0) {

        const message = document.createElement("p");

        message.textContent = "No expense data available.";
        message.style.color = "#64748b";

        expenseDistribution.appendChild(message);

        return;
    }

    const total = categories.reduce(
        (sum, item) => sum + item[1], 0
    );

    categories.sort((a, b) => b[1] - a[1]);

    categories.forEach(function ([category, amount]) {

        const percentage = (amount / total) * 100;

        const item = document.createElement("div");
        item.className = "category-item";

        const info = document.createElement("div");
        info.className = "category-info";

        const name = document.createElement("span");
        name.textContent = category;

        const value = document.createElement("span");

        value.textContent =
            formatCurrency(amount) +
            " (" + percentage.toFixed(1) + "%)";

        info.appendChild(name);
        info.appendChild(value);

        const background = document.createElement("div");
        background.className = "progress-bg";

        const fill = document.createElement("div");
        fill.className = "progress-fill";

        fill.style.width = percentage + "%";

        background.appendChild(fill);

        item.appendChild(info);
        item.appendChild(background);

        expenseDistribution.appendChild(item);

    });

}


// EXPORT TXT FILE

exportBtn.addEventListener("click", function () {

    if (transactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    let text = "";

    text += "====================================\n";
    text += "       SPENDWISE EXPENSE REPORT     \n";
    text += "====================================\n\n";

    transactions.forEach(function (transaction, index) {

        text += "Transaction No: " + (index + 1) + "\n";
        text += "Transaction ID: " + transaction.id + "\n";
        text += "Title: " + transaction.title + "\n";
        text += "Type: " + transaction.type + "\n";
        text += "Category: " + transaction.category + "\n";
        text += "Amount: " + formatCurrency(transaction.amount) + "\n";
        text += "Date: " + transaction.date + "\n";
        text += "Description: " + transaction.description + "\n";

        text += "------------------------------------\n\n";

    });

    const income = transactions
        .filter(item => item.type === "Income")
        .reduce((sum, item) => sum + item.amount, 0);

    const expense = transactions
        .filter(item => item.type === "Expense")
        .reduce((sum, item) => sum + item.amount, 0);

    text += "FINANCIAL SUMMARY\n";
    text += "Total Income: " + formatCurrency(income) + "\n";
    text += "Total Expenses: " + formatCurrency(expense) + "\n";
    text += "Total Balance: " + formatCurrency(income - expense) + "\n";

    const blob = new Blob(
        [text],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "expenses.txt";

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);

});


// SEARCH TRANSACTIONS

searchInput.addEventListener("input", function () {
    renderTransactions();
});


// RENDER DASHBOARD

function renderDashboard() {

    calculateTotals();
    renderTransactions();
    renderAnalytics();

}


// INITIALIZE APPLICATION

dateInput.value = new Date().toLocaleDateString("en-CA");

renderDashboard();

console.log("SpendWise JavaScript loaded successfully!");