const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const userDataPath = app.getPath('userData');
const dataFile = path.join(userDataPath, 'budget.json');

async function ensureDataFile() {
  try {
    await fs.mkdir(userDataPath, { recursive: true });
    await fs.access(dataFile);
  } catch (error) {
    const initialData = { transactions: [], categories: [], budgets: {} };
    await fs.writeFile(dataFile, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

async function readData() {
  await ensureDataFile();
  const file = await fs.readFile(dataFile, 'utf8');
  const parsed = JSON.parse(file || '{"transactions":[], "categories":[], "budgets":{}}');
  return parsed;
}

async function writeData(data) {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

async function readTransactions() {
  const data = await readData();
  return data.transactions || [];
}

async function writeTransactions(transactions) {
  const data = await readData();
  data.transactions = transactions;
  await writeData(data);
  return transactions;
}

function summarize(transactions) {
  const summary = transactions.reduce(
    (acc, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === 'income') {
        acc.totalIncome += amount;
      } else {
        acc.totalExpense += amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );
  summary.balance = summary.totalIncome - summary.totalExpense;
  return summary;
}

ipcMain.handle('budget:getTransactions', async () => {
  return readTransactions();
});

ipcMain.handle('budget:addTransaction', async (_, transaction) => {
  const transactions = await readTransactions();
  const newTransaction = {
    id: Date.now().toString(),
    description: transaction.description || 'Untitled',
    type: transaction.type === 'income' ? 'income' : 'expense',
    amount: Number(transaction.amount) || 0,
    category: transaction.category || 'Miscellaneous',
    date: transaction.date || new Date().toISOString().slice(0, 10)
  };
  transactions.unshift(newTransaction);
  await writeTransactions(transactions);
  return newTransaction;
});

ipcMain.handle('budget:deleteTransaction', async (_, id) => {
  const transactions = await readTransactions();
  const updated = transactions.filter((item) => item.id !== id);
  await writeTransactions(updated);
  return updated;
});

ipcMain.handle('budget:clearAll', async () => {
  await writeTransactions([]);
  return [];
});

ipcMain.handle('budget:getSummary', async () => {
  const transactions = await readTransactions();
  return summarize(transactions);
});

ipcMain.handle('budget:getCategories', async () => {
  const data = await readData();
  return data.categories || [];
});

ipcMain.handle('budget:addCategory', async (_, category) => {
  const data = await readData();
  const newCategory = {
    id: Date.now().toString(),
    name: category.name || 'Uncategorized',
    color: category.color || '#38bdf8'
  };
  data.categories = data.categories || [];
  data.categories.push(newCategory);
  await writeData(data);
  return newCategory;
});

ipcMain.handle('budget:deleteCategory', async (_, id) => {
  const data = await readData();
  data.categories = (data.categories || []).filter((cat) => cat.id !== id);
  await writeData(data);
  return data.categories;
});

ipcMain.handle('budget:getBudget', async (_, yearMonth) => {
  const data = await readData();
  const budgets = data.budgets || {};
  return budgets[yearMonth] || { categories: {} };
});

ipcMain.handle('budget:setBudgetLimit', async (_, { yearMonth, categoryName, limit }) => {
  const data = await readData();
  data.budgets = data.budgets || {};
  if (!data.budgets[yearMonth]) {
    data.budgets[yearMonth] = { categories: {} };
  }
  data.budgets[yearMonth].categories[categoryName] = { limit: Number(limit) || 0 };
  await writeData(data);
  return data.budgets[yearMonth];
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
