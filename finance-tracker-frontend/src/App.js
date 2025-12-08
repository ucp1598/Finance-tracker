import React, { useState } from 'react';
import Dashboard from './Dashboard';
import EnhancedSearch from './EnhancedSearch';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <nav className="app-nav">
        <div className="nav-content">
          <div className="nav-links">
            <button onClick={() => setCurrentView('dashboard')} className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}>
              📊 Dashboard
            </button>
            <button onClick={() => setCurrentView('search')} className={`nav-button ${currentView === 'search' ? 'active' : ''}`}>
              🔍 Search
            </button>
          </div>

          <h1 className="app-title">
            💰 Finance Tracker
          </h1>
        </div>
      </nav>

      {/* Content */}
      <div className="app-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'search' && <EnhancedSearch />}
      </div>
    </div>
  );
}

export default App;
