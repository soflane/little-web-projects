import React, { useState, useEffect, useCallback } from 'react';
import { EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import { getUsers } from '../api/zammad';

const INTERNAL_EMAIL = import.meta.env.VITE_INTERNAL_EMAIL || 'internal@example.com';

interface EmailSelectProps {
  onSelect: (email: string) => void;
  value?: string;
}

export default function EmailSelect({ onSelect, value }: EmailSelectProps) {
  const [users, setUsers] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const debounce = useCallback((term: string) => {
    const timer = setTimeout(() => setDebouncedSearch(term), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  useEffect(() => {
    debounce(search);
  }, [search, debounce]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const emails = await getUsers();
        setUsers(emails);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (value) {
      setSearch(value);
      if (value === INTERNAL_EMAIL) {
        setShowCustom(false);
      } else if (!users.includes(value)) {
        setShowCustom(true);
        setCustomEmail(value);
      }
    }
  }, [value, users, INTERNAL_EMAIL]);

  const filteredEmails = users.filter(email =>
    email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleSelect = (email: string) => {
    setSearch(email);
    setShowCustom(false);
    onSelect(email);
    setIsOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomEmail(val);
    setSearch(val);
    onSelect(val);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const selectedEmail = showCustom ? customEmail : search;

  const emailErrorId = 'email-error';
  const hasEmailError = !isValidEmail(selectedEmail) && selectedEmail;
  const hasCustomEmailError = !isValidEmail(customEmail) && customEmail;

  return (
    <div className="relative w-full">
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
        Customer E-mail
      </label>
      <input
        id="email"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder="Search or select email..."
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={hasEmailError ? "true" : undefined}
        aria-describedby={hasEmailError ? emailErrorId : undefined}
        className={`w-full px-4 sm:px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 disabled:opacity-50 ${
          hasEmailError ? 'border-red-500 dark:border-red-500' : ''
        }`}
        disabled={loading}
      />
      {!loading && isOpen && (
        <ul 
          role="listbox" 
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 sm:max-h-60 overflow-auto transition-all duration-200 opacity-100 transform scale-100"
        >
          <li
            key="internal"
            role="option"
            className="px-4 sm:px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors duration-150 text-gray-900 dark:text-gray-100"
            onClick={() => handleSelect(INTERNAL_EMAIL)}
          >
            <UserIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            My internal e-mail ({INTERNAL_EMAIL})
          </li>
          <li
            key="custom"
            role="option"
            className="px-4 sm:px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center transition-colors duration-150 text-gray-900 dark:text-gray-100"
            onClick={() => {
              setShowCustom(true);
              setIsOpen(false);
            }}
          >
            <UserIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            Enter a new e-mail…
          </li>
          {filteredEmails.length > 0 && (
            <>
              {filteredEmails.map((email) => (
                <li
                  key={email}
                  role="option"
                  className="px-4 sm:px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center transition-colors duration-150 text-gray-900 dark:text-gray-100"
                  onClick={() => handleSelect(email)}
                >
                  <UserIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                  {email}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
      {showCustom && (
        <input
          type="email"
          id="custom-email"
          value={customEmail}
          onChange={handleCustomChange}
          placeholder="Enter custom email"
          aria-invalid={hasCustomEmailError ? "true" : undefined}
          aria-describedby={hasCustomEmailError ? emailErrorId : undefined}
          className={`w-full px-4 sm:px-3 py-3 sm:py-2 mt-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 ${
            hasCustomEmailError ? 'border-red-500 dark:border-red-500' : ''
          }`}
        />
      )}
      {hasEmailError && (
        <p id={emailErrorId} className="mt-1 text-sm text-red-600 dark:text-red-400">Please enter a valid email address.</p>
      )}
    </div>
  );
}
