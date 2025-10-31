import React, { useState, useEffect, useCallback } from 'react';
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

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Customer E-mail
      </label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder="Search or select email..."
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
          !isValidEmail(selectedEmail) ? 'border-red-500' : ''
        }`}
        disabled={loading}
      />
      {!loading && isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <li
            key="internal"
            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            onClick={() => handleSelect(INTERNAL_EMAIL)}
          >
            My internal e-mail ({INTERNAL_EMAIL})
          </li>
          <li
            key="custom"
            className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-t border-gray-200"
            onClick={() => {
              setShowCustom(true);
              setIsOpen(false);
            }}
          >
            Enter a new e-mail…
          </li>
          {filteredEmails.length > 0 && (
            <>
              {filteredEmails.map((email) => (
                <li
                  key={email}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-t border-gray-200"
                  onClick={() => handleSelect(email)}
                >
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
          value={customEmail}
          onChange={handleCustomChange}
          placeholder="Enter custom email"
          className={`w-full px-3 py-2 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
            !isValidEmail(customEmail) ? 'border-red-500' : ''
          }`}
        />
      )}
      {!isValidEmail(selectedEmail) && selectedEmail && (
        <p className="mt-1 text-sm text-red-600">Please enter a valid email address.</p>
      )}
    </div>
  );
}
