import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Toaster, toast } from 'react-hot-toast';
import { EnvelopeIcon, TagIcon, ChatBubbleLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import EmailSelect from './EmailSelect';
import PrioritySelect from './PrioritySelect';
import { createTicket } from '../api/zammad';

interface FormData {
  title: string;
  email: string;
  note: string;
  priority: number;
}

export default function TicketForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    email: '',
    note: '',
    priority: 2,
  });
  const [submitting, setSubmitting] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [successView, setSuccessView] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rich text editor modules with all features
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ticketFormData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setFormData(parsedData);
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
  }, []);

  // Auto-save form data
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('ticketFormData', JSON.stringify(formData));
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData]);

  const handleChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleEmailChange = useCallback((email: string) => {
    setFormData(prev => ({
      ...prev,
      email: email
    }));
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailValid(isValid);
  }, []);

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.email.trim() !== '' &&
      emailValid &&
      formData.note.trim() !== '' &&
      formData.priority > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    setSubmitting(true);

    try {
      const response = await createTicket(
        formData.title,
        formData.email,
        formData.note,
        formData.priority
      );

      toast.success('Ticket created successfully!');
      
      // Set success view with ticket ID
      setTicketId(response.id);
      setSuccessView(true);

      // Clear form and localStorage
      setFormData({
        title: '',
        email: '',
        note: '',
        priority: 2,
      });
      localStorage.removeItem('ticketFormData');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setSuccessView(false);
    setTicketId(null);
  };

  const handleViewInZammad = () => {
    if (ticketId) {
      const zammadBaseUrl = import.meta.env.VITE_ZAMMAD_BASE_URL || 'http://localhost:3000';
      window.open(`${zammadBaseUrl}/#ticket/zoom/${ticketId}`, '_blank');
    }
  };

  if (successView && ticketId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center animate-fade-in">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ticket Created!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your ticket #{ticketId} has been created successfully.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleViewInZammad}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              View in Zammad
            </button>
            <button
              onClick={handleCreateAnother}
              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Create Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Create Support Ticket
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TagIcon className="inline-block w-5 h-5 mr-2" />
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <EnvelopeIcon className="inline-block w-5 h-5 mr-2" />
                Email
              </label>
              <EmailSelect
                value={formData.email}
                onSelect={handleEmailChange}
              />
            </div>

            {/* Priority Field */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <PrioritySelect
                value={formData.priority}
                onSelect={(priority) => handleChange('priority', priority)}
              />
            </div>

            {/* Note Field with Rich Text */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ChatBubbleLeftIcon className="inline-block w-5 h-5 mr-2" />
                Description
              </label>
              <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.note}
                  onChange={(value) => handleChange('note', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Detailed description of the issue..."
                  className="dark:text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                !isFormValid() || submitting
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Ticket...
                </span>
              ) : (
                'Create Ticket'
              )}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Your progress is automatically saved
          </p>
        </div>
      </div>
    </div>
  );
}
