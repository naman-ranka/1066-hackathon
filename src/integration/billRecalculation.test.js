import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../App';

describe('Bill Recalculation Integration', () => {
  test('recalculates when participant is removed', async () => {
    render(<App />);

    // Add three participants
    const addParticipantButton = screen.getByText(/add participant/i);
    fireEvent.click(addParticipantButton);
    fireEvent.click(addParticipantButton);
    fireEvent.click(addParticipantButton);

    // Add an item split equally
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);
    
    // Set item details
    const nameInput = screen.getByPlaceholderText(/item name/i);
    const priceInput = screen.getByPlaceholderText(/price/i);
    fireEvent.change(nameInput, { target: { value: 'Pizza' } });
    fireEvent.change(priceInput, { target: { value: '30' } });

    // Initial split should be $10 each
    await waitFor(() => {
      const amountOwed = screen.getAllByText('$10.00');
      expect(amountOwed).toHaveLength(3);
    });

    // Remove one participant
    const removeButton = screen.getAllByText(/remove/i)[0];
    fireEvent.click(removeButton);

    // Split should update to $15 each
    await waitFor(() => {
      const amountOwed = screen.getAllByText('$15.00');
      expect(amountOwed).toHaveLength(2);
    });
  });

  test('handles complex split type changes', async () => {
    render(<App />);

    // Add two participants
    const addParticipantButton = screen.getByText(/add participant/i);
    fireEvent.click(addParticipantButton);
    fireEvent.click(addParticipantButton);

    // Add an item
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);
    
    // Set item details with equal split
    const nameInput = screen.getByPlaceholderText(/item name/i);
    const priceInput = screen.getByPlaceholderText(/price/i);
    const splitTypeSelect = screen.getByLabelText(/split type/i);
    
    fireEvent.change(nameInput, { target: { value: 'Expensive Item' } });
    fireEvent.change(priceInput, { target: { value: '100' } });

    // Initially equal split
    await waitFor(() => {
      const amountOwed = screen.getAllByText('$50.00');
      expect(amountOwed).toHaveLength(2);
    });

    // Change to unequal-percent split
    fireEvent.change(splitTypeSelect, { target: { value: 'unequal-percent' } });
    
    // Set 70-30 split
    const splitInputs = screen.getAllByLabelText(/percentage/i);
    fireEvent.change(splitInputs[0], { target: { value: '70' } });
    fireEvent.change(splitInputs[1], { target: { value: '30' } });

    // Verify new split amounts
    await waitFor(() => {
      expect(screen.getByText('$70.00')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });
  });

  test('maintains correct totals with multiple items and split types', async () => {
    render(<App />);

    // Add three participants
    const addParticipantButton = screen.getByText(/add participant/i);
    Array(3).fill(null).forEach(() => fireEvent.click(addParticipantButton));

    // Add multiple items with different split types
    const addItemButton = screen.getByText(/add item/i);
    
    // Item 1 - Equal split
    fireEvent.click(addItemButton);
    const item1Name = screen.getAllByPlaceholderText(/item name/i)[0];
    const item1Price = screen.getAllByPlaceholderText(/price/i)[0];
    fireEvent.change(item1Name, { target: { value: 'Shared Item' } });
    fireEvent.change(item1Price, { target: { value: '30' } });

    // Item 2 - Percentage split
    fireEvent.click(addItemButton);
    const item2Name = screen.getAllByPlaceholderText(/item name/i)[1];
    const item2Price = screen.getAllByPlaceholderText(/price/i)[1];
    const item2SplitType = screen.getAllByLabelText(/split type/i)[1];
    
    fireEvent.change(item2Name, { target: { value: 'Percent Split Item' } });
    fireEvent.change(item2Price, { target: { value: '100' } });
    fireEvent.change(item2SplitType, { target: { value: 'unequal-percent' } });

    // Set percentage splits
    const percentInputs = screen.getAllByLabelText(/percentage/i);
    fireEvent.change(percentInputs[0], { target: { value: '50' } });
    fireEvent.change(percentInputs[1], { target: { value: '30' } });
    fireEvent.change(percentInputs[2], { target: { value: '20' } });

    // Verify final amounts
    await waitFor(() => {
      // First participant: $10 (equal) + $50 (percent) = $60
      expect(screen.getByText('$60.00')).toBeInTheDocument();
      // Second participant: $10 (equal) + $30 (percent) = $40
      expect(screen.getByText('$40.00')).toBeInTheDocument();
      // Third participant: $10 (equal) + $20 (percent) = $30
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });
  });

  test('handles tax recalculation correctly', async () => {
    render(<App />);

    // Add two participants
    const addParticipantButton = screen.getByText(/add participant/i);
    fireEvent.click(addParticipantButton);
    fireEvent.click(addParticipantButton);

    // Add item with tax
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);
    
    const nameInput = screen.getByPlaceholderText(/item name/i);
    const priceInput = screen.getByPlaceholderText(/price/i);
    const taxInput = screen.getByLabelText(/tax rate/i);
    
    fireEvent.change(nameInput, { target: { value: 'Taxed Item' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    fireEvent.change(taxInput, { target: { value: '10' } });

    // Initial equal split with tax
    await waitFor(() => {
      // Each person should owe $55 ($100 + 10% tax = $110, split equally)
      const amountOwed = screen.getAllByText('$55.00');
      expect(amountOwed).toHaveLength(2);
    });

    // Change tax rate
    fireEvent.change(taxInput, { target: { value: '20' } });

    // Verify updated split with new tax
    await waitFor(() => {
      // Each person should now owe $60 ($100 + 20% tax = $120, split equally)
      const amountOwed = screen.getAllByText('$60.00');
      expect(amountOwed).toHaveLength(2);
    });
  });

  test('handles dynamic payer changes', async () => {
    render(<App />);

    // Add three participants
    const addParticipantButton = screen.getByText(/add participant/i);
    Array(3).fill(null).forEach(() => fireEvent.click(addParticipantButton));

    // Add an item
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);
    
    // Set item details
    const nameInput = screen.getByPlaceholderText(/item name/i);
    const priceInput = screen.getByPlaceholderText(/price/i);
    fireEvent.change(nameInput, { target: { value: 'Shared Item' } });
    fireEvent.change(priceInput, { target: { value: '90' } });

    // Set first participant as initial payer
    const editPayersButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editPayersButton);
    
    const selectButton = screen.getAllByText(/select/i)[0];
    fireEvent.click(selectButton);
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '90' } });
    fireEvent.click(screen.getByText(/save/i));

    // Verify initial settlement
    await waitFor(() => {
      expect(screen.getByText(/pays.*30\.00/)).toBeInTheDocument();
    });

    // Change payer to split between two people
    fireEvent.click(editPayersButton);
    const secondSelectButton = screen.getAllByText(/select/i)[1];
    fireEvent.click(secondSelectButton);
    
    const amountInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(amountInputs[0], { target: { value: '45' } });
    fireEvent.change(amountInputs[1], { target: { value: '45' } });
    fireEvent.click(screen.getByText(/save/i));

    // Verify updated settlement
    await waitFor(() => {
      expect(screen.getByText(/pays.*15\.00/)).toBeInTheDocument();
    });
  });
});