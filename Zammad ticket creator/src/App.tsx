import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import TicketForm from './components/TicketForm';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedTheme);
    if (savedTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          (submitButton as HTMLElement).focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8 transition-colors duration-200`}>
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Zammad Ticket Creator
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Help"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
              {showTooltip && (
                <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 text-sm text-gray-700 dark:text-gray-300">
                  <p>Silent tickets create internal-only notes assigned to customers via email guess, without public visibility.</p>
                  <button
                    onClick={() => setShowTooltip(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <TicketForm />
      </div>
    </div>
  );
}

export default App;
