import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import TicketForm from '../src/components/TicketForm';
import * as zammad from '../src/api/zammad';
import * as toast from 'react-hot-toast';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

// Mock modules
vi.mock('../src/api/zammad');
vi.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

const mockCreateTicket = vi.mocked(zammad.createTicket);

describe('TicketForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTicket.mockResolvedValue({ id: 123 });
  });

  test('renders form fields', () => {
    render(<TicketForm />);
    expect(screen.getByLabelText(/ticket name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/customer e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/initial note/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
  });

  test('validates form and enables button when all fields filled', async () => {
    const user = userEvent.setup();
    render(<TicketForm />);

    const titleInput = screen.getByLabelText(/ticket name/i);
    const emailInput = screen.getByPlaceholderText(/search or select email/i);
    const quillEditor = screen.getByLabelText(/initial note/i).querySelector('.ql-editor') as HTMLElement;
    const submitButton = screen.getByRole('button', { name: /create ticket/i });

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Fill title
    await user.type(titleInput, 'Test Title');
    expect(submitButton).toBeDisabled();

    // Select email (simulate)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(submitButton).toBeDisabled();

    // Type in Quill
    await user.type(quillEditor, 'Test note');
    await waitFor(() => expect(submitButton).toBeEnabled());
  });

  test('submits form and shows success view on valid input', async () => {
    const user = userEvent.setup();
    render(<TicketForm />);

    const titleInput = screen.getByLabelText(/ticket name/i);
    const emailInput = screen.getByPlaceholderText(/search or select email/i);
    const quillEditor = screen.getByLabelText(/initial note/i).querySelector('.ql-editor') as HTMLElement;
    const submitButton = screen.getByRole('button', { name: /create ticket/i });

    await user.type(titleInput, 'Test Title');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await user.type(quillEditor, 'Test note');
    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledWith('Test Title', 'test@example.com', expect.any(String), 2);
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    expect(screen.getByText(/ticket #123 created successfully!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view in zammad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create another/i })).toBeInTheDocument();
  });

  test('handles submit error', async () => {
    const user = userEvent.setup();
    mockCreateTicket.mockRejectedValue(new Error('API Error'));
    render(<TicketForm />);

    const titleInput = screen.getByLabelText(/ticket name/i);
    const emailInput = screen.getByPlaceholderText(/search or select email/i);
    const quillEditor = screen.getByLabelText(/initial note/i).querySelector('.ql-editor') as HTMLElement;
    const submitButton = screen.getByRole('button', { name: /create ticket/i });

    await user.type(titleInput, 'Test Title');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await user.type(quillEditor, 'Test note');
    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('API Error'));
    });
  });

  test('draft auto-save', async () => {
    vi.spyOn(localStorage, 'setItem');
    const { unmount } = render(<TicketForm />);
    const titleInput = screen.getByLabelText(/ticket name/i);
    fireEvent.change(titleInput, { target: { value: 'Draft Title' } });

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('ticketDraft', expect.any(String));
    });

    unmount();
    vi.restoreAllMocks();
  });
});
