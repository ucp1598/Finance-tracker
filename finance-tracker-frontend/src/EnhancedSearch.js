import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from './config';

const userId = '68d669f0d712f627d829c474';

function EnhancedSearch() {
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchForm, setSearchForm] = useState({
    search: '',
    type: '',
    expenseType: '',
    mode: '',
    paymentMethod: '',
    paymentApp: '',
    payee: '',
    needsWants: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  const [quickFilters] = useState([
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This year', days: 365 },
  ]);

  const [categories] = useState([
    "Food", "Essentials", "Travel", "Investment", "Entertainment", "Laundry", "Fund Transfer"
  ]);

  const [needsWantsOptions] = useState([
    "Needs", "Wants", "Savings", "Invested", "Fund Transfer"
  ]);

  const [paymentMethods] = useState([
    "UPI", "UPI Coral 4006", "SBI 8359", "Cash", "Coral 1007", "Coral 4006", "MMT 4005"
  ]);

  const [paymentApps] = useState([
    "CRED", "GPay", "Paytm", "Mobikwik", "Amazon", "Online Cash"
  ]);


  // Listen for navigation events from dashboard
  useEffect(() => {
    const handleNavigateToSearch = (event) => {
      if (event.detail) {
        setSearchForm(prev => ({ ...prev, search: event.detail }));
        handleSearch(null, event.detail);
      }
    };

    window.addEventListener('navigate-to-search', handleNavigateToSearch);
    return () => window.removeEventListener('navigate-to-search', handleNavigateToSearch);
  }, []);

  const setQuickDateRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setSearchForm(prev => ({
      ...prev,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10)
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e, searchTerm = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      const formToUse = searchTerm ? { ...searchForm, search: searchTerm } : searchForm;
      
      Object.keys(formToUse).forEach(key => {
        if (formToUse[key]) params.append(key, formToUse[key]);
      });
      
      const res = await axios.get(`${config.API_BASE_URL}/api/transactions/search/${userId}?${params}`);
      console.log('Search response:', res.data);
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ transactions: [], count: 0, totalExpenses: 0, totalIncome: 0 });
    }
    
    setLoading(false);
  };

  const clearSearch = () => {
    setSearchForm({
      search: '', type: '', expenseType: '', mode: '', paymentMethod: '', paymentApp: '', payee: '', needsWants: '',
      startDate: '', endDate: '', minAmount: '', maxAmount: ''
    });
    setSearchResults(null);
  };

  const handleQuickCategory = async (category) => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/transactions/category/${userId}/${category}`);
      const transactions = res.data.transactions || res.data || [];
      const count = res.data.count || transactions.length;
      const totalExpenses = res.data.totalAmount || 0;
      
      setSearchResults({
        transactions: Array.isArray(transactions) ? transactions : [],
        count,
        totalExpenses,
        totalIncome: 0,
        searchQuery: { category }
      });
    } catch (error) {
      console.error("Category search error:", error);
      setSearchResults({ transactions: [], count: 0, totalExpenses: 0, totalIncome: 0 });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '30px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Search Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          color: '#1f2937',
          fontSize: '2.5em',
          fontWeight: '700'
        }}>
          🔍 Advanced Search
        </h1>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '1.1em' }}>
          Search across all your transactions with powerful filters
        </p>
      </div>

      {/* Quick Filters */}
      <div style={{ 
        marginBottom: '30px',
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Quick Filters</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px', color: '#6b7280', fontSize: '0.9em', fontWeight: '500' }}>Date Ranges:</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => setQuickDateRange(filter.days)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div style={{ marginBottom: '8px', color: '#6b7280', fontSize: '0.9em', fontWeight: '500' }}>Categories:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleQuickCategory(category)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontSize: '0.8em',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Search Form */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '25px', 
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Advanced Search</h3>
        <form onSubmit={handleSearch}>
          
          {/* Text Search */}
          <div style={{ marginBottom: '20px' }}>
            <input
              name="search"
              placeholder="Search in payee, remarks, or category..."
              value={searchForm.search}
              onChange={handleFormChange}
              style={{ 
                width: '100%',
                padding: '12px 16px', 
                fontSize: '1em', 
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px', 
            marginBottom: '20px' 
          }}>
            
            <select 
              name="type" 
              value={searchForm.type} 
              onChange={handleFormChange} 
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="saved">Saved</option>
              <option value="credit_card_payment">Credit Card Payment</option>
            </select>

            <select 
              name="expenseType" 
              value={searchForm.expenseType} 
              onChange={handleFormChange} 
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option value={cat} key={cat}>{cat}</option>
              ))}
            </select>

            <select 
              name="needsWants" 
              value={searchForm.needsWants} 
              onChange={handleFormChange} 
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            >
              <option value="">All Needs/Wants</option>
              {needsWantsOptions.map(option => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>

            <select
              name="paymentMethod"
              value={searchForm.paymentMethod}
              onChange={handleFormChange}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            >
              <option value="">All Payment Methods</option>
              {paymentMethods.map(method => (
                <option value={method} key={method}>{method}</option>
              ))}
            </select>

            <select
              name="paymentApp"
              value={searchForm.paymentApp}
              onChange={handleFormChange}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            >
              <option value="">All Payment Apps</option>
              {paymentApps.map(app => (
                <option value={app} key={app}>{app}</option>
              ))}
            </select>
          </div>

          {/* Date and Amount Range */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px', 
            marginBottom: '20px' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>From Date:</label>
              <input
                type="date"
                name="startDate"
                value={searchForm.startDate}
                onChange={handleFormChange}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>To Date:</label>
              <input
                type="date"
                name="endDate"
                value={searchForm.endDate}
                onChange={handleFormChange}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>Min Amount:</label>
              <input
                type="number"
                name="minAmount"
                placeholder="0"
                value={searchForm.minAmount}
                onChange={handleFormChange}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>Max Amount:</label>
              <input
                type="number"
                name="maxAmount"
                placeholder="999999"
                value={searchForm.maxAmount}
                onChange={handleFormChange}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1em',
                fontWeight: '500'
              }}
            >
              {loading ? '⏳ Searching...' : '🔍 Search'}
            </button>
            
            <button
              type="button"
              onClick={clearSearch}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}>
          
          {/* Results Header */}
          <div style={{ 
            padding: '20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: '0', color: '#1f2937' }}>
                Search Results ({searchResults.count || 0} transactions)
              </h3>
              <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                <span style={{ marginRight: '20px' }}>
                  <strong>Expenses:</strong> ₹{(searchResults.totalExpenses || 0).toLocaleString()}
                </span>
                <span>
                  <strong>Income:</strong> ₹{(searchResults.totalIncome || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {searchResults.transactions && Array.isArray(searchResults.transactions) && searchResults.transactions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Payee</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Mode</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>N/W</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.transactions.map((txn, index) => (
                    <tr 
                      key={txn._id} 
                      style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75em',
                          fontWeight: '500',
                          backgroundColor: 
                            txn.type === 'income' ? '#dcfce7' : 
                            txn.type === 'expense' ? '#fee2e2' : 
                            txn.type === 'credit_card_payment' ? '#fef3c7' : '#f3f4f6',
                          color:
                            txn.type === 'income' ? '#166534' : 
                            txn.type === 'expense' ? '#991b1b' : 
                            txn.type === 'credit_card_payment' ? '#92400e' : '#374151'
                        }}>
                          {txn.type.charAt(0).toUpperCase() + txn.type.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{txn.payee}</td>
                      <td style={{ padding: '12px' }}>{txn.expenseType || txn.category || '—'}</td>
                      <td style={{ padding: '12px' }}>{txn.mode || '—'}</td>
                      <td style={{ padding: '12px' }}>{txn.paymentMethod}{txn.paymentApp ? ` (${txn.paymentApp})` : ''}</td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: txn.type === 'income' ? '#10b981' : '#ef4444'
                      }}>
                        ₹{txn.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {txn.needsWants && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '0.75em',
                            fontWeight: '500',
                            backgroundColor: 
                              txn.needsWants === 'Needs' ? '#dcfce7' : 
                              txn.needsWants === 'Wants' ? '#fef3c7' : 
                              txn.needsWants === 'Savings' ? '#dbeafe' :
                              txn.needsWants === 'Invested' ? '#e0e7ff' : '#f3f4f6',
                            color: '#374151'
                          }}>
                            {txn.needsWants}
                          </span>
                        )}
                        {!txn.needsWants && txn.type === 'saved' && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '0.75em',
                            fontWeight: '500',
                            backgroundColor: '#dbeafe',
                            color: '#374151'
                          }}>
                            Savings
                          </span>
                        )}
                        {!txn.needsWants && txn.type === 'credit_card_payment' && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '0.75em',
                            fontWeight: '500',
                            backgroundColor: '#fed7aa',
                            color: '#374151'
                          }}>
                            CC Bill
                          </span>
                        )}
                        {!txn.needsWants && txn.type === 'income' && '—'}
                        {!txn.needsWants && txn.type === 'expense' && '—'}
                      </td>
                      <td style={{ padding: '12px', maxWidth: '200px' }}>
                        <div style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {txn.remarks || '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#6b7280' 
            }}>
              <div style={{ fontSize: '3em', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No transactions found</h3>
              <p style={{ margin: '0' }}>Try adjusting your search criteria or date range</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EnhancedSearch;
