import React from 'react';
import { render, screen } from '@testing-library/react';
import SettlementSection from './SettlementSection';

describe('SettlementSection', () => {
  const defaultProps = {
    items: [
      {
        id: 1,
        name: 'Pizza',
        quantity: 1,
        price: 20,
        taxRate: 10
      }
    ],
    billInfo: {
      totalAmount: 22 // 20 + 10% tax
    },
    billParticipants: [
      { id: 1, name: 'Alice', amountPaid: 22, amountOwed: 11 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 11 }
    ],
    settlement: [
      { from: 'Bob', to: 'Alice', amount: '11.00' }
    ]
  };

  test('renders settlement section title', () => {
    render(<SettlementSection {...defaultProps} />);
    expect(screen.getByText(/settlement/i)).toBeInTheDocument();
  });

  test('displays settlement transactions', () => {
    render(<SettlementSection {...defaultProps} />);
    expect(screen.getByText(/bob pays alice \$11\.00/i)).toBeInTheDocument();
  });

  test('shows "all settled" message when no transactions needed', () => {
    const propsNoSettlement = {
      ...defaultProps,
      settlement: []
    };
    render(<SettlementSection {...propsNoSettlement} />);
    expect(screen.getByText(/all settled!/i)).toBeInTheDocument();
  });

  test('displays final total amount', () => {
    render(<SettlementSection {...defaultProps} />);
    expect(screen.getByText(/final total: \$22\.00/i)).toBeInTheDocument();
  });

  test('handles multiple settlement transactions', () => {
    const propsMultipleSettlements = {
      ...defaultProps,
      billParticipants: [
        { id: 1, name: 'Alice', amountPaid: 30, amountOwed: 10 },
        { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 10 },
        { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 10 }
      ],
      settlement: [
        { from: 'Bob', to: 'Alice', amount: '10.00' },
        { from: 'Charlie', to: 'Alice', amount: '10.00' }
      ]
    };

    render(<SettlementSection {...propsMultipleSettlements} />);
    expect(screen.getByText(/bob pays alice \$10\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/charlie pays alice \$10\.00/i)).toBeInTheDocument();
  });

  test('handles zero amount bill', () => {
    const propsZeroAmount = {
      ...defaultProps,
      billInfo: { totalAmount: 0 },
      billParticipants: [],
      settlement: []
    };

    render(<SettlementSection {...propsZeroAmount} />);
    expect(screen.getByText(/final total: \$0\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/all settled!/i)).toBeInTheDocument();
  });

  test('formats currency values correctly', () => {
    const propsWithDecimals = {
      ...defaultProps,
      billInfo: { totalAmount: 33.333 },
      settlement: [
        { from: 'Bob', to: 'Alice', amount: '16.67' }
      ]
    };

    render(<SettlementSection {...propsWithDecimals} />);
    expect(screen.getByText(/final total: \$33\.33/i)).toBeInTheDocument();
    expect(screen.getByText(/bob pays alice \$16\.67/i)).toBeInTheDocument();
  });
});