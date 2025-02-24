import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../App';
import { processReceiptImage } from '../utils/imageProcessor';
import { saveBill } from '../api/billService';

// Mock dependencies
jest.mock('../utils/imageProcessor');
jest.mock('../api/billService');

describe('Receipt to Settlement Integration', () => {
  beforeEach(() => {
    processReceiptImage.mockClear();
    saveBill.mockClear();
  });

  test('should process receipt and populate bill details', async () => {
    // Mock successful receipt processing
    processReceiptImage.mockResolvedValueOnce({
      success: true,
      storeInfo: {
        name: 'Test Restaurant',
        address: '123 Test St',
        date: '2024-01-30'
      },
      items: [
        { name: 'Pizza', price: 20, quantity: 2, taxRate: 10 },
        { name: 'Drinks', price: 8, quantity: 3, taxRate: 10 }
      ],
      totalAmount: 68.20
    });

    render(<App />);

    // Upload receipt
    const file = new File(['dummy image'], 'receipt.jpg', { type: 'image/jpeg' });
    const uploadInput = screen.getByLabelText(/upload receipt/i);
    await act(async () => {
      fireEvent.change(uploadInput, { target: { files: [file] } });
    });

    // Verify bill details are populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('68.20')).toBeInTheDocument();
    });

    // Verify items are added
    expect(screen.getByDisplayValue('Pizza')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Drinks')).toBeInTheDocument();
  });

  test('should calculate settlements after receipt processing and participant addition', async () => {
    // Mock receipt processing
    processReceiptImage.mockResolvedValueOnce({
      success: true,
      storeInfo: { name: 'Test Restaurant' },
      items: [{ name: 'Item', price: 100, quantity: 1, taxRate: 10 }],
      totalAmount: 110
    });

    render(<App />);

    // Upload receipt
    const file = new File(['dummy image'], 'receipt.jpg', { type: 'image/jpeg' });
    const uploadInput = screen.getByLabelText(/upload receipt/i);
    await act(async () => {
      fireEvent.change(uploadInput, { target: { files: [file] } });
    });

    // Add participants
    const addParticipantButton = screen.getByText(/add participant/i);
    
    // Add Alice who paid full amount
    fireEvent.click(addParticipantButton);
    const aliceNameInput = screen.getByPlaceholderText(/participant name/i);
    fireEvent.change(aliceNameInput, { target: { value: 'Alice' } });
    
    // Set Alice as payer
    const editPayersButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editPayersButton);
    
    const selectAliceButton = screen.getByText(/select/i);
    fireEvent.click(selectAliceButton);
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '110' } });
    fireEvent.click(screen.getByText(/save/i));

    // Add Bob who paid nothing
    fireEvent.click(addParticipantButton);
    const bobNameInput = screen.getAllByPlaceholderText(/participant name/i)[1];
    fireEvent.change(bobNameInput, { target: { value: 'Bob' } });

    // Verify settlement shows Bob needs to pay Alice
    await waitFor(() => {
      const settlementText = screen.getByText(/bob pays alice \$55\.00/i);
      expect(settlementText).toBeInTheDocument();
    });
  });

  test('should handle receipt processing errors gracefully', async () => {
    processReceiptImage.mockResolvedValueOnce({
      success: false,
      error: 'Failed to process image'
    });

    render(<App />);

    const file = new File(['dummy image'], 'receipt.jpg', { type: 'image/jpeg' });
    const uploadInput = screen.getByLabelText(/upload receipt/i);
    
    await act(async () => {
      fireEvent.change(uploadInput, { target: { files: [file] } });
    });

    // Verify error is displayed
    expect(screen.getByText(/failed to process image/i)).toBeInTheDocument();
    
    // Verify form is still usable
    const billNameInput = screen.getByLabelText(/bill name/i);
    fireEvent.change(billNameInput, { target: { value: 'Manual Entry' } });
    expect(screen.getByDisplayValue('Manual Entry')).toBeInTheDocument();
  });

  test('should save complete bill data after receipt processing and settlement', async () => {
    // Mock successful receipt processing
    processReceiptImage.mockResolvedValueOnce({
      success: true,
      storeInfo: { name: 'Final Test' },
      items: [{ name: 'Item', price: 100, quantity: 1, taxRate: 10 }],
      totalAmount: 110
    });

    // Mock successful save
    saveBill.mockResolvedValueOnce({ id: 1, message: 'Success' });

    render(<App />);

    // Process receipt
    const file = new File(['dummy image'], 'receipt.jpg', { type: 'image/jpeg' });
    const uploadInput = screen.getByLabelText(/upload receipt/i);
    await act(async () => {
      fireEvent.change(uploadInput, { target: { files: [file] } });
    });

    // Add participants and set payer
    await act(async () => {
      const addParticipantButton = screen.getByText(/add participant/i);
      fireEvent.click(addParticipantButton);
      const nameInput = screen.getByPlaceholderText(/participant name/i);
      fireEvent.change(nameInput, { target: { value: 'Alice' } });
      
      fireEvent.click(addParticipantButton);
      const nameInput2 = screen.getAllByPlaceholderText(/participant name/i)[1];
      fireEvent.change(nameInput2, { target: { value: 'Bob' } });
    });

    // Set payer
    await act(async () => {
      const editPayersButton = screen.getByLabelText(/edit/i);
      fireEvent.click(editPayersButton);
      const selectButton = screen.getAllByText(/select/i)[0];
      fireEvent.click(selectButton);
      const amountInput = screen.getByRole('spinbutton');
      fireEvent.change(amountInput, { target: { value: '110' } });
      fireEvent.click(screen.getByText(/save/i));
    });

    // Save the bill
    const saveButton = screen.getByText(/save bill/i);
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify the save call
    expect(saveBill).toHaveBeenCalledWith(
      expect.objectContaining({
        billName: 'Final Test',
        totalAmount: 110
      }),
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Item',
          price: 100
        })
      ]),
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Alice',
          amountPaid: 110
        }),
        expect.objectContaining({
          name: 'Bob',
          amountPaid: 0
        })
      ])
    );
  });
});