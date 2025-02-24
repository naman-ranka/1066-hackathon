import { calculateSettlement } from './settlementUtils';

describe('Settlement Calculations', () => {
  test('should return empty array when everyone is settled', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 100 },
      { id: 2, name: 'Bob', amountPaid: 50, amountOwed: 50 }
    ];
    
    const settlement = calculateSettlement(participants);
    expect(settlement).toEqual([]);
  });

  test('should calculate simple settlement between two people', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 50 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 50 }
    ];
    
    const settlement = calculateSettlement(participants);
    expect(settlement).toHaveLength(1);
    expect(settlement[0]).toEqual({
      from: 'Bob',
      to: 'Alice',
      amount: '50.00'
    });
  });

  test('should handle multiple participants with complex settlements', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 40 },
      { id: 2, name: 'Bob', amountPaid: 50, amountOwed: 70 },
      { id: 3, name: 'Charlie', amountPaid: 30, amountOwed: 70 }
    ];
    
    const settlement = calculateSettlement(participants);
    expect(settlement).toHaveLength(2);
    
    // Charlie owes more, should be first in settlement
    expect(settlement[0].from).toBe('Charlie');
    expect(settlement[0].to).toBe('Alice');
    
    // Then Bob settles remaining
    expect(settlement[1].from).toBe('Bob');
    expect(settlement[1].to).toBe('Alice');
    
    // Total settlements should match total imbalance
    const totalSettled = settlement.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
    expect(totalSettled).toBeCloseTo(60); // Alice overpaid by 60 (100-40)
  });

  test('should handle decimal precision correctly', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 100.33, amountOwed: 33.44 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 33.44 },
      { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 33.45 }
    ];
    
    const settlement = calculateSettlement(participants);
    const totalTransferred = settlement.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
    expect(totalTransferred).toBeCloseTo(66.89); // Alice's overpayment
    
    // Verify amounts are rounded to 2 decimal places
    settlement.forEach(txn => {
      expect(txn.amount).toMatch(/^\d+\.\d{2}$/);
    });
  });

  test('should optimize number of transactions', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 20 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 20 },
      { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 20 },
      { id: 4, name: 'David', amountPaid: 0, amountOwed: 20 },
      { id: 5, name: 'Eve', amountPaid: 0, amountOwed: 20 }
    ];
    
    const settlement = calculateSettlement(participants);
    // Should create 4 transactions (one per debtor) instead of chain transfers
    expect(settlement.length).toBe(4);
    expect(new Set(settlement.map(s => s.to)).size).toBe(1); // All payments go to Alice
  });

  test('should handle when someone paid exact share', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 40 },
      { id: 2, name: 'Bob', amountPaid: 20, amountOwed: 40 },
      { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 40 }
    ];
    
    const settlement = calculateSettlement(participants);
    expect(settlement.length).toBe(2);
    // Bob should pay 20, Charlie should pay 40
    expect(settlement.find(s => s.from === 'Bob').amount).toBe('20.00');
    expect(settlement.find(s => s.from === 'Charlie').amount).toBe('40.00');
  });

  test('should handle floating point arithmetic edge cases', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 10.1, amountOwed: 3.37 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 3.37 },
      { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 3.36 }
    ];
    
    const settlement = calculateSettlement(participants);
    const totalSettled = settlement.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
    expect(totalSettled).toBeCloseTo(6.73); // 10.1 - 3.37
    
    // Should handle the 0.01 difference properly
    expect(settlement.find(s => s.from === 'Charlie').amount).toBe('3.36');
  });

  test('should handle perfect three-way split', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 30, amountOwed: 10 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 10 },
      { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 10 }
    ];
    
    const settlement = calculateSettlement(participants);
    expect(settlement).toHaveLength(2);
    settlement.forEach(txn => {
      expect(txn.amount).toBe('10.00');
      expect(txn.to).toBe('Alice');
    });
  });
});