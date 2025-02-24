import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Complex UI Interactions', () => {
  describe('Drag and Drop', () => {
    test('reorders items via drag and drop', async () => {
      render(<App />);

      // Add two items
      const addItemButton = screen.getByText(/add item/i);
      fireEvent.click(addItemButton);
      fireEvent.click(addItemButton);

      // Set item names
      const itemInputs = screen.getAllByPlaceholderText(/item name/i);
      userEvent.type(itemInputs[0], 'First Item');
      userEvent.type(itemInputs[1], 'Second Item');

      // Simulate drag and drop
      const items = screen.getAllByRole('listitem');
      const dataTransfer = { getData: () => null, setData: () => null };

      fireEvent.dragStart(items[0], { dataTransfer });
      fireEvent.dragOver(items[1], { dataTransfer });
      fireEvent.drop(items[1], { dataTransfer });

      // Verify order changed
      const reorderedItems = screen.getAllByRole('listitem');
      expect(reorderedItems[0]).toHaveTextContent('Second Item');
      expect(reorderedItems[1]).toHaveTextContent('First Item');
    });
  });

  describe('Multi-select Operations', () => {
    test('bulk edits multiple items', async () => {
      render(<App />);

      // Add multiple items
      const addItemButton = screen.getByText(/add item/i);
      Array(3).fill(null).forEach(() => fireEvent.click(addItemButton));

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      // Apply bulk tax rate
      const bulkEditButton = screen.getByText(/bulk edit/i);
      fireEvent.click(bulkEditButton);

      const taxInput = screen.getByLabelText(/tax rate/i);
      fireEvent.change(taxInput, { target: { value: '10' } });
      fireEvent.click(screen.getByText(/apply/i));

      // Verify all items updated
      const taxInputs = screen.getAllByLabelText(/tax rate/i);
      taxInputs.forEach(input => {
        expect(input.value).toBe('10');
      });
    });
  });

  describe('Auto-complete and Suggestions', () => {
    test('suggests previous participants', async () => {
      render(<App />);

      // Add a participant
      const addParticipantButton = screen.getByText(/add participant/i);
      fireEvent.click(addParticipantButton);

      const nameInput = screen.getByPlaceholderText(/participant name/i);
      userEvent.type(nameInput, 'Alice');
      fireEvent.blur(nameInput);

      // Add another participant
      fireEvent.click(addParticipantButton);
      const newNameInput = screen.getByPlaceholderText(/participant name/i);
      userEvent.type(newNameInput, 'Al');

      // Check for suggestion
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('validates numeric inputs in real-time', async () => {
      render(<App />);

      // Add an item
      const addItemButton = screen.getByText(/add item/i);
      fireEvent.click(addItemButton);

      // Try invalid price
      const priceInput = screen.getByPlaceholderText(/price/i);
      userEvent.type(priceInput, 'abc');

      // Check validation message
      expect(screen.getByText(/please enter a valid number/i)).toBeInTheDocument();

      // Fix the input
      userEvent.clear(priceInput);
      userEvent.type(priceInput, '50');

      // Validation message should disappear
      expect(screen.queryByText(/please enter a valid number/i)).not.toBeInTheDocument();
    });

    test('validates split percentages total 100%', async () => {
      render(<App />);

      // Add item and participants
      const addItemButton = screen.getByText(/add item/i);
      fireEvent.click(addItemButton);

      const addParticipantButton = screen.getByText(/add participant/i);
      Array(2).fill(null).forEach(() => fireEvent.click(addParticipantButton));

      // Change to percentage split
      const splitTypeSelect = screen.getByLabelText(/split type/i);
      fireEvent.change(splitTypeSelect, { target: { value: 'unequal-percent' } });

      // Enter percentages
      const percentInputs = screen.getAllByLabelText(/percentage/i);
      fireEvent.change(percentInputs[0], { target: { value: '60' } });
      fireEvent.change(percentInputs[1], { target: { value: '60' } });

      // Check error message
      expect(screen.getByText(/percentages must total 100/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports keyboard shortcuts', async () => {
      render(<App />);

      // Add item with keyboard shortcut
      fireEvent.keyDown(document, { key: 'i', ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/item name/i)).toBeInTheDocument();
      });

      // Navigate between inputs with arrow keys
      const inputs = screen.getAllByRole('textbox');
      inputs[0].focus();
      fireEvent.keyDown(inputs[0], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(inputs[1]);
    });

    test('handles tab navigation in complex forms', async () => {
      render(<App />);

      // Add an item
      const addItemButton = screen.getByText(/add item/i);
      fireEvent.click(addItemButton);

      // Get all focusable elements
      const focusableElements = screen.getAllByRole('textbox');
      
      // Start from first input
      focusableElements[0].focus();
      
      // Tab through all inputs
      focusableElements.forEach((_, index) => {
        fireEvent.keyDown(document, { key: 'Tab' });
        if (index < focusableElements.length - 1) {
          expect(document.activeElement).toBe(focusableElements[index + 1]);
        }
      });
    });
  });

  describe('Touch Interactions', () => {
    test('handles swipe to delete', async () => {
      render(<App />);

      // Add an item
      const addItemButton = screen.getByText(/add item/i);
      fireEvent.click(addItemButton);

      const item = screen.getByRole('listitem');

      // Simulate swipe gesture
      fireEvent.touchStart(item, { touches: [{ clientX: 500, clientY: 50 }] });
      fireEvent.touchMove(item, { touches: [{ clientX: 50, clientY: 50 }] });
      fireEvent.touchEnd(item);

      // Delete button should appear
      expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });

    test('supports pinch to zoom on receipt', async () => {
      render(<App />);

      const receipt = document.createElement('img');
      receipt.src = 'test-receipt.jpg';
      receipt.setAttribute('data-testid', 'receipt-image');
      document.body.appendChild(receipt);

      // Simulate pinch gesture
      const touch1 = { identifier: 1, clientX: 100, clientY: 100 };
      const touch2 = { identifier: 2, clientX: 200, clientY: 200 };

      fireEvent.touchStart(receipt, { 
        touches: [touch1, touch2],
        targetTouches: [touch1, touch2],
        changedTouches: [touch1, touch2]
      });

      // Verify zoom behavior
      expect(receipt.style.transform).toMatch(/scale/);

      document.body.removeChild(receipt);
    });
  });

  describe('Real-time Updates', () => {
    test('updates totals immediately on input change', async () => {
      render(<App />);

      // Add item and participant
      const addItemButton = screen.getByText(/add item/i);
      fireEvent.click(addItemButton);

      const addParticipantButton = screen.getByText(/add participant/i);
      fireEvent.click(addParticipantButton);

      // Enter price
      const priceInput = screen.getByPlaceholderText(/price/i);
      userEvent.type(priceInput, '50');

      // Total should update immediately
      await waitFor(() => {
        expect(screen.getByText('$50.00')).toBeInTheDocument();
      });

      // Change quantity
      const quantityInput = screen.getByPlaceholderText(/quantity/i);
      userEvent.clear(quantityInput);
      userEvent.type(quantityInput, '2');

      // Total should update to reflect new quantity
      await waitFor(() => {
        expect(screen.getByText('$100.00')).toBeInTheDocument();
      });
    });
  });
});