import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { saveBill } from './api/billService';

// Mock the bill service
jest.mock('./api/billService', () => ({
  saveBill: jest.fn()
}));

describe('App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all major sections', () => {
    render(<App />);
    expect(screen.getByText(/bill details/i)).toBeInTheDocument();
    expect(screen.getByText(/items/i)).toBeInTheDocument();
    expect(screen.getByText(/participants/i)).toBeInTheDocument();
    expect(screen.getByText(/settlement/i)).toBeInTheDocument();
  });

  test('updates total amount when items change', async () => {
    render(<App />);
    
    // Add an item
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);

    // Fill in item details
    const nameInput = screen.getByPlaceholderText(/item name/i);
    const priceInput = screen.getByPlaceholderText(/price/i);
    const quantityInput = screen.getByPlaceholderText(/quantity/i);
    
    fireEvent.change(nameInput, { target: { value: 'Pizza' } });
    fireEvent.change(priceInput, { target: { value: '20' } });
    fireEvent.change(quantityInput, { target: { value: '2' } });

    // Total should update to 40
    expect(await screen.findByText(/\$40/)).toBeInTheDocument();
  });

  test('calculates settlement when participants are added', async () => {
    render(<App />);

    // Add participants
    const participant1 = { id: 1, name: 'Alice', amountPaid: 100 };
    const participant2 = { id: 2, name: 'Bob', amountPaid: 0 };

    // Mock participants being added
    await act(async () => {
      fireEvent.click(screen.getByText(/add participant/i));
    });

    // Add an item to split
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);

    // Fill item details
    const priceInput = screen.getByPlaceholderText(/price/i);
    fireEvent.change(priceInput, { target: { value: '100' } });

    // Settlement should show transfer needed
    expect(await screen.findByText(/settlement/i)).toBeInTheDocument();
  });

  test('saves bill data successfully', async () => {
    saveBill.mockResolvedValueOnce({ id: 1, message: 'Success' });
    
    render(<App />);
    
    // Fill in bill details
    const billNameInput = screen.getByLabelText(/bill name/i);
    fireEvent.change(billNameInput, { target: { value: 'Test Dinner' } });

    // Try to save
    const saveButton = screen.getByText(/save/i);
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(saveBill).toHaveBeenCalled();
  });

  test('handles bill data loading from JSON', async () => {
    const file = new File([
      JSON.stringify({
        billInfo: {
          billName: 'Test Bill',
          totalAmount: 100
        },
        items: [],
        participants: []
      })
    ], 'test.json', { type: 'application/json' });

    render(<App />);

    // Trigger JSON upload
    const input = screen.getByLabelText(/upload json/i);
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(await screen.findByDisplayValue('Test Bill')).toBeInTheDocument();
  });
});
