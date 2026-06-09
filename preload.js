const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('budgetAPI', {
  getTransactions: () => ipcRenderer.invoke('budget:getTransactions'),
  addTransaction: (transaction) => ipcRenderer.invoke('budget:addTransaction', transaction),
  deleteTransaction: (id) => ipcRenderer.invoke('budget:deleteTransaction', id),
  clearAll: () => ipcRenderer.invoke('budget:clearAll'),
  getSummary: () => ipcRenderer.invoke('budget:getSummary'),
  getCategories: () => ipcRenderer.invoke('budget:getCategories'),
  addCategory: (category) => ipcRenderer.invoke('budget:addCategory', category),
  deleteCategory: (id) => ipcRenderer.invoke('budget:deleteCategory', id),
  getBudget: (yearMonth) => ipcRenderer.invoke('budget:getBudget', yearMonth),
  setBudgetLimit: (payload) => ipcRenderer.invoke('budget:setBudgetLimit', payload)
});
