import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ItemsSection from './ItemsSection';

describe('ItemsSection', () => {
  const defaultProps = {
    items: [
      {
        id: 1,
        name: "Pizza",
        quantity: 2,
        price: 15,
        taxRate: 10,
        splitType: "equal",
        splits: {},
        includedParticipants: []
      }
    ],
    setItems: jest.fn(),
    billParticipants: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };

  test('renders items with their details', () => {
    render(<ItemsSection {...defaultProps} />);
    expect(screen.getByDisplayValue('Pizza')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  test('calculates item total correctly', () => {
    render(<ItemsSection {...defaultProps} />);
    // Item total: (15 * 2) + ((15 * 2) * 0.1) = 33
    expect(screen.getByText('33.00')).toBeInTheDocument();
  });

  test('allows adding new items', () => {
    render(<ItemsSection {...defaultProps} />);
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    expect(defaultProps.setItems).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        name: "",
        quantity: 1,
        price: 0,
        taxRate: 0,
        splitType: "equal"
      })
    ]));
  });

  test('handles split type changes', () => {
    render(<ItemsSection {...defaultProps} />);
    const splitTypeSelect = screen.getByLabelText('Split Type');
    fireEvent.change(splitTypeSelect, { target: { value: 'unequal-money' } });

    expect(defaultProps.setItems).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 1,
        splitType: 'unequal-money'
      })
    ]);
  });

  test('shows split options for unequal splits', () => {
    const propsWithUnequalSplit = {
      ...defaultProps,
      items: [{
        ...defaultProps.items[0],
        splitType: 'unequal-money',
        splits: {
          1: 20,
          2: 13
        }
      }]
    };

    render(<ItemsSection {...propsWithUnequalSplit} />);
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('13')).toBeInTheDocument();
  });

  test('allows removing items', () => {
    render(<ItemsSection {...defaultProps} />);
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(defaultProps.setItems).toHaveBeenCalledWith([]);
  });

  describe('Split Types', () => {
    test('handles percentage-based splits', () => {
      const propsWithPercentSplit = {
        ...defaultProps,
        items: [{
          ...defaultProps.items[0],
          splitType: 'unequal-percent',
          splits: {
            1: 60,
            2: 40
          }
        }]
      };

      render(<ItemsSection {...propsWithPercentSplit} />);
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40')).toBeInTheDocument();
    });

    test('validates percentage total equals 100', () => {
      const onError = jest.fn();
      const propsWithPercentSplit = {
        ...defaultProps,
        items: [{
          ...defaultProps.items[0],
          splitType: 'unequal-percent',
          splits: {
            1: 60,
            2: 60 // Invalid: total > 100%
          }
        }],
        onError
      };

      render(<ItemsSection {...propsWithPercentSplit} />);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('percentage'));
    });

    test('handles equal splits with excluded participants', () => {
      const propsWithExclusions = {
        ...defaultProps,
        items: [{
          ...defaultProps.items[0],
          splitType: 'equal',
          includedParticipants: [1] // Only Alice included
        }]
      };

      render(<ItemsSection {...propsWithExclusions} />);
      const total = screen.getByText('33.00'); // Full amount assigned to Alice
      expect(total).toBeInTheDocument();
    });

    test('updates splits when participants are removed', () => {
      const item = {
        ...defaultProps.items[0],
        splitType: 'unequal-money',
        splits: {
          1: 20,
          2: 13
        }
      };

      const { rerender } = render(<ItemsSection items={[item]} {...defaultProps} />);

      // Simulate removing participant 2
      const updatedProps = {
        ...defaultProps,
        billParticipants: [{ id: 1, name: 'Alice' }]
      };

      rerender(<ItemsSection items={[item]} {...updatedProps} />);
      
      expect(screen.queryByDisplayValue('13')).not.toBeInTheDocument();
      expect(defaultProps.setItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            splits: { 1: 20 }
          })
        ])
      );
    });
  });

  describe('Item Validation', () => {
    test('prevents negative quantities', () => {
      render(<ItemsSection {...defaultProps} />);
      const quantityInput = screen.getByDisplayValue('2');
      
      fireEvent.change(quantityInput, { target: { value: '-1' } });
      expect(quantityInput.value).toBe('2');
    });

    test('prevents negative prices', () => {
      render(<ItemsSection {...defaultProps} />);
      const priceInput = screen.getByDisplayValue('15');
      
      fireEvent.change(priceInput, { target: { value: '-15' } });
      expect(priceInput.value).toBe('15');
    });

    test('validates tax rate range', () => {
      render(<ItemsSection {...defaultProps} />);
      const taxInput = screen.getByDisplayValue('10');
      
      fireEvent.change(taxInput, { target: { value: '101' } });
      expect(taxInput.value).toBe('10');
    });
  });
});