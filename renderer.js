// DOM Elements
const form = document.getElementById('transactionForm');
const transactionBody = document.getElementById('transactionBody');
const transactionCount = document.getElementById('transactionCount');
const clearAllButton = document.getElementById('clearAll');
const monthPicker = document.getElementById('monthPicker');
const categoryForm = document.getElementById('categoryForm');
const categoryModal = document.getElementById('categoryModal');
const budgetModal = document.getElementById('budgetModal');
const budgetForm = document.getElementById('budgetForm');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const closeModalBtn = document.getElementById('closeModal');
const closeBudgetModalBtn = document.getElementById('closeBudgetModal');
const categoriesList = document.getElementById('categoriesList');
const categorySelect = document.getElementById('category');
const budgetProgressList = document.getElementById('budgetProgressList');

let currentMonth = getCurrentMonth();
let categories = [];
let currentBudgetCategory = null;

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

async function loadCategories() {
  categories = await window.budgetAPI.getCategories();
  renderCategories();
  updateCategorySelect();
}

function renderCategories() {
  categoriesList.innerHTML = '';
  categories.forEach((cat) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-info">
        <div class="color-indicator" style="background-color: ${cat.color}"></div>
        <span>${cat.name}</span>
      </div>
      <div class="category-actions">
        <button class="btn-budget" data-id="${cat.id}" data-name="${cat.name}">Set Budget</button>
        <button class="btn-delete" data-id="${cat.id}">Delete</button>
      </div>
    `;
    categoriesList.appendChild(item);
  });
}

function updateCategorySelect() {
  categorySelect.innerHTML = '<option value="">Select a category</option>';
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

async function loadTransactions() {
  const transactions = await window.budgetAPI.getTransactions();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  renderTransactions(monthTransactions);
  await updateBudgetProgress(monthTransactions);
}

function renderTransactions(transactions) {
  transactionBody.innerHTML = '';
  transactions.forEach((transaction) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.description}</td>
      <td>${formatCurrency(transaction.amount)}</td>
      <td>${transaction.type}</td>
      <td>${transaction.category}</td>
      <td>${transaction.date}</td>
      <td><button class="delete-button" data-id="${transaction.id}">Delete</button></td>
    `;
    transactionBody.appendChild(row);
  });
  transactionCount.textContent = `${transactions.length} record${transactions.length === 1 ? '' : 's'}`;
}

async function updateBudgetProgress(transactions) {
  const budget = await window.budgetAPI.getBudget(currentMonth);
  budgetProgressList.innerHTML = '';

  categories.forEach((cat) => {
    const spending = transactions
      .filter((t) => t.category === cat.name && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const limit = budget.categories && budget.categories[cat.name] ? budget.categories[cat.name].limit : 0;
    const percent = limit > 0 ? (spending / limit) * 100 : 0;
    const isOver = spending > limit && limit > 0;

    const item = document.createElement('div');
    item.className = `budget-item ${isOver ? 'over-budget' : ''}`;
    item.innerHTML = `
      <div class="budget-header">
        <span class="budget-name">${cat.name}</span>
        <span class="budget-amounts">${formatCurrency(spending)} / ${limit > 0 ? formatCurrency(limit) : 'No limit'}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(percent, 100)}%; background-color: ${isOver ? '#ef4444' : cat.color}"></div>
      </div>
      <div class="budget-status">${isOver ? `Over by ${formatCurrency(spending - limit)}` : `${Math.round(percent)}% used`}</div>
    `;
    budgetProgressList.appendChild(item);
  });
}

// Event Listeners
monthPicker.addEventListener('change', async (e) => {
  currentMonth = e.target.value;
  await loadTransactions();
});

addCategoryBtn.addEventListener('click', () => {
  categoryModal.classList.add('show');
});

closeModalBtn.addEventListener('click', () => {
  categoryModal.classList.remove('show');
});

closeBudgetModalBtn.addEventListener('click', () => {
  budgetModal.classList.remove('show');
});

categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const categoryName = document.getElementById('categoryName').value.trim();
  const categoryColor = document.getElementById('categoryColor').value;
  
  if (!categoryName) {
    alert('Category name is required');
    return;
  }

  await window.budgetAPI.addCategory({ name: categoryName, color: categoryColor });
  categoryForm.reset();
  categoryModal.classList.remove('show');
  await loadCategories();
  await loadTransactions();
});

categoriesList.addEventListener('click', async (e) => {
  if (e.target.matches('.btn-delete')) {
    const id = e.target.dataset.id;
    await window.budgetAPI.deleteCategory(id);
    await loadCategories();
    await loadTransactions();
  }

  if (e.target.matches('.btn-budget')) {
    currentBudgetCategory = e.target.dataset.name;
    document.getElementById('budgetModalTitle').textContent = `Set Budget Limit for ${currentBudgetCategory}`;
    budgetModal.classList.add('show');
  }
});

budgetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  
  if (isNaN(limit) || limit < 0) {
    alert('Please enter a valid limit');
    return;
  }

  await window.budgetAPI.setBudgetLimit({
    yearMonth: currentMonth,
    categoryName: currentBudgetCategory,
    limit: limit
  });

  budgetForm.reset();
  budgetModal.classList.remove('show');
  await loadTransactions();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const transaction = {
    description: document.getElementById('description').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    date: document.getElementById('date').value || currentMonth + '-01'
  };

  if (!transaction.description || !transaction.category || Number.isNaN(transaction.amount)) {
    alert('Please fill in all required fields');
    return;
  }

  await window.budgetAPI.addTransaction(transaction);
  form.reset();
  document.getElementById('type').value = 'expense';
  await loadTransactions();
});

transactionBody.addEventListener('click', async (event) => {
  if (event.target.matches('.delete-button')) {
    const id = event.target.dataset.id;
    await window.budgetAPI.deleteTransaction(id);
    await loadTransactions();
  }
});

clearAllButton.addEventListener('click', async () => {
  const confirmed = confirm('This will remove all transactions. Continue?');
  if (!confirmed) return;
  await window.budgetAPI.clearAll();
  await loadTransactions();
});

window.addEventListener('DOMContentLoaded', async () => {
  monthPicker.value = currentMonth;
  await loadCategories();
  await loadTransactions();
});
