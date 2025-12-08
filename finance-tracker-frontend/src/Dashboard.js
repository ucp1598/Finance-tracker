import React, { useEffect, useState } from 'react';
import config from './config.js';
import axios from 'axios';
import './Dashboard.css';
import CreditCardSummary from './components/CreditCardSummary';
import OptionsEditor from './components/OptionsEditor';

const userId = '68d669f0d712f627d829c474';
const currentDate = new Date();
const initialMonth = currentDate.getMonth() + 1;
const initialYear = currentDate.getFullYear();

const initialFormState = {
  date: '',
  type: 'expense',
  mode: '',
  payee: '',
  paymentMethod: '',
  paymentApp: '',
  expenseType: '',
  needsWants: '',
  amount: '',
  remarks: '',
  creditCardName: '',
  isCredirCardExpense: false
};

function Dashboard() {
  // State management
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [account, setAccount] = useState(null);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    startingBalance: 0,
    currentBalance: 0
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState(initialFormState);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteClickCount, setDeleteClickCount] = useState({});
  const [deleteTimeouts, setDeleteTimeouts] = useState({});
  const [quickSearch, setQuickSearch] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [showQuickResults, setShowQuickResults] = useState(false);

  // State for editable options
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [needsWantsOptions, setNeedsWantsOptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentApps, setPaymentApps] = useState([]);

  // State for the options editor modal
  const [editorState, setEditorState] = useState({
    show: false,
    key: '',
    title: '',
    options: [],
    setter: null
  });

  // Function to load options from localStorage or set defaults
  const loadOptions = (key, defaultOptions, setter) => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setter(JSON.parse(stored));
    } else {
      setter(defaultOptions);
      localStorage.setItem(key, JSON.stringify(defaultOptions));
    }
  };

  // Keep old modes for backward compatibility in dropdowns if needed, or remove
  const [modes] = useState([]);
  const [creditCardSummary, setCreditCardSummary] = useState([]);

  // Helper functions
  const getMonthYearString = (m, y) => `${y}-${m.toString().padStart(2, '0')}`;

  const fetchCreditCardSummary = async (selectedMonth = month, selectedYear = year) => {
    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/api/creditcards/summary/${userId}?month=${selectedMonth}&year=${selectedYear}`
      );
      setCreditCardSummary(res.data.cards);
    } catch (error) {
      setCreditCardSummary([]);
    }
  };

  const fetchAccount = async (selectedMonth = month, selectedYear = year) => {
    try {
      const monthYear = getMonthYearString(selectedMonth, selectedYear);
      const res = await axios.get(`${config.API_BASE_URL}/api/accounts/${userId}/${monthYear}`);
      setAccount(res.data);
      setBalanceForm({
        startingBalance: res.data.startingBalance,
        currentBalance: res.data.currentBalance
      });
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

  const fetchSummary = async (selectedMonth = month, selectedYear = year) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/api/transactions/summary/${userId}?month=${selectedMonth}&year=${selectedYear}`
      );
      setSummary(res.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
    fetchAccount();
    fetchCreditCardSummary();

    // Load all editable options from localStorage
    loadOptions('expenseTypes', ["Food", "Essentials", "Travel", "Investment", "Entertainment", "Laundry", "Saved", "Fund Transfer"], setExpenseTypes);
    loadOptions('needsWantsOptions', ["Needs", "Wants", "Savings", "Invested", "Fund Transfer"], setNeedsWantsOptions);
    loadOptions('paymentMethods', ["UPI", "UPI Coral 4006", "SBI 8359", "Cash", "Coral 1007", "Coral 4006", "MMT 4005"], setPaymentMethods);
    loadOptions('paymentApps', ["CRED", "GPay", "Paytm", "Mobikwik", "Amazon", "Online Cash"], setPaymentApps);
  }, [month, year]);

  // Navigation functions
  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  // Quick search function
  const handleQuickSearch = async (searchTerm) => {
    setQuickSearch(searchTerm);
    if (searchTerm.length < 2) {
      setQuickSearchResults([]);
      setShowQuickResults(false);
      return;
    }
    try {
      const params = new URLSearchParams({ search: searchTerm, limit: 5 });
      const res = await axios.get(`${config.API_BASE_URL}/api/transactions/search/${userId}?${params}`);
      setQuickSearchResults(res.data.transactions || []);
      setShowQuickResults(true);
    } catch (error) {
      console.error("Quick search error:", error);
      setQuickSearchResults([]);
    }
  };

  // Form handlers
  const handleAddFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (value === '__EDIT__') {
      handleEditOptions(name);
      return;
    }

    setAddForm({ 
      ...addForm, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleEditOptions = (key) => {
    const optionsMap = {
      expenseType: { title: 'Expense Types', options: expenseTypes, setter: setExpenseTypes },
      needsWants: { title: 'Needs/Wants', options: needsWantsOptions, setter: setNeedsWantsOptions },
      paymentMethod: { title: 'Payment Methods', options: paymentMethods, setter: setPaymentMethods },
      paymentApp: { title: 'Payment Apps', options: paymentApps, setter: setPaymentApps },
    };
    const config = optionsMap[key];
    if (config) {
      setEditorState({ show: true, key, ...config });
    }
  };

  const handleSaveOptions = (key, newOptions) => {
    const config = editorState;
    if (config.setter) {
      config.setter(newOptions);
      localStorage.setItem(key, JSON.stringify(newOptions));
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.payee || !addForm.amount || !addForm.type) {
      setAddError("Payee, Type, and Amount are required.");
      return;
    }
    setAddLoading(true);
    try {
      const payload = { 
        ...addForm, 
        user: userId,
        date: addForm.date ? new Date(addForm.date) : new Date(),
        amount: Number(addForm.amount)
      };
      await axios.post(`${config.API_BASE_URL}/api/transactions/add`, payload);
      await fetchSummary();
      await fetchAccount();
      setAddForm(initialFormState);
    } catch (error) {
      setAddError("Server error. Could not add transaction.");
    }
    setAddLoading(false);
  };

  // Edit/Delete handlers
  const handleEdit = (txn) => {
    setEditingId(txn._id);
    setEditForm({
      date: txn.date.slice(0,10),
      type: txn.type,
      mode: txn.mode || '',
      payee: txn.payee,
      paymentMethod: txn.paymentMethod || '',
      paymentApp: txn.paymentApp || '',
      expenseType: txn.expenseType || '',
      needsWants: txn.needsWants || '',
      amount: txn.amount,
      remarks: txn.remarks || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (value === '__EDIT__') {
      handleEditOptions(name);
      return;
    }

    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSave = async (id) => {
    try {
      const payload = { 
        ...editForm, 
        user: userId,
        date: new Date(editForm.date), 
        amount: Number(editForm.amount) 
      };
      await axios.put(`${config.API_BASE_URL}/api/transactions/${id}`, payload);
      await fetchSummary();
      await fetchAccount();
      setEditingId(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete handler
  const handleDelete = async (id) => {
    const currentCount = deleteClickCount[id] || 0;
    if (currentCount === 0) {
      setDeleteClickCount(prev => ({ ...prev, [id]: 1 }));
      const timeout = setTimeout(() => {
        setDeleteClickCount(prev => {
          const newCount = { ...prev };
          delete newCount[id];
          return newCount;
        });
        setDeleteTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      }, 3000);
      setDeleteTimeouts(prev => ({ ...prev, [id]: timeout }));
    } else {
      try {
        if (deleteTimeouts[id]) clearTimeout(deleteTimeouts[id]);
        await axios.delete(`${config.API_BASE_URL}/api/transactions/${id}`, {
          // Send userId in the body for secure deletion on the backend
          data: { user: userId }
        }); 
        await fetchSummary();
        await fetchAccount();
        setEditingId(null);
        setDeleteClickCount(prev => {
          const newCount = { ...prev };
          delete newCount[id];
          return newCount;
        });
        setDeleteTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const calculateCurrentBalance = () => {
    if (!account || !summary) return account?.currentBalance || 0;
    return account.startingBalance + summary.netFlow;
  };

  const handleBalanceFormChange = (e) => {
    const { name, value } = e.target;
    setBalanceForm(prev => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleSaveBalance = async () => {
    try {
      const monthYear = getMonthYearString(month, year);
      await axios.put(
        `${config.API_BASE_URL}/api/accounts/${userId}/${monthYear}`,
        balanceForm
      );
      await fetchAccount();
      setEditingBalance(false);
    } catch (error) {
      console.error("Error updating balance:", error);
      // You could add user-facing error handling here
    }
  };

  // Render goal progress bar
  const renderGoalProgress = (goal, label, color) => {
    const percentage = goal.target > 0 ? (goal.amount / goal.target) * 100 : 0;
    return (
      <div className="goal-progress">
        <div className="goal-header">
          <span className="goal-label">{label}</span>
          <span>₹{goal.amount} / ₹{goal.target.toFixed(0)} ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="goal-bar-container">
          <div 
            className="goal-bar"
            style={{ 
              width: `${Math.min(percentage, 100)}%`, 
              backgroundColor: color
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div>Loading your data...</div>
      </div>
    );
  }

  if (!summary) return <div className="empty-state">No data.</div>;

  return (
    <div className="dashboard-container">
      <OptionsEditor
        show={editorState.show}
        title={editorState.title}
        options={editorState.options}
        onSave={(newOptions) => handleSaveOptions(editorState.key, newOptions)}
        onClose={() => setEditorState({ ...editorState, show: false })}
      />

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">💰 Budget Tracker</h1>
        <h2 className="dashboard-subtitle">{getMonthName(month)} {year}</h2>
      </div>
      {/* Month Navigation */}
      <div className="nav-buttons">
        <button className="nav-button primary" onClick={goToPreviousMonth}>
          ← Previous
        </button>
        <button className="nav-button success" onClick={goToCurrentMonth}>
          Current Month
        </button>
        <button className="nav-button primary" onClick={goToNextMonth}>
          Next →
        </button>
      </div>
      {/* Quick Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Quick search transactions... (payee, remarks, category)"
            value={quickSearch}
            onChange={(e) => handleQuickSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowQuickResults(false), 200)}
            onFocus={() => quickSearch.length >= 2 && setShowQuickResults(true)}
          />
          {/* Quick Search Results Dropdown */}
          {showQuickResults && quickSearchResults.length > 0 && (
            <div className="search-dropdown">
              <div className="search-dropdown-header">
                Recent matches ({quickSearchResults.length})
              </div>
              {quickSearchResults.map(txn => (
                <div 
                  key={txn._id}
                  className="search-result-item"
                  onClick={() => {
                    setQuickSearch('');
                    setShowQuickResults(false);
                  }}
                >
                  <div>
                    <div className="search-result-main">{txn.payee}</div>
                    <div className="search-result-details">
                      {new Date(txn.date).toLocaleDateString()} • {txn.expenseType || txn.type}
                      {txn.remarks && ` • ${txn.remarks.slice(0, 30)}${txn.remarks.length > 30 ? '...' : ''}`}
                    </div>
                  </div>
                  <div className={`search-result-amount ${txn.type === 'income' ? 'income' : 'expense'}`}>
                    ₹{txn.amount}
                  </div>
                </div>
              ))}
              <div className="search-dropdown-footer">
                <button
                  className="search-advanced-link"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-search', { detail: quickSearch }));
                  }}
                >
                  See all results in Advanced Search →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Summary Section */}
      <div className="summary-grid">
        {account && (
          <>
            <div className="summary-card purple">
              <div className="summary-label">
                Opening Balance
                {!editingBalance ? (
                  <button onClick={() => setEditingBalance(true)} className="edit-balance-button">
                    Edit
                  </button>
                ) : (
                  <button onClick={handleSaveBalance} className="edit-balance-button save">
                    Save
                  </button>
                )}
              </div>
              {editingBalance ? (
                <div className="summary-value-edit">
                  <span>₹</span>
                  <input
                    type="number"
                    name="startingBalance"
                    value={balanceForm.startingBalance}
                    onChange={handleBalanceFormChange}
                    className="balance-input"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="summary-value">₹{account.startingBalance}</div>
              )}
            </div>
            <div className="summary-card green">
              <div className="summary-label">Current Balance</div>
              <div className="summary-value">₹{calculateCurrentBalance()}</div>
            </div>
          </>
        )}
        <div className="summary-card blue">
          <div className="summary-label">Total Income</div>
          <div className="summary-value">₹{summary.totalIncome}</div>
        </div>
        <div className="summary-card red">
          <div className="summary-label">Total Expenses</div>
          <div className="summary-value">₹{summary.totalExpenses}</div>
        </div>
        <div className="summary-card orange">
          <div className="summary-label">Credit Card Bills</div>
          <div className="summary-value">₹{summary.creditCardPayments}</div>
        </div>
      </div>
      {/* Credit Card Summary */}
      <CreditCardSummary cards={creditCardSummary} />
      {/* Add Transaction Form */}
      <div className="form-container">
        <h3 className="form-title">Add New Transaction</h3>
        <form onSubmit={handleAddTransaction}>
          <div className="form-grid">
            <input 
              type="date" 
              name="date" 
              value={addForm.date} 
              onChange={handleAddFormChange}
              className="form-input"
            />
            <select 
              name="type" 
              value={addForm.type} 
              onChange={handleAddFormChange} 
              className="form-select"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="saved">Saved</option>
              <option value="credit_card_payment">Credit Card Payment</option>
            </select>
            <input 
              name="payee" 
              placeholder={addForm.type === 'income' ? 'From (who paid)' : 'To (who received)'} 
              value={addForm.payee} 
              onChange={handleAddFormChange}
              className="form-input"
              required
            />
            {addForm.type === 'expense' && (
              <select 
                name="expenseType" 
                value={addForm.expenseType} 
                onChange={handleAddFormChange} 
                className="form-select"
              >
                <option value="">Expense Type</option>
                {expenseTypes.map(type => (
                  <option value={type} key={type}>{type}</option>
                ))}
                <option value="__EDIT__" className="edit-option-trigger">-- Edit Options --</option>
              </select>
            )}
            <select
              name="paymentMethod"
              value={addForm.paymentMethod}
              onChange={handleAddFormChange}
              className="form-select"
            >
              <option value="">Payment Method</option>
              {paymentMethods.map(method => (
                <option value={method} key={method}>{method}</option>
              ))}
              <option value="__EDIT__" className="edit-option-trigger">-- Edit Options --</option>
            </select>
            <select
              name="paymentApp"
              value={addForm.paymentApp}
              onChange={handleAddFormChange}
              className="form-select"
            >
              <option value="">Payment App</option>
              {paymentApps.map(app => (
                <option value={app} key={app}>{app}</option>
              ))}
              <option value="__EDIT__" className="edit-option-trigger">-- Edit Options --</option>
            </select>
            <input 
              type="number" 
              name="amount" 
              placeholder="Amount" 
              value={addForm.amount} 
              onChange={handleAddFormChange}
              className="form-input"
              required
            />
            {addForm.type === 'expense' && (
              <select 
                name="needsWants" 
                value={addForm.needsWants} 
                onChange={handleAddFormChange} 
                className="form-select"
              >
                <option value="">Needs/Wants</option>
                {needsWantsOptions.map(option => (
                  <option value={option} key={option}>{option}</option>
                ))}
                <option value="__EDIT__" className="edit-option-trigger">-- Edit Options --</option>
              </select>
            )}
            <input 
              name="remarks" 
              placeholder="Remarks" 
              value={addForm.remarks} 
              onChange={handleAddFormChange}
              className="form-input"
            />
          </div>
          <button 
            type="submit" 
            disabled={addLoading}
            className={`form-button ${addLoading ? 'disabled' : 'primary'}`}
          >
            {addLoading ? "Adding..." : "Add Transaction"}
          </button>
          {addError && (
            <p className="form-error">{addError}</p>
          )}
        </form>
      </div>
      {/* Main Layout: Income Table | Expenses Table | Goals Sidebar */}
      <div className="main-grid">
        {/* Income Table */}
        <div className="table-container">
          <h3 className="table-title">Income</h3>
          <div className="table-wrapper">
            <table className="data-table income">
              <thead className="table-header">
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {summary.income?.map(txn => (
                  <tr key={txn._id} className="table-row">
                    {editingId === txn._id ? (
                      // EDIT MODE
                      <>
                        <td>
                          <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className="table-cell edit-input" />
                        </td>
                        <td>
                          <input name="payee" value={editForm.payee} onChange={handleEditChange} className="table-cell edit-input" />
                        </td>
                        <td>
                          <select name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditChange} className="table-cell edit-input">
                            <option value="">Method</option>
                            {paymentMethods.map(method => <option value={method} key={method}>{method}</option>)}
                          </select>
                        </td>
                        <td>
                          <select name="paymentApp" value={editForm.paymentApp} onChange={handleEditChange} className="table-cell edit-input">
                            <option value="">App</option>
                            {paymentApps.map(app => <option value={app} key={app}>{app}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} className="table-cell edit-input" />
                        </td>
                        <td>
                          <input name="remarks" value={editForm.remarks} onChange={handleEditChange} className="table-cell edit-input" />
                        </td>
                        <td className="actions-cell">
                          <button onClick={() => handleEditSave(txn._id)} className="action-button save">Save</button>
                          <button onClick={handleEditCancel} className="action-button cancel">Cancel</button>
                        </td>
                      </>
                    ) : (
                      // VIEW MODE
                      <>
                        <td>{txn.date.slice(0,10)}</td>
                        <td>{txn.payee}</td>
                        <td>{txn.paymentMethod}{txn.paymentApp ? ` (${txn.paymentApp})` : ''}</td>
                        <td className="amount-cell income">₹{txn.amount}</td>
                        <td>{txn.remarks}</td>
                        <td className="actions-cell">
                          <button onClick={() => handleEdit(txn)} className="action-button edit">Edit</button>
                          <button 
                            onClick={() => handleDelete(txn._id)} 
                            className={`action-button delete ${deleteClickCount[txn._id] ? 'confirm' : ''}`}
                          >
                            {deleteClickCount[txn._id] ? 'Confirm?' : 'Del'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {(!summary.income || summary.income.length === 0) && (
                  <tr>
                    <td colSpan="7" className="empty-state">No income transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Expenses Table */}
        <div className="table-container">
          <h3 className="table-title">Expenses</h3>
          <div className="table-wrapper">
            <table className="data-table expenses">
              <thead className="table-header expenses">
                <tr>
                  <th>Date</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>N/W</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...(summary.expenses || []),
                  ...(summary.savings || []),
                  ...(summary.ccPayments || [])
                ]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(txn => (
                  <tr key={txn._id} className="table-row expenses">
                    {editingId === txn._id ? (
                      // EDIT MODE
                      <>
                        <td>
                          <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className="table-cell edit-input expenses" />
                        </td>
                        <td>
                          <input name="payee" value={editForm.payee} onChange={handleEditChange} className="table-cell edit-input expenses" />
                        </td>
                        <td>
                          <select name="expenseType" value={editForm.expenseType} onChange={handleEditChange} className="table-cell edit-input expenses">
                            <option value="">Type</option>
                            {expenseTypes.map(type => <option value={type} key={type}>{type}</option>)}
                            <option value="__EDIT__" className="edit-option-trigger">-- Edit --</option>
                          </select>
                        </td>
                        <td>
                          <select name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditChange} className="table-cell edit-input expenses">
                            <option value="">Method</option>
                            {paymentMethods.map(method => <option value={method} key={method}>{method}</option>)}
                            <option value="__EDIT__" className="edit-option-trigger">-- Edit --</option>
                          </select>
                        </td>
                        <td>
                          <select name="paymentApp" value={editForm.paymentApp} onChange={handleEditChange} className="table-cell edit-input expenses">
                            <option value="">App</option>
                            {paymentApps.map(app => <option value={app} key={app}>{app}</option>)}
                            <option value="__EDIT__" className="edit-option-trigger">-- Edit --</option>
                          </select>
                        </td>
                        <td>
                          <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} className="table-cell edit-input expenses" />
                        </td>
                        <td>
                          <select name="needsWants" value={editForm.needsWants} onChange={handleEditChange} className="table-cell edit-input expenses">
                            <option value="">N/W</option>
                            {needsWantsOptions.map(option => <option value={option} key={option}>{option}</option>)}
                            <option value="__EDIT__" className="edit-option-trigger">-- Edit --</option>
                          </select>
                        </td>
                        <td>
                          <input name="remarks" value={editForm.remarks} onChange={handleEditChange} className="table-cell edit-input expenses" />
                        </td>
                        <td className="actions-cell">
                          <button onClick={() => handleEditSave(txn._id)} className="action-button save expenses">Save</button>
                          <button onClick={handleEditCancel} className="action-button cancel expenses">Cancel</button>
                        </td>
                      </>
                    ) : (
                      // VIEW MODE
                      <>
                        <td>{txn.date.slice(0,10)}</td>
                        <td>{txn.payee}</td>
                        <td>
                          {txn.expenseType || 
                           (txn.type === 'saved' ? 'Saved' : '') ||
                           (txn.type === 'credit_card_payment' ? 'CC Payment' : 'Expense')}
                        </td>
                        <td>{txn.paymentMethod}{txn.paymentApp ? ` (${txn.paymentApp})` : ''}</td>
                        <td className="amount-cell expense">₹{txn.amount}</td>
                        <td>
                          <span className={`needs-wants-tag expenses ${
                            txn.needsWants === 'Needs' ? 'needs' : 
                            txn.needsWants === 'Wants' ? 'wants' : 
                            txn.needsWants === 'Savings' || txn.type === 'saved' ? 'savings' :
                            txn.needsWants === 'Invested' ? 'invested' :
                            txn.type === 'credit_card_payment' ? 'cc-bill' : ''
                          }`}>
                            {txn.needsWants || 
                             (txn.type === 'saved' ? 'Savings' : '') ||
                             (txn.type === 'credit_card_payment' ? 'CC Bill' : '—')}
                          </span>
                        </td>
                        <td>{txn.remarks}</td>
                        <td className="actions-cell">
                          <button onClick={() => handleEdit(txn)} className="action-button edit expenses">Edit</button>
                          <button 
                            onClick={() => handleDelete(txn._id)} 
                            className={`action-button delete expenses ${deleteClickCount[txn._id] ? 'confirm' : ''}`}
                          >
                            {deleteClickCount[txn._id] ? 'Sure?' : 'Del'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {(!summary.expenses || summary.expenses.length === 0) && 
                 (!summary.savings || summary.savings.length === 0) && 
                 (!summary.ccPayments || summary.ccPayments.length === 0) && (
                  <tr>
                    <td colSpan="8" className="empty-state">No expense transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Goals Sidebar */}
        <div className="goals-sidebar">
          <h3 className="goals-title">Goals</h3>
          {summary.goalProgress && (
            <>
              {renderGoalProgress(summary.goalProgress.needs, 'Needs', '#10b981')}
              {renderGoalProgress(summary.goalProgress.wants, 'Wants', '#f59e0b')}
              {renderGoalProgress(summary.goalProgress.savings, 'Savings', '#3b82f6')}
              {renderGoalProgress(summary.goalProgress.invested, 'Invested', '#8b5cf6')}
            </>
          )}
          <hr className="goal-divider" />
          <h4 className="category-title">Category Breakdown</h4>
          {summary.expensesByType && Object.entries(summary.expensesByType).map(([type, amount]) => (
            <div key={type} className="category-item">
              <span>{type}:</span>
              <span className="category-value">₹{amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
