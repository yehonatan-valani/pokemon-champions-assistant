import { useState } from 'react';

import './App.css';

import DamageCalculatorPage from './features/calculator/DamageCalculatorPage';
import TeamPage from './features/team/TeamPage';

type AppPage = 'calculator' | 'team';

function App() {
  const [currentPage, setCurrentPage] =
    useState<AppPage>('calculator');

  return (
    <div className="app-shell">
      <nav className="app-navigation">
        <button
          type="button"
          className={
            currentPage === 'calculator'
              ? 'navigation-button active'
              : 'navigation-button'
          }
          onClick={() =>
            setCurrentPage('calculator')
          }
        >
          Calculator
        </button>

        <button
          type="button"
          className={
            currentPage === 'team'
              ? 'navigation-button active'
              : 'navigation-button'
          }
          onClick={() =>
            setCurrentPage('team')
          }
        >
          My Team
        </button>
      </nav>

      {currentPage === 'calculator' && (
        <DamageCalculatorPage />
      )}

      {currentPage === 'team' && <TeamPage />}
    </div>
  );
}

export default App;