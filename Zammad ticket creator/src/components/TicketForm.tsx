import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
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
      await createTicket(formData.title, formData.email, formData.note);
      toast.success('Ticket created (silent) ✓');
      setFormData({ title: '', email: '', note: '' });
    } catch (error) {
      toast.error(`Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.note.trim() && formData.email.trim() && emailValid && isValidEmail(formData.email);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Silent Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Name
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter ticket title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting}
          />
        </div>
        <EmailSelect
          onSelect={handleEmailSelect}
          value={formData.email}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Note
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Enter initial note"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting}
          />
        </div>
        <button
          type="submit"
          disabled={!isFormValid || submitting}
          className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isFormValid && !submitting
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
}
