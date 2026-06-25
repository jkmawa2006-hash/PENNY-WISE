let currentUser = null;
let data = { transactions: [], budgets: {}, recurring: [], goals: [], customCategories: [], netWorth: [], debts: [], subscriptions: [], investments: [] };
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let charts = {};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const CAT_COLORS = {
  'Food':         '#96AA9A',
  'Transport':    '#7a9a7e',
  'Shopping':     '#b5c4b8',
  'Bills':        '#c4956a',
  'Entertainment':'#8fa89a',
  'Healthcare':   '#a8bfa8',
  'Education':    '#7d9a7e',
  'Utilities':    '#9aae9a',
  'Rent':         '#6d8a72',
  'Salary':       '#96AA9A',
  'Freelance':    '#b0c4b0',
  'Other':        '#889a8a'
};

const CATEGORIES = Object.keys(CAT_COLORS);

function storageKey() { return 'budgetPro_' + currentUser; }
function usersKey() { return 'budgetPro_users'; }

function getUsers() {
  const raw = localStorage.getItem(usersKey());
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(usersKey(), JSON.stringify(users));
}

function loadData() {
  if (!currentUser) return data;
  const raw = localStorage.getItem(storageKey());
  if (raw) {
    const d = JSON.parse(raw);
    if (d && d.transactions && d.budgets !== undefined) {
      if (!d.recurring) d.recurring = [];
      if (!d.goals) d.goals = [];
      if (!d.customCategories) d.customCategories = [];
      if (!d.netWorth) d.netWorth = [];
      if (!d.debts) d.debts = [];
      if (!d.subscriptions) d.subscriptions = [];
      if (!d.investments) d.investments = [];
      if (!d.incomeSources) d.incomeSources = [];
      return d;
    }
  }
  return { transactions: [], budgets: {}, recurring: [], goals: [], customCategories: [], netWorth: [], debts: [], subscriptions: [], investments: [], incomeSources: [] };
}

function saveData() {
  if (!currentUser) return;
  localStorage.setItem(storageKey(), JSON.stringify(data));
}

/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */
function showAuth() {
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('auth-login').style.display = '';
  document.getElementById('auth-register').style.display = 'none';
  document.getElementById('auth-error').textContent = '';
}
function showLogin() { showAuth(); }
function showRegister() {
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('auth-login').style.display = 'none';
  document.getElementById('auth-register').style.display = '';
  document.getElementById('auth-error-reg').textContent = '';
}

function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const err = document.getElementById('auth-error');
  if (!username || !password) { err.textContent = 'Fill in all fields'; return; }
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) { err.textContent = 'User not found'; return; }
  if (user.password !== btoa(password)) { err.textContent = 'Wrong password'; return; }
  currentUser = username;
  sessionStorage.setItem('budgetPro_session', username);
  data = loadData();
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('user-name').textContent = username;
  document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
  initApp();
}

function register() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const err = document.getElementById('auth-error-reg');
  if (!username || !password || !confirm) { err.textContent = 'Fill in all fields'; return; }
  if (username.length < 3) { err.textContent = 'Username must be at least 3 characters'; return; }
  if (password.length < 4) { err.textContent = 'Password must be at least 4 characters'; return; }
  if (password !== confirm) { err.textContent = 'Passwords do not match'; return; }
  const users = getUsers();
  if (users.some(u => u.username === username)) { err.textContent = 'Username already taken'; return; }
  users.push({ username, password: btoa(password) });
  saveUsers(users);
  currentUser = username;
  sessionStorage.setItem('budgetPro_session', username);
  data = loadData();
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('user-name').textContent = username;
  document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
  initApp();
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('budgetPro_session');
  data = { transactions: [], budgets: {}, recurring: [], goals: [], customCategories: [], netWorth: [], debts: [], subscriptions: [], investments: [] };
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('auth-login').style.display = '';
  document.getElementById('auth-register').style.display = 'none';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('auth-error').textContent = '';
}

/* ═══════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════ */
const sections = ['dashboard','transactions','income','budgets','goals','reports','calendar','networth','debts','subscriptions','investments','admin'];
const titles = {
  dashboard:    ['Dashboard','Your financial overview at a glance'],
  transactions: ['Transactions','Add and manage your income & expenses'],
  income:       ['Income Sources','Declare and manage how you earn'],
  budgets:      ['Budgets','Set spending limits per category'],
  goals:        ['Goals','Track your financial savings targets'],
  reports:      ['Reports','Deep analysis of your spending patterns'],
  calendar:     ['Calendar','Transaction view by date'],
  networth:     ['Net Worth','Track assets and liabilities over time'],
  debts:        ['Debt Manager','Track and pay off your debts'],
  subscriptions:['Subscriptions','Manage your recurring services'],
  investments:  ['Investments','Track your portfolio performance'],
  admin:        ['Admin Panel','View registered users and their income data'],
};

function showSection(name) {
  sections.forEach(s => {
    const el = document.getElementById('section-'+s);
    if (el) el.style.display = s === name ? '' : 'none';
  });
  document.querySelectorAll('.nav-item').forEach((b,i) => {
    b.classList.toggle('active', sections[i] === name);
  });
  document.getElementById('page-title').textContent = titles[name][0];
  document.getElementById('page-subtitle').textContent = titles[name][1];
  if (name === 'dashboard') { rebuildLineChart(); rebuildDonutChart(); rebuildBarChart(); renderInsights(); renderStats(); }
  if (name === 'reports')   { rebuildWeeklyChart(); rebuildRadarChart(); }
  if (name === 'budgets')   renderBudgets();
  if (name === 'transactions') { renderTable(); renderRecurring(); }
  if (name === 'income')    renderIncomeSources();
  if (name === 'goals')     renderGoals();
  if (name === 'calendar')  { calMonth = currentMonth; calYear = currentYear; renderCalendar(); }
  if (name === 'networth')  renderNetWorth();
  if (name === 'debts')     renderDebts();
  if (name === 'subscriptions') renderSubscriptions();
  if (name === 'investments')   renderInvestments();
  if (name === 'admin')         showAdminSection();
}

/* ═══════════════════════════════════════════════
   MONTH NAV
═══════════════════════════════════════════════ */
function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  document.getElementById('month-label').textContent = `${MONTHS[currentMonth]} ${currentYear}`;
  renderAll();
}

/* ═══════════════════════════════════════════════
   FILTER
═══════════════════════════════════════════════ */
function monthTransactions() {
  return data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
}

function getFilteredTransactions() {
  let tx = [...data.transactions];
  const filterMonth = document.getElementById('filter-month')?.value;
  const filterCat = document.getElementById('filter-category')?.value;
  const filterType = document.getElementById('filter-type')?.value;
  if (filterMonth) {
    tx = tx.filter(t => t.date.startsWith(filterMonth));
  }
  if (filterCat) {
    tx = tx.filter(t => t.category === filterCat);
  }
  if (filterType) {
    tx = tx.filter(t => t.type === filterType);
  }
  const search = document.getElementById('filter-search')?.value?.toLowerCase();
  if (search) {
    tx = tx.filter(t => t.description.toLowerCase().includes(search));
  }
  return tx;
}

/* ═══════════════════════════════════════════════
   KPI
═══════════════════════════════════════════════ */
function renderKPI() {
  const tx = monthTransactions();
  const income  = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance = income - expense;

  const totalBudgeted = Object.values(data.budgets).reduce((s,v)=>s+v,0);
  const spentByCat = {};
  tx.filter(t=>t.type==='expense').forEach(t => {
    spentByCat[t.category] = (spentByCat[t.category]||0) + t.amount;
  });
  let totalSpentBudgeted = 0;
  Object.keys(data.budgets).forEach(cat => {
    totalSpentBudgeted += spentByCat[cat] || 0;
  });
  const budgetRemaining = Math.max(totalBudgeted - totalSpentBudgeted, 0);

  document.getElementById('kpi-income').textContent  = fmt(income);
  document.getElementById('kpi-expense').textContent = fmt(expense);
  document.getElementById('kpi-balance').textContent = fmt(balance);
  document.getElementById('kpi-budget').textContent  = fmt(budgetRemaining);
  document.getElementById('kpi-income-sub').textContent  = `${tx.filter(t=>t.type==='income').length} transactions this month`;
  document.getElementById('kpi-expense-sub').textContent = `${tx.filter(t=>t.type==='expense').length} transactions this month`;
}

/* ═══════════════════════════════════════════════
   CHARTS
═══════════════════════════════════════════════ */
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#6b7394', font: { size: 12 } } } },
};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function rebuildLineChart() {
  destroyChart('line');
  const labels = [], incomes = [], expenses = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i, y = currentYear;
    if (m < 0) { m += 12; y--; }
    labels.push(MONTHS[m].slice(0,3));
    const tx = data.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
    incomes.push(tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
    expenses.push(tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  }
  const ctx = document.getElementById('lineChart').getContext('2d');
  charts.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Income',  data: incomes,  borderColor:'#96AA9A', backgroundColor:'rgba(150,170,154,.1)',  tension:.4, fill:true, pointBackgroundColor:'#96AA9A' },
        { label:'Expense', data: expenses, borderColor:'#ff6b6b', backgroundColor:'rgba(255,107,107,.1)', tension:.4, fill:true, pointBackgroundColor:'#ff6b6b' },
      ]
    },
    options: { ...CHART_DEFAULTS, scales: {
      x: { ticks:{color:'#6b7394'}, grid:{color:'#252d3f'} },
      y: { ticks:{color:'#6b7394', callback: v=>'৳'+v}, grid:{color:'#252d3f'} }
    }}
  });
}

function rebuildDonutChart() {
  destroyChart('donut');
  const tx = monthTransactions().filter(t=>t.type==='expense');
  const cats = {}, labels = [], data = [], bg = [];
  tx.forEach(t => cats[t.category] = (cats[t.category]||0)+t.amount);
  Object.entries(cats).forEach(([k,v]) => {
    labels.push(k); data.push(v); bg.push(CAT_COLORS[k]||'#96AA9A');
  });
  const ctx = document.getElementById('donutChart').getContext('2d');
  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: bg, borderWidth: 2, borderColor: '#1a1f2e', hoverOffset: 8 }] },
    options: { ...CHART_DEFAULTS, cutout:'65%',
      plugins: { legend: { position:'right', labels:{color:'#6b7394', boxWidth:12, padding:14} } }
    }
  });
}

function rebuildBarChart() {
  destroyChart('bar');
  const labels=[], incomes=[], expenses=[];
  for (let i=5;i>=0;i--) {
    let m=currentMonth-i, y=currentYear;
    if(m<0){m+=12;y--;}
    labels.push(MONTHS[m].slice(0,3));
    const tx=data.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
    incomes.push(tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
    expenses.push(tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  }
  const ctx = document.getElementById('barChart').getContext('2d');
  charts.bar = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[
      { label:'Income',  data:incomes,  backgroundColor:'rgba(150,170,154,.7)',  borderRadius:6 },
      { label:'Expense', data:expenses, backgroundColor:'rgba(255,107,107,.7)', borderRadius:6 },
    ]},
    options:{ ...CHART_DEFAULTS, scales:{
      x:{ticks:{color:'#6b7394'},grid:{display:false}},
      y:{ticks:{color:'#6b7394',callback:v=>'$'+v},grid:{color:'#252d3f'}}
    }}
  });
}

function rebuildWeeklyChart() {
  destroyChart('weekly');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const totals = [0,0,0,0,0,0,0];
  monthTransactions().filter(t=>t.type==='expense').forEach(t=>{
    totals[new Date(t.date).getDay()] += t.amount;
  });
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  charts.weekly = new Chart(ctx, {
    type:'bar',
    data:{labels:days, datasets:[{
      label:'Spending', data:totals,
      backgroundColor: totals.map(v => v===Math.max(...totals)?'#96AA9A':'rgba(150,170,154,.35)'),
      borderRadius:8
    }]},
    options:{...CHART_DEFAULTS, scales:{
      x:{ticks:{color:'#6b7394'},grid:{display:false}},
      y:{ticks:{color:'#6b7394',callback:v=>'$'+v},grid:{color:'#252d3f'}}
    }}
  });
}

function rebuildRadarChart() {
  destroyChart('radar');
  const cats = ['Food','Transport','Shopping','Bills','Entertainment','Healthcare','Education','Utilities'];
  const tx = monthTransactions().filter(t=>t.type==='expense');
  const values = cats.map(c => tx.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0));
  const ctx = document.getElementById('radarChart').getContext('2d');
  charts.radar = new Chart(ctx, {
    type:'radar',
    data:{labels:cats, datasets:[{
      label:'Spending',
      data: values,
        backgroundColor:'rgba(150,170,154,.2)',
        borderColor:'#96AA9A',
        pointBackgroundColor:'#96AA9A',
    }]},
    options:{
      ...CHART_DEFAULTS,
      scales:{r:{
        ticks:{color:'#6b7394',backdropColor:'transparent'},
        grid:{color:'#252d3f'},
        pointLabels:{color:'#6b7394',font:{size:12}},
        angleLines:{color:'#252d3f'}
      }}
    }
  });
}

/* ═══════════════════════════════════════════════
   TRANSACTIONS
═══════════════════════════════════════════════ */
function renderTable() {
  const tbody = document.getElementById('tx-body');
  const tx = getFilteredTransactions().sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('tx-count').textContent = `${data.transactions.length} total · ${tx.length} shown`;
  if (!tx.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><span class="emoji">📭</span>No transactions found.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = tx.map(t => `
    <tr>
      <td>${fmtDate(t.date)}</td>
      <td>${esc(t.description)}</td>
      <td><span class="cat-tag">${esc(t.category)}</span></td>
      <td><span class="tag ${t.type}">${t.type}</span></td>
      <td class="amount-cell ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
      <td style="white-space:nowrap;">
        <button class="edit-tx-btn" onclick="openEdit(${t.id})">✏️</button>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})">🗑</button>
      </td>
    </tr>
  `).join('');
}

function addTransaction() {
  const desc = document.getElementById('tx-desc').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const type = document.getElementById('tx-type').value;
  const category = document.getElementById('tx-category').value;
  const date = document.getElementById('tx-date').value;

  if (!desc)       return toast('Please enter a description','error');
  if (!amount||amount<=0) return toast('Enter a valid amount','error');
  if (!date)       return toast('Please select a date','error');

  data.transactions.push({ id: Date.now(), date, type, category, amount, description: desc });
  applyBudgetForCategory(category, amount, type);
  saveData();
  renderAll();
  toast(`${type==='income'?'Income':'Expense'} added: ${fmt(amount)}`, 'success');

  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-amount').value = '';
}

function applyBudgetForCategory(category, amount, type) {
  if (type === 'expense' && data.budgets[category] !== undefined) {
    const spent = monthTransactions()
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((s, t) => s + t.amount, 0);
    const pct = (spent / data.budgets[category]) * 100;
    if (pct >= 100) {
      toast(`⚠️ Over budget on ${category}! ${fmt(spent)} / ${fmt(data.budgets[category])}`, 'error');
    } else if (pct >= 80) {
      toast(`⚠️ ${category} budget at ${Math.round(pct)}% used`, 'error');
    }
  }
}

let editingId = null;
function openEdit(id) {
  editingId = id;
  const t = data.transactions.find(tx => tx.id === id);
  if (!t) return;
  document.getElementById('edit-desc').value = t.description;
  document.getElementById('edit-amount').value = t.amount;
  document.getElementById('edit-type').value = t.type;
  document.getElementById('edit-category').value = t.category;
  document.getElementById('edit-date').value = t.date;
  document.getElementById('edit-modal').classList.add('show');
}
function closeEdit() {
  editingId = null;
  document.getElementById('edit-modal').classList.remove('show');
}
function saveEdit() {
  if (!editingId) return;
  const t = data.transactions.find(tx => tx.id === editingId);
  if (!t) return;
  t.description = document.getElementById('edit-desc').value.trim();
  t.amount = parseFloat(document.getElementById('edit-amount').value);
  t.type = document.getElementById('edit-type').value;
  t.category = document.getElementById('edit-category').value;
  t.date = document.getElementById('edit-date').value;
  if (!t.description || !t.amount || !t.date) return toast('Fill all fields', 'error');
  saveData();
  renderAll();
  closeEdit();
  toast('Transaction updated', 'success');
}

let lastDeleted = null;
function deleteTransaction(id) {
  lastDeleted = data.transactions.find(t => t.id === id);
  data.transactions = data.transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
  toast(`Transaction deleted <button class="undo-btn" onclick="undoDelete()">↩ Undo</button>`, 'success');
}
function undoDelete() {
  if (lastDeleted) {
    data.transactions.push(lastDeleted);
    lastDeleted = null;
    saveData();
    renderAll();
    toast('Undo successful', 'success');
  }
}

function clearAll() {
  if (!confirm('Delete ALL transactions?')) return;
  data.transactions = [];
  saveData();
  renderAll();
  toast('All transactions cleared', 'success');
}

/* ═══════════════════════════════════════════════
   BUDGET GOALS
═══════════════════════════════════════════════ */
function renderBudgets() {
  const el = document.getElementById('budgets-list');
  const tx = monthTransactions().filter(t => t.type === 'expense');
  const keys = Object.keys(data.budgets);
  if (!keys.length) {
    el.innerHTML = `<div class="empty"><span class="emoji">🎯</span>No budgets set. Set one below!</div>`;
    return;
  }
  el.innerHTML = keys.map(cat => {
    const limit = data.budgets[cat];
    const spent = tx.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);
    const pct = Math.min((spent / limit) * 100, 100);
    let statusClass = '';
    let statusText = 'Safe';
    if (spent > limit) {
      statusClass = 'over';
      statusText = 'Over budget!';
    } else if (spent >= limit * 0.8) {
      statusClass = 'warning';
      statusText = 'Warning';
    }
    return `
      <div class="goal-item">
        <div class="goal-header">
          <span class="goal-name">${esc(cat)}</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="goal-amounts">${fmt(spent)} / ${fmt(limit)} · <span style="color:${statusClass === 'over' ? 'var(--expense)' : statusClass === 'warning' ? 'var(--accent4)' : 'var(--income)'}">${statusText}</span></span>
            <button class="delete-btn btn-sm" onclick="removeBudget('${esc(cat)}')">✕</button>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${statusClass}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function setBudget() {
  const category = document.getElementById('budget-category').value;
  const limit = parseFloat(document.getElementById('budget-limit').value);
  if (!limit || limit <= 0) return toast('Enter a valid budget limit', 'error');
  data.budgets[category] = limit;
  saveData();
  renderBudgets();
  toast(`Budget set for ${category}: ${fmt(limit)}`, 'success');
  document.getElementById('budget-limit').value = '';
}

function removeBudget(category) {
  delete data.budgets[category];
  saveData();
  renderBudgets();
  toast('Budget removed', 'success');
}

/* ═══════════════════════════════════════════════
   RECURRING TRANSACTIONS
═══════════════════════════════════════════════ */
function renderRecurring() {
  const el = document.getElementById('recurring-list');
  if (!el) return;
  if (!data.recurring.length) {
    el.innerHTML = `<div class="empty"><span class="emoji">🔄</span>No recurring items. Add one below!</div>`;
    return;
  }
  el.innerHTML = data.recurring.map(r => {
    const day = r.day < 10 ? '0' + r.day : r.day;
    return `<div class="recurring-item">
      <div style="display:flex;align-items:center;gap:10px;flex:1;">
        <span class="tag ${r.type}" style="min-width:52px;text-align:center;">${r.type}</span>
        <span style="font-weight:600;">${esc(r.description)}</span>
        <span class="cat-tag">${esc(r.category)}</span>
        <span style="color:var(--muted);font-size:.8rem;">Day ${day}</span>
        <span class="amount-cell ${r.type}">${r.type==='income'?'+':'-'}${fmt(r.amount)}</span>
      </div>
      <button class="delete-btn" onclick="deleteRecurring(${r.id})">🗑</button>
    </div>`;
  }).join('');
  document.getElementById('recurring-count').textContent = `${data.recurring.length} active`;
}

function addRecurring() {
  const desc = document.getElementById('rec-desc').value.trim();
  const amount = parseFloat(document.getElementById('rec-amount').value);
  const type = document.getElementById('rec-type').value;
  const category = document.getElementById('rec-category').value;
  const day = parseInt(document.getElementById('rec-day').value);

  if (!desc) return toast('Enter a description','error');
  if (!amount||amount<=0) return toast('Enter a valid amount','error');
  if (!day||day<1||day>31) return toast('Enter a valid day (1-31)','error');

  data.recurring.push({ id: Date.now(), description: desc, amount, type, category, day });
  saveData();
  renderRecurring();
  processRecurring();
  toast('Recurring item added','success');

  document.getElementById('rec-desc').value = '';
  document.getElementById('rec-amount').value = '';
  document.getElementById('rec-day').value = '';
}

function deleteRecurring(id) {
  data.recurring = data.recurring.filter(r => r.id !== id);
  saveData();
  renderRecurring();
  toast('Recurring item removed','success');
}

function processRecurring() {
  const y = currentYear, m = currentMonth;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  data.recurring.forEach(r => {
    const day = Math.min(r.day, daysInMonth);
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const exists = data.transactions.some(t =>
      t.date === dateStr &&
      t.description === r.description &&
      t.type === r.type &&
      t.category === r.category &&
      t.amount === r.amount
    );
    if (!exists) {
      data.transactions.push({
        id: Date.now() + Math.random(),
        date: dateStr,
        type: r.type,
        category: r.category,
        amount: r.amount,
        description: r.description + ' (recurring)',
      });
    }
  });
  saveData();
}

/* ═══════════════════════════════════════════════
   FINANCIAL GOALS
═══════════════════════════════════════════════ */
function renderGoals() {
  renderGoalProgress();
  const el = document.getElementById('goals-list');
  if (!data.goals.length) {
    el.innerHTML = `<div class="empty"><span class="emoji">🎯</span>No goals set. Create one below!</div>`;
    return;
  }
  el.innerHTML = data.goals.map((g, i) => {
    const pct = Math.min((g.saved / g.target) * 100, 100);
    const remaining = Math.max(g.target - g.saved, 0);
    const deadline = new Date(g.deadline + 'T00:00:00');
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000*60*60*24));
    return `<div class="goal-item">
      <div class="goal-header">
        <span class="goal-name" style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:1.2rem;">${g.icon||'🎯'}</span> ${esc(g.name)}
        </span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="goal-amounts">${fmt(g.saved)} / ${fmt(g.target)}</span>
          <button class="delete-btn btn-sm" onclick="deleteGoal(${i})">✕</button>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${pct>=100?'over':pct>=80?'warning':''}" style="width:${pct}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted);">
        <span>${pct.toFixed(1)}% complete</span>
        <span>${fmt(remaining)} left · ${daysLeft > 0 ? daysLeft + ' days' : 'overdue'}</span>
      </div>
    </div>`;
  }).join('');
}

function renderGoalProgress() {
  const el = document.getElementById('goal-progress-summary');
  if (!el) return;
  const totalTarget = data.goals.reduce((s,g) => s + g.target, 0);
  const totalSaved = data.goals.reduce((s,g) => s + g.saved, 0);
  const totalPct = totalTarget > 0 ? (totalSaved / totalTarget * 100).toFixed(1) : 0;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:.85rem;">Overall Progress</span>
      <span style="font-weight:700;color:var(--accent);">${fmt(totalSaved)} / ${fmt(totalTarget)}</span>
    </div>
    <div class="progress-bar" style="height:10px;">
      <div class="progress-fill" style="width:${Math.min(totalPct,100)}%"></div>
    </div>
    <div style="text-align:right;font-size:.75rem;color:var(--muted);margin-top:4px;">${totalPct}% complete</div>
  `;
}

function addGoal() {
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);
  const saved = parseFloat(document.getElementById('goal-saved').value) || 0;
  const deadline = document.getElementById('goal-deadline').value;
  const icon = document.getElementById('goal-icon').value || '🎯';

  if (!name) return toast('Enter a goal name','error');
  if (!target||target<=0) return toast('Enter a valid target amount','error');
  if (!deadline) return toast('Select a deadline','error');

  data.goals.push({ id: Date.now(), name, target, saved, deadline, icon });
  saveData();
  renderGoals();
  toast('Goal created!','success');

  document.getElementById('goal-name').value = '';
  document.getElementById('goal-target').value = '';
  document.getElementById('goal-saved').value = '';
  document.getElementById('goal-deadline').value = '';
}

function deleteGoal(index) {
  data.goals.splice(index, 1);
  saveData();
  renderGoals();
  toast('Goal removed','success');
}

/* ═══════════════════════════════════════════════
   CALENDAR
═══════════════════════════════════════════════ */
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calSelected = null;

function calendarMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function calendarToday() {
  calMonth = new Date().getMonth();
  calYear = new Date().getFullYear();
  calSelected = null;
  renderCalendar();
}
function selectCalendarDay(day) {
  calSelected = day;
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('calendar-month-label');
  if (!grid) return;
  label.textContent = `${MONTHS[calMonth]} ${calYear}`;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  const today = new Date();
  const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const txByDay = {};
  const tx = data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  });
  tx.forEach(t => {
    const day = new Date(t.date).getDate();
    if (!txByDay[day]) txByDay[day] = [];
    txByDay[day].push(t);
  });

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let html = dayNames.map(d => `<div class="calendar-header">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-day other-month"><div class="day-num">${prevDays - firstDay + 1 + i}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cls = ['calendar-day'];
    if (isToday(d)) cls.push('today');
    if (calSelected === d) cls.push('selected');
    const dayTx = txByDay[d] || [];
    const incTotal = dayTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expTotal = dayTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    let content = `<div class="day-num">${d}</div>`;
    if (incTotal > 0) content += `<div class="tx-dot income">+${fmt(incTotal)}</div>`;
    if (expTotal > 0) content += `<div class="tx-dot expense">-${fmt(expTotal)}</div>`;
    if (dayTx.length > 2) content += `<div class="tx-dot" style="color:var(--muted);">+${dayTx.length-2} more</div>`;
    html += `<div class="${cls.join(' ')}" onclick="selectCalendarDay(${d})">${content}</div>`;
  }

  grid.innerHTML = html;

  const detail = document.getElementById('calendar-day-detail');
  if (calSelected && txByDay[calSelected]) {
    const dayTx = txByDay[calSelected].sort((a,b)=>new Date(b.date)-new Date(a.date));
    detail.innerHTML = `<div style="font-size:.85rem;font-weight:700;margin-bottom:8px;">📋 ${MONTHS[calMonth]} ${calSelected}, ${calYear}</div>
      <div class="table-wrap">
      <table>
        <thead><tr><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead>
        <tbody>${dayTx.map(t => `<tr>
          <td>${esc(t.description)}</td>
          <td><span class="cat-tag">${esc(t.category)}</span></td>
          <td><span class="tag ${t.type}">${t.type}</span></td>
          <td class="amount-cell ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  } else if (calSelected) {
    detail.innerHTML = `<div class="empty"><span class="emoji">📭</span>No transactions on this day.</div>`;
  } else {
    detail.innerHTML = `<div class="empty"><span class="emoji">👆</span>Click a day to see transactions.</div>`;
  }
}

/* ═══════════════════════════════════════════════
   NET WORTH
═══════════════════════════════════════════════ */
function saveNetWorth() {
  const cash = parseFloat(document.getElementById('nw-cash').value) || 0;
  const investments = parseFloat(document.getElementById('nw-investments').value) || 0;
  const property = parseFloat(document.getElementById('nw-property').value) || 0;
  const loans = parseFloat(document.getElementById('nw-loans').value) || 0;
  const credit = parseFloat(document.getElementById('nw-credit').value) || 0;
  const other = parseFloat(document.getElementById('nw-other').value) || 0;

  if (cash === 0 && investments === 0 && property === 0 && loans === 0 && credit === 0 && other === 0) {
    return toast('Enter at least one value', 'error');
  }

  const assets = cash + investments + property;
  const liabilities = loans + credit + other;
  const netWorth = assets - liabilities;

  data.netWorth.push({
    date: new Date().toISOString().split('T')[0],
    cash, investments, property, loans, credit, other,
    assets, liabilities, netWorth
  });

  saveData();
  renderNetWorth();
  toast(`Net worth saved: ${fmt(netWorth)}`, 'success');

  document.getElementById('nw-cash').value = '';
  document.getElementById('nw-investments').value = '';
  document.getElementById('nw-property').value = '';
  document.getElementById('nw-loans').value = '';
  document.getElementById('nw-credit').value = '';
  document.getElementById('nw-other').value = '';
}

function renderNetWorth() {
  const snapshots = data.netWorth;
  const summary = document.getElementById('networth-summary');
  if (!summary) return;

  if (!snapshots.length) {
    summary.innerHTML = `<div class="empty"><span class="emoji">📊</span>No net worth snapshots yet. Save one above!</div>`;
    destroyChart('networth');
    return;
  }

  const latest = snapshots[snapshots.length - 1];
  const first = snapshots[0];
  const change = latest.netWorth - first.netWorth;
  const changePct = first.netWorth !== 0 ? ((change / Math.abs(first.netWorth)) * 100).toFixed(1) : '∞';

  summary.innerHTML = `<div class="nw-summary-grid">
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Current Net Worth</div>
      <div style="font-size:1.6rem;font-weight:800;color:${latest.netWorth >= 0 ? 'var(--income)' : 'var(--expense)'};">${fmt(latest.netWorth)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Assets</div>
      <div style="font-size:1.3rem;font-weight:800;color:var(--income);">${fmt(latest.assets)}</div>
      <div style="font-size:.75rem;color:var(--muted);">Cash ${fmt(latest.cash)} · Inv ${fmt(latest.investments)} · Prop ${fmt(latest.property)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Liabilities</div>
      <div style="font-size:1.3rem;font-weight:800;color:var(--expense);">${fmt(latest.liabilities)}</div>
      <div style="font-size:.75rem;color:var(--muted);">Loans ${fmt(latest.loans)} · Credit ${fmt(latest.credit)} · Other ${fmt(latest.other)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Since First Snapshot</div>
      <div style="font-size:1.3rem;font-weight:800;color:${change >= 0 ? 'var(--income)' : 'var(--expense)'};">${change >= 0 ? '+' : ''}${fmt(change)}</div>
      <div style="font-size:.75rem;color:var(--muted);">${changePct}% change · ${snapshots.length} snapshots</div>
    </div>
  </div>`;

  destroyChart('networth');
  const ctx = document.getElementById('netWorthChart');
  if (!ctx) return;
  const labels = snapshots.map(s => s.date.slice(5));
  const assetsData = snapshots.map(s => s.assets);
  const liabilitiesData = snapshots.map(s => s.liabilities);
  const netData = snapshots.map(s => s.netWorth);
  charts.networth = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Net Worth', data: netData, borderColor: '#96AA9A', backgroundColor: 'rgba(150,170,154,.1)', tension: .4, fill: true, pointBackgroundColor: '#96AA9A', pointRadius: 4 },
        { label: 'Assets', data: assetsData, borderColor: '#96AA9A', backgroundColor: 'transparent', tension: .4, borderDash: [5,5], pointRadius: 2 },
        { label: 'Liabilities', data: liabilitiesData, borderColor: '#ff6b6b', backgroundColor: 'transparent', tension: .4, borderDash: [5,5], pointRadius: 2 },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { ticks: { color: '#6b7394' }, grid: { color: '#252d3f' } },
        y: { ticks: { color: '#6b7394', callback: v => '$' + v }, grid: { color: '#252d3f' } }
      }
    }
  });
}

/* ═══════════════════════════════════════════════
   INCOME SOURCES
═══════════════════════════════════════════════ */
let editingIncomeId = null;

function renderIncomeSources() {
  const list = document.getElementById('inc-list');
  const label = document.getElementById('inc-summary-label');
  if (!list) return;
  if (!data.incomeSources.length) {
    list.innerHTML = `<div class="empty"><span class="emoji">💵</span>No income sources declared. Add one above!</div>`;
    if (label) label.textContent = '';
    return;
  }
  const monthlyTotal = data.incomeSources.reduce((s, src) => {
    if (src.frequency === 'monthly') return s + src.amount;
    if (src.frequency === 'yearly') return s + src.amount / 12;
    return s;
  }, 0);
  const yearlyTotal = data.incomeSources.reduce((s, src) => {
    if (src.frequency === 'monthly') return s + src.amount * 12;
    if (src.frequency === 'yearly') return s + src.amount;
    return s + src.amount;
  }, 0);
  if (label) label.textContent = `${data.incomeSources.length} source${data.incomeSources.length>1?'s':''} · ${fmt(monthlyTotal)}/mo · ${fmt(yearlyTotal)}/yr`;

  list.innerHTML = data.incomeSources.map(src => {
    const iconMap = { 'Salary/Wages':'💼', 'Freelance':'✍️', 'Business':'🏢', 'Investment':'📈', 'Rental':'🏠', 'Passive':'🔄', 'Other':'💵' };
    const icon = iconMap[src.type] || '💵';
    return `<div class="inc-item">
      <div class="inc-icon">${icon}</div>
      <div class="inc-body">
        <span class="inc-name">${esc(src.name)}</span>
        <span class="inc-tag">${esc(src.type)}</span>
        <span class="inc-freq">${src.frequency}</span>
        <span class="inc-amount">${fmt(src.amount)}</span>
        <span class="inc-desc" title="${esc(src.description)}">${esc(src.description || '')}</span>
      </div>
      <div class="inc-actions">
        <button onclick="editIncomeSource(${src.id})" title="Edit">✏️</button>
        <button class="danger" onclick="deleteIncomeSource(${src.id})" title="Remove">✕</button>
      </div>
    </div>`;
  }).join('');
}

function incomeMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function syncIncomeTx(src) {
  const prefix = incomeMonthStr();
  const dateStr = prefix + '-01';

  // If existing txId is for a different month, unlink it (keep old tx intact)
  if (src.txId) {
    const tx = data.transactions.find(t => t.id === src.txId);
    if (tx && !tx.date.startsWith(prefix)) {
      src.txId = null; // old month's tx stays; we'll create a new one
    }
  }

  if (src.txId) {
    const tx = data.transactions.find(t => t.id === src.txId);
    if (tx) {
      tx.amount = src.frequency === 'yearly' ? src.amount / 12 : src.amount;
      tx.description = src.name + (src.description ? ' — ' + src.description : '');
      tx.category = src.type;
      return;
    }
  }

  const amt = src.frequency === 'yearly' ? src.amount / 12 :
              src.frequency === 'one-time' ? src.amount : src.amount;
  const txId = Date.now() + Math.random();
  data.transactions.push({
    id: txId,
    date: dateStr,
    type: 'income',
    category: src.type,
    amount: amt,
    description: src.name + (src.description ? ' — ' + src.description : ''),
  });
  src.txId = txId;
}

function processIncomeSources() {
  if (!data.incomeSources) return;
  data.incomeSources.forEach(s => {
    if (s.frequency === 'one-time') return; // only sync recurring sources each month
    syncIncomeTx(s);
  });
  saveData();
}

function saveIncomeSource() {
  const name = document.getElementById('inc-name').value.trim();
  const type = document.getElementById('inc-type').value;
  const frequency = document.getElementById('inc-frequency').value;
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const description = document.getElementById('inc-description').value.trim();

  if (!name) return toast('Enter a source name', 'error');
  if (!amount || amount <= 0) return toast('Enter a valid amount', 'error');

  if (editingIncomeId) {
    const src = data.incomeSources.find(s => s.id === editingIncomeId);
    if (src) {
      src.name = name; src.type = type; src.frequency = frequency;
      src.amount = amount; src.description = description;
      syncIncomeTx(src);
    }
    editingIncomeId = null;
    document.getElementById('inc-cancel-btn').style.display = 'none';
    toast('Income source updated', 'success');
  } else {
    const src = { id: Date.now(), name, type, frequency, amount, description };
    syncIncomeTx(src);
    data.incomeSources.push(src);
    toast('Income source saved', 'success');
  }

  saveData();
  renderAll();
  renderIncomeSources();
  document.getElementById('inc-name').value = '';
  document.getElementById('inc-amount').value = '';
  document.getElementById('inc-description').value = '';
}

function editIncomeSource(id) {
  const src = data.incomeSources.find(s => s.id === id);
  if (!src) return;
  editingIncomeId = id;
  document.getElementById('inc-name').value = src.name;
  document.getElementById('inc-type').value = src.type;
  document.getElementById('inc-frequency').value = src.frequency;
  document.getElementById('inc-amount').value = src.amount;
  document.getElementById('inc-description').value = src.description;
  document.getElementById('inc-cancel-btn').style.display = '';
  document.getElementById('inc-name').focus();
}

function cancelIncomeEdit() {
  editingIncomeId = null;
  document.getElementById('inc-cancel-btn').style.display = 'none';
  document.getElementById('inc-name').value = '';
  document.getElementById('inc-amount').value = '';
  document.getElementById('inc-description').value = '';
  document.getElementById('inc-type').value = 'Salary/Wages';
  document.getElementById('inc-frequency').value = 'monthly';
  toast('Edit cancelled', 'success');
}

function deleteIncomeSource(id) {
  const src = data.incomeSources.find(s => s.id === id);
  if (src && src.txId) data.transactions = data.transactions.filter(t => t.id !== src.txId);
  data.incomeSources = data.incomeSources.filter(s => s.id !== id);
  if (editingIncomeId === id) cancelIncomeEdit();
  saveData();
  renderAll();
  renderIncomeSources();
  toast('Income source removed', 'success');
}

/* ═══════════════════════════════════════════════
   DEBT MANAGER
═══════════════════════════════════════════════ */
function renderDebts() {
  const list = document.getElementById('debts-list');
  const summary = document.getElementById('debts-summary');
  const label = document.getElementById('debts-total-label');
  if (!list || !summary) return;
  destroyChart('debt');

  if (!data.debts.length) {
    list.innerHTML = `<div class="empty"><span class="emoji">💳</span>No debts tracked. Add one above!</div>`;
    summary.innerHTML = '';
    if (label) label.textContent = '';
    return;
  }

  const total = data.debts.reduce((s,d) => s + d.total, 0);
  const paid = data.debts.reduce((s,d) => s + d.paid, 0);
  const remaining = total - paid;
  const minTotal = data.debts.reduce((s,d) => s + d.minPayment, 0);
  const weightedApr = remaining > 0 ? data.debts.reduce((s,d) => s + d.interest * (d.total - d.paid), 0) / remaining : 0;
  const highCount = data.debts.filter(d => d.interest >= 15).length;
  const paidCount = data.debts.filter(d => d.paid >= d.total).length;
  if (label) label.textContent = `${data.debts.length} debt${data.debts.length>1?'s':''} · ${fmt(remaining)} remaining · ${paidCount} paid off`;

  const topRec = [...data.debts].sort((a,b) => b.interest - a.interest)[0];

  summary.innerHTML = `<div class="nw-summary-grid">
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Owed</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--expense);">${fmt(total)}</div>
      <div style="font-size:.75rem;color:var(--muted);">${fmt(paid)} paid back (${total > 0 ? ((paid/total)*100).toFixed(1) : 0}%)</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Still Owed</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--accent4);">${fmt(remaining)}</div>
      <div style="font-size:.75rem;color:var(--muted);">${fmt(minTotal)}/mo minimum</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Avg APR</div>
      <div style="font-size:1.4rem;font-weight:800;color:${weightedApr > 10 ? 'var(--expense)' : weightedApr > 5 ? '#c4956a' : 'var(--income)'};">${weightedApr.toFixed(1)}%</div>
      <div style="font-size:.75rem;color:var(--muted);">${highCount > 0 ? highCount + ' high-interest' : 'All low'}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Payoff Target</div>
      <div style="font-size:.95rem;font-weight:700;color:var(--accent);">Attack ${esc(topRec.name)}</div>
      <div style="font-size:.72rem;color:var(--muted);">Highest APR · ${topRec.interest}%</div>
    </div>
  </div>`;

  list.innerHTML = data.debts.map(d => {
    const pct = d.total > 0 ? Math.min((d.paid/d.total)*100, 100) : 0;
    const rem = d.total - d.paid;
    const monthsToPay = d.minPayment > 0 ? Math.ceil(rem / d.minPayment) : 0;
    const riskClass = d.interest >= 15 ? 'high-risk' : d.interest >= 8 ? 'med-risk' : 'low-risk';
    const aprClass = d.interest >= 15 ? 'high' : d.interest >= 8 ? 'med' : 'low';
    const barColor = d.interest >= 15 ? '#ff6b6b' : d.interest >= 8 ? '#c4956a' : '#96AA9A';
    return `<div class="debt-item ${riskClass}">
      <div class="debt-name-col">
        ${esc(d.name)}
        <span class="debt-apr-badge ${aprClass}">${d.interest}%</span>
      </div>
      <div class="debt-metrics">
        <div class="debt-stat">
          <div class="stat-num" style="color:${rem > 0 ? 'var(--expense)' : 'var(--income)'};">${fmt(rem)}</div>
          <div class="stat-label">Remaining</div>
        </div>
        <div class="debt-stat">
          <div class="stat-num">${fmt(d.minPayment)}</div>
          <div class="stat-label">Min/Mo</div>
        </div>
        <div class="debt-stat">
          <div class="stat-num">${monthsToPay > 0 ? monthsToPay + 'm' : '—'}</div>
          <div class="stat-label">ETA</div>
        </div>
        <div class="debt-minibar">
          <div class="minibar-fill" style="width:${pct}%;background:${barColor};"></div>
        </div>
        <div class="debt-pct" style="color:${pct >= 100 ? 'var(--income)' : 'var(--muted)'};">${pct.toFixed(0)}%</div>
      </div>
      <div class="debt-actions">
        <button class="action-btn" onclick="makePayment(${d.id})" title="Record payment">💰</button>
        <button class="action-btn danger" onclick="deleteDebt(${d.id})" title="Remove">✕</button>
      </div>
    </div>`;
  }).join('');

  const ctx = document.getElementById('debtChart');
  if (ctx && data.debts.length) {
    const colors = ['#ff6b6b','#c4956a','#96AA9A','#7a9a7e','#b5c4b8','#889a8a'];
    charts.debt = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: data.debts.map(d => d.name),
        datasets: [{ data: data.debts.map(d => d.total - d.paid), backgroundColor: colors.slice(0, data.debts.length), borderWidth: 2, borderColor: '#1a1f2e' }]
      },
      options: { ...CHART_DEFAULTS, cutout: '72%', plugins: { legend: { display: false } } }
    });
  }
}

function makePayment(id) {
  const d = data.debts.find(x => x.id === id);
  if (!d) return;
  const amt = prompt(`Record payment for "${d.name}"\nRemaining: ${fmt(d.total - d.paid)}\nEnter amount:`, (d.minPayment || 0).toFixed(2));
  if (amt === null) return;
  const val = parseFloat(amt);
  if (!val || val <= 0) return toast('Enter a valid amount', 'error');
  d.paid = Math.min(d.paid + val, d.total);
  saveData();
  renderDebts();
  toast(`Payment of ${fmt(val)} recorded for ${d.name}`, 'success');
}
function addDebt() {
  const name = document.getElementById('debt-name').value.trim();
  const total = parseFloat(document.getElementById('debt-total').value);
  const paid = parseFloat(document.getElementById('debt-paid').value) || 0;
  const interest = parseFloat(document.getElementById('debt-interest').value) || 0;
  const minPayment = parseFloat(document.getElementById('debt-min').value) || 0;
  if (!name) return toast('Enter a debt name', 'error');
  if (!total||total<=0) return toast('Enter total owed', 'error');
  data.debts.push({ id: Date.now(), name, total, paid, interest, minPayment });
  saveData();
  renderDebts();
  toast('Debt added', 'success');
  document.getElementById('debt-name').value = '';
  document.getElementById('debt-total').value = '';
  document.getElementById('debt-paid').value = '';
  document.getElementById('debt-interest').value = '';
  document.getElementById('debt-min').value = '';
}
function deleteDebt(id) {
  data.debts = data.debts.filter(d => d.id !== id);
  saveData();
  renderDebts();
  toast('Debt removed', 'success');
}

/* ═══════════════════════════════════════════════
   SUBSCRIPTIONS
═══════════════════════════════════════════════ */
function renderSubscriptions() {
  const list = document.getElementById('sub-list');
  const summary = document.getElementById('sub-summary');
  if (!list || !summary) return;
  if (!data.subscriptions.length) {
    list.innerHTML = `<div class="empty"><span class="emoji">📋</span>No subscriptions tracked. Add one above!</div>`;
    summary.innerHTML = '';
    return;
  }
  const monthly = data.subscriptions.reduce((s,sub) => s + (sub.cycle === 'monthly' ? sub.cost : sub.cost / 12), 0);
  const yearly = data.subscriptions.reduce((s,sub) => s + (sub.cycle === 'yearly' ? sub.cost : sub.cost * 12), 0);
  summary.innerHTML = `<div class="nw-summary-grid">
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Monthly Total</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--expense);">${fmt(monthly)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Annual Total</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--expense);">${fmt(yearly)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Active Services</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--accent);">${data.subscriptions.length}</div>
    </div>
  </div>`;
  list.innerHTML = data.subscriptions.map(sub => {
    const daysLeft = Math.ceil((new Date(sub.nextBilling + 'T00:00:00') - new Date()) / (1000*60*60*24));
    return `<div class="sub-item">
      <div class="sub-info">
        <span style="font-weight:700;min-width:110px;">${esc(sub.name)}</span>
        <span class="cat-tag">${esc(sub.category)}</span>
        <span class="amount-cell expense">${fmt(sub.cost)}/${sub.cycle === 'monthly' ? 'mo' : 'yr'}</span>
        <span style="color:var(--muted);font-size:.78rem;">${daysLeft > 0 ? daysLeft + ' days left' : 'Due soon'}</span>
      </div>
      <div class="sub-actions">
        <button class="delete-btn btn-sm" onclick="deleteSubscription(${sub.id})">✕</button>
      </div>
    </div>`;
  }).join('');
}
function addSubscription() {
  const name = document.getElementById('sub-name').value.trim();
  const cost = parseFloat(document.getElementById('sub-cost').value);
  const cycle = document.getElementById('sub-cycle').value;
  const category = document.getElementById('sub-category').value;
  const nextBilling = document.getElementById('sub-date').value;
  if (!name) return toast('Enter service name', 'error');
  if (!cost||cost<=0) return toast('Enter a valid cost', 'error');
  if (!nextBilling) return toast('Select next billing date', 'error');
  data.subscriptions.push({ id: Date.now(), name, cost, cycle, category, nextBilling });
  saveData();
  renderSubscriptions();
  toast('Subscription added', 'success');
  document.getElementById('sub-name').value = '';
  document.getElementById('sub-cost').value = '';
  document.getElementById('sub-date').value = '';
}
function deleteSubscription(id) {
  data.subscriptions = data.subscriptions.filter(s => s.id !== id);
  saveData();
  renderSubscriptions();
  toast('Subscription removed', 'success');
}

/* ═══════════════════════════════════════════════
   INVESTMENTS
═══════════════════════════════════════════════ */
function renderInvestments() {
  const list = document.getElementById('inv-list');
  const summary = document.getElementById('inv-summary');
  if (!list || !summary) return;
  destroyChart('inv');
  if (!data.investments.length) {
    list.innerHTML = `<div class="empty"><span class="emoji">📈</span>No investments tracked. Add one above!</div>`;
    summary.innerHTML = '';
    return;
  }
  const totalCost = data.investments.reduce((s,inv) => s + inv.shares * inv.costBasis, 0);
  const totalValue = data.investments.reduce((s,inv) => s + inv.shares * inv.currentPrice, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (totalGain / totalCost * 100).toFixed(1) : 0;
  summary.innerHTML = `<div class="nw-summary-grid">
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Portfolio Value</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--income);">${fmt(totalValue)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Cost</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--muted);">${fmt(totalCost)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Gain / Loss</div>
      <div style="font-size:1.4rem;font-weight:800;color:${totalGain>=0?'var(--income)':'var(--expense)'};">${totalGain>=0?'+':''}${fmt(totalGain)}</div>
      <div style="font-size:.75rem;color:var(--muted);">${gainPct}%</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Holdings</div>
      <div style="font-size:1.4rem;font-weight:800;color:var(--accent);">${data.investments.length}</div>
    </div>
  </div>`;
  list.innerHTML = data.investments.map(inv => {
    const costTotal = inv.shares * inv.costBasis;
    const curTotal = inv.shares * inv.currentPrice;
    const gain = curTotal - costTotal;
    const pct = costTotal > 0 ? (gain / costTotal * 100).toFixed(1) : 0;
    return `<div class="inv-item">
      <div class="inv-info">
        <span style="font-weight:700;min-width:80px;">${esc(inv.ticker)}</span>
        <span style="color:var(--muted);font-size:.82rem;">${inv.shares} shares</span>
        <span class="amount-cell" style="color:var(--muted);">Basis ${fmt(inv.costBasis)}</span>
        <span class="amount-cell" style="color:var(--accent);">${fmt(inv.currentPrice)}</span>
        <span class="amount-cell ${gain>=0?'inv-positive':'inv-negative'}" style="font-weight:700;">${gain>=0?'+':''}${fmt(gain)} (${gain>=0?'+':''}${pct}%)</span>
      </div>
      <div class="inv-actions">
        <button class="delete-btn btn-sm" onclick="deleteInvestment(${inv.id})">✕</button>
      </div>
    </div>`;
  }).join('');
  const ctx = document.getElementById('invChart');
  if (ctx) {
    const labels = data.investments.map(inv => inv.ticker);
    const values = data.investments.map(inv => inv.shares * inv.currentPrice);
    const colors = ['#96AA9A','#7a9a7e','#b5c4b8','#c4956a','#8fa89a','#a8bfa8','#6d8a72','#889a8a'];
    charts.inv = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors.slice(0, values.length), borderWidth: 2, borderColor: '#1a1f2e' }] },
      options: { ...CHART_DEFAULTS, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#6b7394', boxWidth: 12, padding: 14 } } } }
    });
  }
}
function addInvestment() {
  const ticker = document.getElementById('inv-ticker').value.trim().toUpperCase();
  const shares = parseFloat(document.getElementById('inv-shares').value);
  const costBasis = parseFloat(document.getElementById('inv-cost').value);
  const currentPrice = parseFloat(document.getElementById('inv-price').value);
  if (!ticker) return toast('Enter a ticker or name', 'error');
  if (!shares||shares<=0) return toast('Enter shares', 'error');
  if (!costBasis||costBasis<=0) return toast('Enter cost basis', 'error');
  if (!currentPrice||currentPrice<=0) return toast('Enter current price', 'error');
  data.investments.push({ id: Date.now(), ticker, shares, costBasis, currentPrice });
  saveData();
  renderInvestments();
  toast('Investment added', 'success');
  document.getElementById('inv-ticker').value = '';
  document.getElementById('inv-shares').value = '';
  document.getElementById('inv-cost').value = '';
  document.getElementById('inv-price').value = '';
}
function deleteInvestment(id) {
  data.investments = data.investments.filter(i => i.id !== id);
  saveData();
  renderInvestments();
  toast('Investment removed', 'success');
}
function refreshPrices() {
  data.investments.forEach(inv => {
    inv.currentPrice = inv.currentPrice * (1 + (Math.random() - 0.5) * 0.1);
  });
  saveData();
  renderInvestments();
  toast('Prices refreshed (simulated)', 'success');
}

/* ═══════════════════════════════════════════════
   BACKUP & RESTORE
═══════════════════════════════════════════════ */
function backupData() {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budgetpro_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup downloaded', 'success');
}
function restoreData() {
  document.getElementById('restore-input').click();
}
function handleRestore(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d && d.transactions) {
        data = d;
        if (!data.customCategories) data.customCategories = [];
        saveData();
        syncCustomCategories();
        renderAll();
        toast('Data restored', 'success');
      } else {
        toast('Invalid backup file', 'error');
      }
    } catch { toast('Invalid JSON file', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}
function syncCustomCategories() {
  (data.customCategories || []).forEach(cat => {
    if (!CAT_COLORS[cat]) {
      CAT_COLORS[cat] = '#96AA9A';
      CATEGORIES.push(cat);
    }
  });
  populateAllSelects();
}

/* ═══════════════════════════════════════════════
   CSV EXPORT
═══════════════════════════════════════════════ */
function exportCSV() {
  if (!data.transactions.length) return toast('No transactions to export','error');
  const headers = ['Date','Type','Category','Amount','Description'];
  const rows = data.transactions.map(t => [
    t.date,
    t.type,
    t.category,
    t.amount.toFixed(2),
    `"${t.description.replace(/"/g,'""')}"`,
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budgetpro_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported!','success');
}

/* ═══════════════════════════════════════════════
   CATEGORY MANAGER
═══════════════════════════════════════════════ */
function renderCategories() {
  const el = document.getElementById('category-list');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(cat => {
    const isDefault = ['Food','Transport','Shopping','Bills','Entertainment','Healthcare','Education','Utilities','Rent','Salary','Freelance','Other'].includes(cat);
    return `<span class="category-chip">
      ${esc(cat)}
      ${isDefault ? '' : `<button class="remove-chip" onclick="removeCategory('${esc(cat)}')">✕</button>`}
    </span>`;
  }).join('');
}
function addCategory() {
  const name = document.getElementById('new-category-name').value.trim();
  if (!name) return toast('Enter a category name', 'error');
  if (CAT_COLORS[name]) return toast('Category already exists', 'error');
  CAT_COLORS[name] = '#96AA9A';
  CATEGORIES.push(name);
  if (!data.customCategories) data.customCategories = [];
  data.customCategories.push(name);
  saveData();
  populateAllSelects();
  renderCategories();
  renderBudgets();
  document.getElementById('new-category-name').value = '';
  toast('Category added', 'success');
}
function removeCategory(name) {
  const idx = CATEGORIES.indexOf(name);
  if (idx === -1) return;
  delete CAT_COLORS[name];
  CATEGORIES.splice(idx, 1);
  if (data.customCategories) {
    const ci = data.customCategories.indexOf(name);
    if (ci !== -1) data.customCategories.splice(ci, 1);
  }
  delete data.budgets[name];
  saveData();
  populateAllSelects();
  renderCategories();
  renderBudgets();
  toast('Category removed', 'success');
}
function populateAllSelects() {
  populateSelect('tx-category', CATEGORIES);
  populateSelect('budget-category', CATEGORIES);
  populateSelect('rec-category', CATEGORIES);
  populateSelect('filter-category', ['All', ...CATEGORIES], 'All');
  populateSelect('edit-category', CATEGORIES);
  populateSelect('sub-category', CATEGORIES);
}

/* ═══════════════════════════════════════════════
   STATISTICS SUMMARY
═══════════════════════════════════════════════ */
function renderStats() {
  const el = document.getElementById('stats-panel');
  if (!el) return;
  const tx = monthTransactions();
  const income = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const count = tx.length;
  const expenseCount = tx.filter(t=>t.type==='expense').length;
  const incomeCount = tx.filter(t=>t.type==='income').length;
  const avgExpense = expenseCount > 0 ? tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0) / expenseCount : 0;
  const avgIncome = incomeCount > 0 ? tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0) / incomeCount : 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyAvg = expense / daysInMonth;
  const projection = dailyAvg * daysInMonth;
  const savings = income - expense;

  el.innerHTML = `<div class="stats-grid">
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Transactions</div>
      <div style="font-size:1.5rem;font-weight:800;color:var(--accent);">${count}</div>
      <div style="font-size:.75rem;color:var(--muted);">${incomeCount} income · ${expenseCount} expense</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Avg per Transaction</div>
      <div style="font-size:1rem;font-weight:700;color:var(--expense);">Expense: ${fmt(avgExpense)}</div>
      <div style="font-size:1rem;font-weight:700;color:var(--income);">Income: ${fmt(avgIncome)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Daily Average Spend</div>
      <div style="font-size:1.5rem;font-weight:800;color:var(--accent4);">${fmt(dailyAvg)}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Month Projection</div>
      <div style="font-size:1.5rem;font-weight:800;color:${projection > income ? 'var(--expense)' : 'var(--income)'};">${fmt(projection)}</div>
      <div style="font-size:.75rem;color:var(--muted);">${projection > income ? 'Exceeds income' : 'Within budget'}</div>
    </div>
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Savings Rate</div>
      <div style="font-size:1.5rem;font-weight:800;color:${savings>=0?'var(--income)':'var(--expense)'};">${income > 0 ? ((savings/income)*100).toFixed(1) : 0}%</div>
      <div style="font-size:.75rem;color:var(--muted);">${fmt(savings)} saved</div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   SPENDING INSIGHTS
═══════════════════════════════════════════════ */
function renderInsights() {
  const el = document.getElementById('insights-panel-content');
  if (!el) return;

  const tx = data.transactions;
  const currentExpenses = monthTransactions().filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);

  let prevMonth = currentMonth - 1, prevYear = currentYear;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }
  const prevExpenses = tx.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear && t.type === 'expense';
  }).reduce((s,t) => s + t.amount, 0);

  const income = monthTransactions().filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expense = currentExpenses;
  const savings = income - expense;

  const catSpend = {};
  monthTransactions().filter(t => t.type === 'expense').forEach(t => {
    catSpend[t.category] = (catSpend[t.category]||0) + t.amount;
  });
  const topCat = Object.entries(catSpend).sort((a,b) => b[1] - a[1]);
  const biggestCategory = topCat.length ? topCat[0][0] : null;

  const prevCatSpend = {};
  tx.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear && t.type === 'expense';
  }).forEach(t => {
    prevCatSpend[t.category] = (prevCatSpend[t.category]||0) + t.amount;
  });

  let trendText = '';
  if (prevExpenses > 0) {
    const change = ((currentExpenses - prevExpenses) / prevExpenses * 100).toFixed(1);
    if (change > 0) trendText = `↑ ${change}% more than last month`;
    else if (change < 0) trendText = `↓ ${Math.abs(change)}% less than last month`;
    else trendText = `Same as last month`;
  }

  const catChanges = [];
  Object.entries(catSpend).forEach(([cat, curr]) => {
    const prev = prevCatSpend[cat] || 0;
    if (prev > 0) {
      const ch = ((curr - prev) / prev * 100).toFixed(0);
      catChanges.push({ cat, change: parseFloat(ch) });
    } else if (curr > 0) {
      catChanges.push({ cat, change: 100 });
    }
  });
  catChanges.sort((a,b) => Math.abs(b.change) - Math.abs(a.change));
  const biggestRise = catChanges.find(c => c.change > 0);
  const biggestDrop = catChanges.find(c => c.change < 0);

  let insightsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">`;

  insightsHtml += `
    <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">This Month</div>
      <div style="display:flex;justify-content:space-between;font-size:.85rem;">
        <span>Income</span><span style="color:var(--income);font-weight:700;">${fmt(income)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.85rem;">
        <span>Expenses</span><span style="color:var(--expense);font-weight:700;">${fmt(expense)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.85rem;border-top:1px solid var(--border);padding-top:6px;margin-top:6px;">
        <span>Saved</span><span style="color:${savings>=0?'var(--income)':'var(--expense)'};font-weight:700;">${fmt(savings)}</span>
      </div>
    </div>`;

  if (trendText) {
    insightsHtml += `
      <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Spending Trend</div>
        <div style="font-size:1.1rem;font-weight:700;${currentExpenses > prevExpenses ? 'color:var(--expense)' : 'color:var(--income)'}">${trendText}</div>
      </div>`;
  }

  if (biggestCategory) {
    insightsHtml += `
      <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Top Category</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--accent);">${biggestCategory}</div>
        <div style="font-size:.8rem;color:var(--muted);">${fmt(catSpend[biggestCategory])} this month</div>
      </div>`;
  }

  if (biggestRise) {
    insightsHtml += `
      <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Biggest Rise</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--expense);">${biggestRise.cat}</div>
        <div style="font-size:.8rem;color:var(--muted);">↑ ${biggestRise.change}% vs last month</div>
      </div>`;
  }

  if (biggestDrop) {
    insightsHtml += `
      <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Biggest Drop</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--income);">${biggestDrop.cat}</div>
        <div style="font-size:.8rem;color:var(--muted);">↓ ${Math.abs(biggestDrop.change)}% vs last month</div>
      </div>`;
  }

  const totalBudgeted = Object.values(data.budgets).reduce((s,v)=>s+v,0);
  if (totalBudgeted > 0) {
    const spent = monthTransactions().filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const pct = Math.min((spent/totalBudgeted)*100,100);
    insightsHtml += `
      <div class="insight-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Budget Usage</div>
        <div style="display:flex;justify-content:space-between;font-size:.85rem;">
          <span>${fmt(spent)}</span><span>${fmt(totalBudgeted)}</span>
        </div>
        <div class="progress-bar" style="height:6px;margin-top:6px;">
          <div class="progress-fill ${pct>=100?'over':pct>=80?'warning':''}" style="width:${pct}%"></div>
        </div>
        <div style="font-size:.75rem;color:var(--muted);text-align:right;margin-top:2px;">${pct.toFixed(0)}% of total budget</div>
      </div>`;
  }

  insightsHtml += `</div>`;
  el.innerHTML = insightsHtml;
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function renderAll() {
  processIncomeSources();
  renderKPI();
  renderTable();
  renderBudgets();
  renderGoals();
  renderCategories();
  renderStats();
  processRecurring();
  if (document.getElementById('section-dashboard').style.display !== 'none') {
    rebuildLineChart(); rebuildDonutChart(); rebuildBarChart(); renderInsights();
  }
}

function fmt(n) {
  return '৳' + Number(n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let toastTimer;
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.innerHTML = (type === 'success' ? '✅' : '❌') + ' ' + msg;
  t.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 3000);
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('edit-modal')) closeEdit();
});

function initApp() {
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('month-label').textContent = `${MONTHS[currentMonth]} ${currentYear}`;

  const now = new Date();
  const monthInput = document.getElementById('filter-month');
  if (monthInput) {
    monthInput.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }

  (data.customCategories || []).forEach(cat => {
    if (!CAT_COLORS[cat]) {
      CAT_COLORS[cat] = '#96AA9A';
      CATEGORIES.push(cat);
    }
  });

  populateAllSelects();

  renderAll();
  showSection('dashboard');
}

/* ═══════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════ */
const ADMIN_STORAGE_KEY = 'budgetPro_adminKey';

function getAdminKey() {
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!stored) { localStorage.setItem(ADMIN_STORAGE_KEY, 'mawa123'); return 'mawa123'; }
  return stored;
}

function setAdminKey(k) { localStorage.setItem(ADMIN_STORAGE_KEY, k); }

function adminAuthenticate() {
  const input = document.getElementById('admin-key-input');
  const err = document.getElementById('admin-key-error');
  if (input.value === getAdminKey()) {
    sessionStorage.setItem('budgetPro_admin_auth', 'true');
    err.style.display = 'none';
    document.getElementById('admin-key-panel').style.display = 'none';
    document.getElementById('admin-panel').style.display = '';
    document.getElementById('admin-key-input').value = '';
    renderAdminUsers();
  } else {
    err.style.display = '';
    input.value = '';
  }
}

function adminLogout() {
  sessionStorage.removeItem('budgetPro_admin_auth');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-user-detail').style.display = 'none';
  document.getElementById('admin-key-panel').style.display = '';
  document.getElementById('admin-key-error').style.display = 'none';
}

function showAdminSection() {
  const authed = sessionStorage.getItem('budgetPro_admin_auth');
  if (authed === 'true') {
    document.getElementById('admin-key-panel').style.display = 'none';
    document.getElementById('admin-panel').style.display = '';
    document.getElementById('admin-user-detail').style.display = 'none';
    renderAdminUsers();
  } else {
    document.getElementById('admin-key-panel').style.display = '';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-user-detail').style.display = 'none';
    document.getElementById('admin-key-error').style.display = 'none';
    document.getElementById('admin-key-input').value = '';
  }
}

function getRegisteredUsers() {
  const users = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('budgetPro_') && key !== ADMIN_STORAGE_KEY && key !== 'budgetPro_sessionBackup') {
      const username = key.slice('budgetPro_'.length);
      if (username) users.push(username);
    }
  }
  return users;
}

function loadUserData(username) {
  try {
    return JSON.parse(localStorage.getItem('budgetPro_' + username));
  } catch { return null; }
}

function renderAdminUsers() {
  const container = document.getElementById('admin-user-list');
  const users = getRegisteredUsers();
  if (!users.length) {
    container.innerHTML = '<div class="empty"><span class="emoji">👥</span>No registered users found.</div>';
    return;
  }
  container.innerHTML = users.map(u => {
    const ud = loadUserData(u);
    const incSources = ud && ud.incomeSources ? ud.incomeSources : [];
    const monthlyTotal = incSources.reduce((s, src) => {
      if (src.frequency === 'monthly') return s + src.amount;
      if (src.frequency === 'yearly') return s + src.amount / 12;
      return s;
    }, 0);
    const sourceCount = incSources.length;
    const hasIncome = ud && ud.transactions ? ud.transactions.filter(t => t.type === 'income').length : 0;
    const totalTx = ud && ud.transactions ? ud.transactions.length : 0;
    return `<div class="admin-user-card" onclick="adminShowUserDetail('${u}')">
      <div class="auc-head">
        <span class="auc-name">${esc(u)}</span>
        <span class="auc-avatar">${u.charAt(0).toUpperCase()}</span>
      </div>
      <div class="auc-stats">
        <span>Income sources: <strong>${sourceCount}</strong></span>
        <span>Income/mo: <strong>${fmt(monthlyTotal)}</strong></span>
        <span>Transactions: <strong>${totalTx}</strong></span>
      </div>
    </div>`;
  }).join('');
}

function adminShowUserDetail(username) {
  const ud = loadUserData(username);
  if (!ud) return toast('Could not load user data', 'error');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-user-detail').style.display = '';
  document.getElementById('admin-detail-title').textContent = '👤 ' + username + ' — Income Sources';

  const sources = ud.incomeSources || [];
  const totalMonthly = sources.reduce((s, src) => {
    if (src.frequency === 'monthly') return s + src.amount;
    if (src.frequency === 'yearly') return s + src.amount / 12;
    return s;
  }, 0);
  const totalYearly = sources.reduce((s, src) => {
    if (src.frequency === 'monthly') return s + src.amount * 12;
    if (src.frequency === 'yearly') return s + src.amount;
    return s + src.amount;
  }, 0);

  const container = document.getElementById('admin-detail-content');
  if (!sources.length) {
    container.innerHTML = `<div class="admin-detail-header">
      <span class="adh-avatar">${username.charAt(0).toUpperCase()}</span>
      <div class="adh-info">
        <div class="adh-name">${esc(username)}</div>
        <div class="adh-sub">No income sources declared</div>
      </div>
    </div>
    <div class="empty"><span class="emoji">💵</span>This user hasn't declared any income sources.</div>`;
    return;
  }

  const iconMap = { 'Salary/Wages':'💼', 'Freelance':'✍️', 'Business':'🏢', 'Investment':'📈', 'Rental':'🏠', 'Passive':'🔄', 'Other':'💵' };

  container.innerHTML = `<div class="admin-detail-header">
    <span class="adh-avatar">${username.charAt(0).toUpperCase()}</span>
    <div class="adh-info">
      <div class="adh-name">${esc(username)}</div>
      <div class="adh-sub">${sources.length} income source${sources.length>1?'s':''} · ${fmt(totalMonthly)}/mo · ${fmt(totalYearly)}/yr</div>
    </div>
  </div>
  <div style="margin-bottom:12px;font-size:.85rem;color:var(--muted);">Declared Income Sources</div>
  ${sources.map(src => {
    const icon = iconMap[src.type] || '💵';
    const moAmt = src.frequency === 'yearly' ? src.amount / 12 : src.amount;
    return `<div class="admin-inc-item">
      <span class="aii-icon">${icon}</span>
      <div class="aii-body">
        <div class="aii-name">${esc(src.name)}</div>
        <div class="aii-meta">${esc(src.type)} · ${src.frequency}${src.description ? ' · ' + esc(src.description) : ''}</div>
      </div>
      <div class="aii-amount">${fmt(src.amount)}</div>
      <div style="font-size:.72rem;color:var(--muted);text-align:right;">
        <div>${fmt(moAmt)}/mo</div>
      </div>
    </div>`;
  }).join('')}
  <div class="admin-inc-item" style="border-bottom:none;margin-top:8px;padding-top:16px;border-top:2px solid var(--border);">
    <span class="aii-icon">📊</span>
    <div class="aii-body">
      <div class="aii-name">Total</div>
      <div class="aii-meta">All sources combined</div>
    </div>
    <div class="aii-amount total">${fmt(totalMonthly)}/mo</div>
    <div style="font-size:.78rem;color:var(--muted);text-align:right;">${fmt(totalYearly)}/yr</div>
  </div>`;
}

function adminBackToList() {
  document.getElementById('admin-user-detail').style.display = 'none';
  document.getElementById('admin-panel').style.display = '';
  renderAdminUsers();
}

/* ═══════════════════════════════════════════════
   THEME TOGGLE (Dark / Light)
═══════════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.classList.remove('dark-mode', 'light-mode');
  document.documentElement.classList.add(theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark-mode' ? '🌙' : '☀️';
}

function toggleTheme() {
  const current = document.documentElement.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
  const next = current === 'dark-mode' ? 'light-mode' : 'dark-mode';
  applyTheme(next);
  localStorage.setItem('budgetPro_theme', next);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('budgetPro_theme') || 'dark-mode';
  applyTheme(savedTheme);
  const session = sessionStorage.getItem('budgetPro_session');
  if (session) {
    const users = getUsers();
    if (users.some(u => u.username === session)) {
      currentUser = session;
      data = loadData();
      document.getElementById('auth-overlay').classList.add('hidden');
      document.getElementById('user-name').textContent = session;
      document.getElementById('user-avatar').textContent = session.charAt(0).toUpperCase();
      initApp();
      return;
    }
  }
  const users = getUsers();
  if (users.length === 0) showRegister();
  else showLogin();
});

function populateSelect(id, options, defaultVal) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = options.map(o => {
    const v = o === 'All' ? '' : o;
    return `<option value="${v}">${o}</option>`;
  }).join('');
  if (defaultVal !== undefined) sel.value = defaultVal === 'All' ? '' : defaultVal;
}


