// 1. State Management
let accounts = JSON.parse(localStorage.getItem('my_expense_accounts')) || [];
let activeAccountId = localStorage.getItem('active_account_id') || null;

// UI State para sa Transaction Mode, Category, ug Date Filter
let currentTxType = 'expense'; // 'expense' or 'deposit'
let selectedCategory = '🍔 Food';
let activeDateFilter = 'all'; // 'all', 'today', 'yesterday', 'week', 'custom'
let customFilterDate = '';

// Categories base sa mode
const CATEGORIES = {
  expense: ['🍔 Food', '⛽ Gas/Transpo', '🛒 Groceries', '💡 Bills', '🛍️ Shopping', '🎮 Leisure', '📦 Others'],
  deposit: ['💰 Sweldo', '🏦 Transfer', '📈 Business/Sideline', '🎁 Refund/Others']
};

// Category Badge Colors
const BADGE_STYLES = {
  '🍔 Food': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  '⛽ Gas/Transpo': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  '🛒 Groceries': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  '💡 Bills': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  '🛍️ Shopping': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  '🎮 Leisure': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  '📦 Others': 'bg-slate-600/30 text-slate-300 border-slate-500/30',
  '💰 Sweldo': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  '🏦 Transfer': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  '📈 Business/Sideline': 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  '🎁 Refund/Others': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
};

// Helper: Kuhaon ang YYYY-MM-DD base sa local timezone sa phone
function getLocalDateKey(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Format sa kwarta
function formatCurrency(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Helper: Save sa localStorage
function saveData() {
  localStorage.setItem('my_expense_accounts', JSON.stringify(accounts));
  if (activeAccountId) {
    localStorage.setItem('active_account_id', activeAccountId);
  } else {
    localStorage.removeItem('active_account_id');
  }
}

// 2. Modal Controls
function toggleAccountModal(show) {
  const modal = document.getElementById('accountModal');
  if (show) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('accountTitle').focus();
  } else {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('accountForm').reset();
  }
}

// 3. Switch Transaction Mode (Expense vs Deposit)
function setTransactionType(type) {
  currentTxType = type;
  selectedCategory = CATEGORIES[type][0];

  const btnExpense = document.getElementById('btnModeExpense');
  const btnDeposit = document.getElementById('btnModeDeposit');
  const detailInput = document.getElementById('expenseDetail');
  const submitBtn = document.getElementById('submitTxBtn');

  if (type === 'expense') {
    btnExpense.className = 'py-2 rounded-lg text-xs font-bold transition bg-rose-600 text-white shadow';
    btnDeposit.className = 'py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white';
    detailInput.placeholder = 'Unsay gigastohan? (e.g. Jollibee, Gasolina)';
    submitBtn.textContent = 'Deduct';
    submitBtn.className = 'bg-rose-600 hover:bg-rose-500 active:scale-95 transition text-white font-semibold px-5 py-2.5 rounded-xl text-sm shrink-0';
  } else {
    btnDeposit.className = 'py-2 rounded-lg text-xs font-bold transition bg-emerald-600 text-white shadow';
    btnExpense.className = 'py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white';
    detailInput.placeholder = 'Diin gikan ang kwarta? (e.g. Sweldo, Transfer)';
    submitBtn.textContent = 'Add Funds';
    submitBtn.className = 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition text-white font-semibold px-5 py-2.5 rounded-xl text-sm shrink-0';
  }

  renderCategoryPills();
}

// Shortcut gikan sa "+ Top-up" button sa Card
function switchToDepositMode() {
  setTransactionType('deposit');
  document.getElementById('expenseDetail').focus();
}

// Render Category Pills
function renderCategoryPills() {
  const container = document.getElementById('categoryPills');
  container.innerHTML = '';

  CATEGORIES[currentTxType].forEach(cat => {
    const isSelected = cat === selectedCategory;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.onclick = () => {
      selectedCategory = cat;
      renderCategoryPills();
    };
    btn.className = `px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition ${
      isSelected
        ? 'bg-blue-600 text-white border-blue-500 shadow'
        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
    }`;
    btn.textContent = cat;
    container.appendChild(btn);
  });
}

// 4. Date Filter Logic
function setDateFilter(filterType, customValue = '') {
  activeDateFilter = filterType;
  const customInput = document.getElementById('customDateInput');

  if (filterType === 'custom') {
    customFilterDate = customValue;
  } else {
    customInput.value = '';
  }

  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const btnFilter = btn.getAttribute('data-filter');
    if (btnFilter === filterType) {
      btn.className = 'filter-btn bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-lg transition shadow';
    } else {
      btn.className = 'filter-btn bg-slate-900 text-slate-400 border border-slate-700 text-xs font-semibold py-1.5 rounded-lg transition';
    }
  });

  renderApp();
}

function isTransactionInDateFilter(tx) {
  // Backwards compatibility kung naay karaan nga data nga walay dateKey
  const txDateKey = tx.dateKey || getLocalDateKey(new Date());
  const todayKey = getLocalDateKey(new Date());

  if (activeDateFilter === 'all') return true;
  if (activeDateFilter === 'today') return txDateKey === todayKey;

  if (activeDateFilter === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return txDateKey === getLocalDateKey(yesterday);
  }

  if (activeDateFilter === 'week') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const minKey = getLocalDateKey(sevenDaysAgo);
    return txDateKey >= minKey && txDateKey <= todayKey;
  }

  if (activeDateFilter === 'custom' && customFilterDate) {
    return txDateKey === customFilterDate;
  }

  return true;
}

// 5. Pag-add og Bag-ong Account / Agenda
document.getElementById('accountForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const title = document.getElementById('accountTitle').value.trim();
  const initialBalance = parseFloat(document.getElementById('accountInitial').value);

  const newAccount = {
    id: 'acc_' + Date.now(),
    title: title,
    initialBalance: initialBalance,
    expenses: []
  };

  accounts.push(newAccount);
  activeAccountId = newAccount.id;
  saveData();
  toggleAccountModal(false);
  renderApp();
});

// 6. Pag-record og Transaction (Expense o Deposit)
document.getElementById('expenseForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const detail = document.getElementById('expenseDetail').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);

  const activeAccount = accounts.find(acc => acc.id === activeAccountId);
  if (!activeAccount) return;

  const now = new Date();
  const newTx = {
    id: 'tx_' + Date.now(),
    type: currentTxType, // 'expense' or 'deposit'
    category: selectedCategory,
    detail: detail,
    amount: amount,
    dateKey: getLocalDateKey(now), // YYYY-MM-DD para sa filter
    date: now.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  };

  activeAccount.expenses.unshift(newTx);
  saveData();
  document.getElementById('expenseForm').reset();
  renderApp();
});

// 7. Pag-delete og Transaction
function deleteExpense(txId) {
  const activeAccount = accounts.find(acc => acc.id === activeAccountId);
  if (!activeAccount) return;

  activeAccount.expenses = activeAccount.expenses.filter(tx => tx.id !== txId);
  saveData();
  renderApp();
}

// 8. Pag-delete sa Active Account
function deleteCurrentAccount() {
  const activeAccount = accounts.find(acc => acc.id === activeAccountId);
  if (!activeAccount) return;

  if (confirm(`Sigurado ka nga i-delete ang "${activeAccount.title}" ug tanang record ani?`)) {
    accounts = accounts.filter(acc => acc.id !== activeAccountId);
    activeAccountId = accounts.length ? accounts[0].id : null;
    saveData();
    renderApp();
  }
}

// 9. Select Account Tab
function selectAccount(id) {
  activeAccountId = id;
  saveData();
  renderApp();
}

// 10. Main Render Function
function renderApp() {
  const tabsContainer = document.getElementById('accountTabs');
  const activeCard = document.getElementById('activeAccountCard');
  const expenseFormContainer = document.getElementById('expenseFormContainer');
  const historySection = document.getElementById('historySection');
  const emptyState = document.getElementById('emptyState');

  tabsContainer.innerHTML = '';

  if (accounts.length === 0) {
    activeCard.classList.add('hidden');
    expenseFormContainer.classList.add('hidden');
    historySection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  activeCard.classList.remove('hidden');
  expenseFormContainer.classList.remove('hidden');
  historySection.classList.remove('hidden');

  if (!accounts.some(acc => acc.id === activeAccountId)) {
    activeAccountId = accounts[0].id;
  }

  // Render Account Tabs
  accounts.forEach(acc => {
    const isSelected = acc.id === activeAccountId;
    const btn = document.createElement('button');
    btn.onclick = () => selectAccount(acc.id);
    btn.className = `px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
      isSelected
        ? 'bg-blue-600 text-white shadow'
        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
    }`;
    btn.textContent = acc.title;
    tabsContainer.appendChild(btn);
  });

  // Compute Overall Account Totals
  const activeAccount = accounts.find(acc => acc.id === activeAccountId);
  let totalSpent = 0;
  let totalDeposited = 0;

  activeAccount.expenses.forEach(tx => {
    if (tx.type === 'deposit') {
      totalDeposited += tx.amount;
    } else {
      totalSpent += tx.amount;
    }
  });

  const remainingBalance = activeAccount.initialBalance + totalDeposited - totalSpent;

  // Update Main Balance Card
  document.getElementById('cardTitle').textContent = activeAccount.title;
  document.getElementById('cardRemaining').textContent = formatCurrency(remainingBalance);
  document.getElementById('cardInitial').textContent = formatCurrency(activeAccount.initialBalance);
  document.getElementById('cardDeposited').textContent = '+' + formatCurrency(totalDeposited);
  document.getElementById('cardSpent').textContent = '-' + formatCurrency(totalSpent);

  // Filter Transactions base sa Date Filter
  const filteredTransactions = activeAccount.expenses.filter(isTransactionInDateFilter);

  // Compute Filtered Totals (e.g., Pila ang nagasto Today vs Yesterday)
  let filteredSpent = 0;
  let filteredDeposit = 0;
  filteredTransactions.forEach(tx => {
    if (tx.type === 'deposit') {
      filteredDeposit += tx.amount;
    } else {
      filteredSpent += tx.amount;
    }
  });

  const filterLabels = {
    all: 'Total Spent (All Time)',
    today: 'Nagasto Karong Adlawa (Today)',
    yesterday: 'Nagasto Gahapon (Yesterday)',
    week: 'Nagasto (Last 7 Days)',
    custom: `Nagasto (${customFilterDate || 'Selected Date'})`
  };

  document.getElementById('filterLabelText').textContent = filterLabels[activeDateFilter];
  document.getElementById('filteredSpentAmount').textContent = '-' + formatCurrency(filteredSpent);
  document.getElementById('filteredDepositAmount').textContent = '+' + formatCurrency(filteredDeposit);

  // Render Transaction List
  const expenseList = document.getElementById('expenseList');
  const expenseCount = document.getElementById('expenseCount');
  expenseList.innerHTML = '';
  expenseCount.textContent = `${filteredTransactions.length} item(s)`;

  if (filteredTransactions.length === 0) {
    expenseList.innerHTML = `
      <div class="text-center py-6 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-500">
        Walay record para ani nga petsa sa ${activeAccount.title}.
      </div>
    `;
    return;
  }

  filteredTransactions.forEach(tx => {
    const isDeposit = tx.type === 'deposit';
    const category = tx.category || (isDeposit ? '💰 Sweldo' : '📦 Others');
    const badgeClass = BADGE_STYLES[category] || BADGE_STYLES['📦 Others'];

    const itemDiv = document.createElement('div');
    itemDiv.className = 'bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-3 flex justify-between items-center';
    itemDiv.innerHTML = `
      <div class="space-y-1 pr-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}">
            ${category}
          </span>
          <p class="text-sm font-semibold text-slate-100">${tx.detail}</p>
        </div>
        <p class="text-[11px] text-slate-400">${tx.date}</p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-sm font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}">
          ${isDeposit ? '+' : '-'} ${formatCurrency(tx.amount)}
        </span>
        <button onclick="deleteExpense('${tx.id}')" class="text-slate-500 hover:text-red-400 text-xs p-1" title="Delete">
          ✕
        </button>
      </div>
    `;
    expenseList.appendChild(itemDiv);
  });
}

// Initial Setup inig load sa page
renderCategoryPills();
renderApp();