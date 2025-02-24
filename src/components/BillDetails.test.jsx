import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import BillDetails from './BillDetails';

jest.mock('react-datepicker', () => {
  const DatePicker = ({ selected, onChange }) => (
    <input 
      type="date" 
      value={selected.toISOString().split('T')[0]} 
      onChange={(e) => onChange(new Date(e.target.value))}
      data-testid="date-picker"
    />
  );
  return DatePicker;
});

describe('BillDetails', () => {
  const defaultProps = {
    billInfo: {
      billName: 'Test Dinner',
      totalAmount: 100,
      billDate: new Date('2024-01-30'),
      location: 'Test Restaurant',
      notes: 'Test notes',
      payers: []
    },
    setBillInfo: jest.fn(),
    onUploadReceipt: jest.fn(),
    billParticipants: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders bill details form', () => {
    render(<BillDetails {...defaultProps} />);
    expect(screen.getByDisplayValue('Test Dinner')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  test('handles bill name change', () => {
    render(<BillDetails {...defaultProps} />);
    const input = screen.getByDisplayValue('Test Dinner');
    fireEvent.change(input, { target: { value: 'New Dinner', name: 'billName' } });

    expect(defaultProps.setBillInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        billName: 'New Dinner'
      })
    );
  });

  test('handles date change', () => {
    render(<BillDetails {...defaultProps} />);
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2024-02-01' } });

    expect(defaultProps.setBillInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        billDate: expect.any(Date)
      })
    );
  });

  test('handles receipt upload', () => {
    render(<BillDetails {...defaultProps} />);
    const file = new File(['dummy content'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload receipt/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(defaultProps.onUploadReceipt).toHaveBeenCalledWith(file);
  });

  test('shows payer information', () => {
    const propsWithPayers = {
      ...defaultProps,
      billInfo: {
        ...defaultProps.billInfo,
        payers: [
          { participantId: 1, name: 'Alice', amount: 60 },
          { participantId: 2, name: 'Bob', amount: 40 }
        ]
      }
    };

    render(<BillDetails {...propsWithPayers} />);
    expect(screen.getByText(/alice \(\$60\)/i)).toBeInTheDocument();
    expect(screen.getByText(/bob \(\$40\)/i)).toBeInTheDocument();
  });

  test('opens payer dialog and allows editing', async () => {
    render(<BillDetails {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editButton);

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/who paid\?/i)).toBeInTheDocument();

    // Select a payer and set amount
    const selectButton = screen.getAllByText(/select/i)[0];
    fireEvent.click(selectButton);
    
    const amountInput = screen.getByDisplayValue('0');
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Save changes
    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    expect(defaultProps.setBillInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        payers: expect.arrayContaining([
          expect.objectContaining({
            participantId: expect.any(Number),
            amount: 100
          })
        ])
      })
    );
  });

  describe('Error Handling', () => {
    test('validates total amount matches sum of payer amounts', async () => {
      const { rerender } = render(<BillDetails {...defaultProps} />);
      
      // Open payer dialog
      fireEvent.click(screen.getByLabelText(/edit/i));
      
      // Select both payers and set amounts
      const selectButtons = screen.getAllByText(/select/i);
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]);
      
      // Set amounts that sum to more than total
      const amountInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(amountInputs[0], { target: { value: '60' } });
      fireEvent.change(amountInputs[1], { target: { value: '50' } });
      
      // Try to save
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);
      
      // Should show error message
      expect(screen.getByText(/sum of amounts must equal total/i)).toBeInTheDocument();
    });

    test('handles receipt upload errors', async () => {
      const onUploadReceiptWithError = jest.fn().mockRejectedValue(new Error('Invalid file type'));
      render(<BillDetails {...defaultProps} onUploadReceipt={onUploadReceiptWithError} />);
      
      const file = new File(['dummy content'], 'receipt.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload receipt/i);
      
      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });
      
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles very large numbers correctly', () => {
      const propsWithLargeAmount = {
        ...defaultProps,
        billInfo: {
          ...defaultProps.billInfo,
          totalAmount: 999999.99
        }
      };
      
      render(<BillDetails {...propsWithLargeAmount} />);
      expect(screen.getByDisplayValue('999999.99')).toBeInTheDocument();
    });

    test('handles empty payer list gracefully', () => {
      const propsWithoutPayers = {
        ...defaultProps,
        billParticipants: []
      };
      
      render(<BillDetails {...propsWithoutPayers} />);
      expect(screen.getByText(/no participants available/i)).toBeInTheDocument();
    });

    test('preserves payer amounts when editing bill total', async () => {
      const initialProps = {
        ...defaultProps,
        billInfo: {
          ...defaultProps.billInfo,
          totalAmount: 100,
          payers: [
            { participantId: 1, name: 'Alice', amount: 60 },
            { participantId: 2, name: 'Bob', amount: 40 }
          ]
        }
      };
      
      render(<BillDetails {...initialProps} />);
      
      // Change total amount
      const totalInput = screen.getByDisplayValue('100');
      fireEvent.change(totalInput, { target: { value: '200', name: 'totalAmount' } });
      
      // Payer proportions should be maintained
      expect(screen.getByText(/alice \(\$60\)/i)).toBeInTheDocument();
      expect(screen.getByText(/bob \(\$40\)/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('payer dialog is keyboard navigable', () => {
      render(<BillDetails {...defaultProps} />);
      
      // Open dialog with keyboard
      const editButton = screen.getByLabelText(/edit/i);
      editButton.focus();
      fireEvent.keyDown(editButton, { key: 'Enter' });
      
      // Dialog should be focused
      expect(screen.getByRole('dialog')).toHaveFocus();
      
      // Tab through form elements
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        element.focus();
        expect(element).toHaveFocus();
      });
    });

    test('displays validation errors to screen readers', async () => {
      render(<BillDetails {...defaultProps} />);
      
      const totalInput = screen.getByLabelText(/total amount/i);
      fireEvent.change(totalInput, { target: { value: '-100', name: 'totalAmount' } });
      
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/amount cannot be negative/i);
    });
  });
});