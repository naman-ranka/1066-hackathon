import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipantsSection from './ParticipantsSection';
import { commonA11yTests } from '../utils/accessibilityTests';

describe('ParticipantsSection', () => {
  const defaultProps = {
    allParticipants: [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' }
    ],
    billParticipants: [],
    setBillParticipants: jest.fn(),
    billInfo: {
      payers: []
    }
  };

  test('renders available participants', () => {
    render(<ParticipantsSection {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('allows adding participants to bill', () => {
    render(<ParticipantsSection {...defaultProps} />);
    const addButtons = screen.getAllByText('Add to Bill');
    fireEvent.click(addButtons[0]); // Add Alice

    expect(defaultProps.setBillParticipants).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: 'Alice',
          amountOwed: 0
        })
      ])
    );
  });

  test('displays amount paid and owed for bill participants', () => {
    const propsWithParticipants = {
      ...defaultProps,
      billParticipants: [
        { id: 1, name: 'Alice', amountOwed: 50 }
      ],
      billInfo: {
        payers: [
          { participantId: 1, name: 'Alice', amount: 100 }
        ]
      }
    };

    render(<ParticipantsSection {...propsWithParticipants} />);
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // Amount paid
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Amount owed
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Net balance
  });

  test('allows removing participants from bill', () => {
    const propsWithParticipants = {
      ...defaultProps,
      billParticipants: [
        { id: 1, name: 'Alice', amountOwed: 50 }
      ]
    };

    render(<ParticipantsSection {...propsWithParticipants} />);
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(defaultProps.setBillParticipants).toHaveBeenCalledWith(
      expect.arrayContaining([])
    );
  });

  describe('Accessibility Features', () => {
    const renderComponent = () => render(
      <ParticipantsSection
        allParticipants={[
          { id: 1, name: 'Alice', email: 'alice@test.com' },
          { id: 2, name: 'Bob', email: 'bob@test.com' }
        ]}
        billParticipants={[]}
        setBillParticipants={jest.fn()}
        billInfo={{ payers: [] }}
      />
    );

    commonA11yTests(renderComponent);

    test('table headers have proper scope attributes', () => {
      renderComponent();
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    test('buttons have descriptive aria-labels', () => {
      renderComponent();
      const addButtons = screen.getAllByText(/add to bill/i);
      addButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    test('amounts are announced properly to screen readers', () => {
      render(
        <ParticipantsSection
          allParticipants={[]}
          billParticipants={[
            { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 50 }
          ]}
          setBillParticipants={jest.fn()}
          billInfo={{ 
            payers: [
              { participantId: 1, name: 'Alice', amount: 100 }
            ]
          }}
        />
      );

      const amountElements = screen.getAllByText(/\$\d+\.\d{2}/);
      amountElements.forEach(element => {
        expect(element).toHaveAttribute('aria-label', expect.stringMatching(/amount/i));
      });
    });

    test('provides feedback for removal actions', () => {
      const { container } = render(
        <ParticipantsSection
          allParticipants={[]}
          billParticipants={[
            { id: 1, name: 'Alice', amountPaid: 0, amountOwed: 0 }
          ]}
          setBillParticipants={jest.fn()}
          billInfo={{ payers: [] }}
        />
      );

      const removeButton = screen.getByText(/remove/i);
      expect(removeButton).toHaveAttribute('aria-label', expect.stringMatching(/remove.*alice/i));
      
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    test('maintains focus after participant removal', () => {
      const setBillParticipants = jest.fn();
      render(
        <ParticipantsSection
          allParticipants={[
            { id: 1, name: 'Alice', email: 'alice@test.com' },
            { id: 2, name: 'Bob', email: 'bob@test.com' }
          ]}
          billParticipants={[
            { id: 1, name: 'Alice', amountPaid: 0, amountOwed: 0 },
            { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 0 }
          ]}
          setBillParticipants={setBillParticipants}
          billInfo={{ payers: [] }}
        />
      );

      const removeButtons = screen.getAllByText(/remove/i);
      const firstButton = removeButtons[0];
      const secondButton = removeButtons[1];

      firstButton.focus();
      fireEvent.click(firstButton);

      expect(document.activeElement).toBe(secondButton);
    });

    test('announces balance changes to screen readers', () => {
      const { rerender } = render(
        <ParticipantsSection
          allParticipants={[]}
          billParticipants={[
            { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 50 }
          ]}
          setBillParticipants={jest.fn()}
          billInfo={{ 
            payers: [
              { participantId: 1, name: 'Alice', amount: 100 }
            ]
          }}
        />
      );

      // Update the amounts
      rerender(
        <ParticipantsSection
          allParticipants={[]}
          billParticipants={[
            { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 75 }
          ]}
          setBillParticipants={jest.fn()}
          billInfo={{ 
            payers: [
              { participantId: 1, name: 'Alice', amount: 100 }
            ]
          }}
        />
      );

      const balanceElement = screen.getByText('$25.00');
      expect(balanceElement).toHaveAttribute('aria-live', 'polite');
    });
  });
});