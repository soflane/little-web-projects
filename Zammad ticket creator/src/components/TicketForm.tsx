import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { EnvelopeIcon, TagIcon, ChatBubbleLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import EmailSelect from './EmailSelect';
import { createTicket } from '../api/zammad';

interface FormData {
  title: string;
  email: string;
  note: string;
}

export default function TicketForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    email: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  const DRAFT_KEY = 'ticketDraft';

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setEmailValid(isValidEmail(parsed.email));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  const saveDraft = useCallback((data: FormData) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(formData), 500);
    return () => clearTimeout(timer);
  }, [formData, saveDraft]);

  const handleEmailSelect = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    setEmailValid(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.note.trim() || !formData.email.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email');
      setEmailValid(false);
      return;
    }

    setSubmitting(true);
    try {
      const response = await createTicket(formData.title, formData.email, formData.note);
      const ticketId = response?.id || 'unknown';
      toast.success(
        (t) => (
          <span className="success-toast">
            Ticket #{ticketId} created (silent) ✓
          </span>
        ),
        { duration: 4000 }
      );
      setFormData({ title: '', email: '', note: '' });
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      toast.error(`Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.note.trim() && formData.email.trim() && emailValid && isValidEmail(formData.email);

  const titleErrorId = 'title-error';
  const noteErrorId = 'note-error';
  const hasTitleError = !formData.title.trim() && (formData.email.trim() || formData.note.trim());
  const hasNoteError = !formData.note.trim() && (formData.title.trim() || formData.email.trim());

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 transition-shadow duration-200 hover:shadow-lg dark:hover:shadow-gray-600">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'white',
            color: 'black',
          },
        }}
      />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <ChatBubbleLeftIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
        Create Silent Ticket
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <TagIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Ticket Name
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter ticket title"
            aria-invalid={hasTitleError ? "true" : undefined}
            aria-describedby={hasTitleError ? titleErrorId : undefined}
            className="w-full px-4 sm:px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 disabled:opacity-50"
            disabled={submitting}
          />
          {hasTitleError && (
            <p id={titleErrorId} className="mt-1 text-sm text-red-600 dark:text-red-400">Ticket name is required.</p>
          )}
        </div>
        <EmailSelect
          onSelect={handleEmailSelect}
          value={formData.email}
        />
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <ChatBubbleLeftIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Initial Note
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Enter initial note"
            rows={4}
            aria-invalid={hasNoteError ? "true" : undefined}
            aria-describedby={hasNoteError ? noteErrorId : undefined}
            className="w-full px-4 sm:px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 resize-vertical disabled:opacity-50"
            disabled={submitting}
          />
          {hasNoteError && (
            <p id={noteErrorId} className="mt-1 text-sm text-red-600 dark:text-red-400">Initial note is required.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!isFormValid || submitting}
          className={`w-full py-3 sm:py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 flex items-center justify-center transition-all duration-200 ${
            isFormValid && !submitting
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
          }`}
          aria-disabled={!isFormValid || submitting}
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              Create Ticket
            </>
          )}
        </button>
      </form>
    </div>
  );
}
