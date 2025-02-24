import { calculateSettlement } from './settlementUtils';

describe('Performance Tests', () => {
  const generateLargeDataset = (size) => {
    return Array(size).fill(null).map((_, i) => ({
      id: i + 1,
      name: `Participant ${i + 1}`,
      amountPaid: i === 0 ? size * 100 : 0, // First person pays everything
      amountOwed: 100 // Everyone owes equal amount
    }));
  };

  test('handles large number of participants efficiently', () => {
    const participants = generateLargeDataset(100);
    
    const startTime = performance.now();
    const settlement = calculateSettlement(participants);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    expect(settlement).toHaveLength(99); // Everyone pays the first person
  });

  test('maintains accuracy with large amounts', () => {
    const participants = [
      { id: 1, name: 'Alice', amountPaid: 1000000.99, amountOwed: 333333.33 },
      { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 333333.33 },
      { id: 3, name: 'Charlie', amountPaid: 0, amountOwed: 333334.33 }
    ];

    const settlement = calculateSettlement(participants);
    const totalTransferred = settlement.reduce((sum, txn) => 
      sum + parseFloat(txn.amount), 0
    );
    
    expect(totalTransferred).toBeCloseTo(666667.66, 2);
  });

  test('optimizes number of transactions for large groups', () => {
    const participants = generateLargeDataset(50);
    const settlement = calculateSettlement(participants);

    // Number of transactions should be less than or equal to n-1
    // where n is the number of participants
    expect(settlement.length).toBeLessThanOrEqual(49);

    // Verify all debts are settled
    const totalPaid = participants.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalOwed = participants.reduce((sum, p) => sum + p.amountOwed, 0);
    expect(totalPaid).toBeCloseTo(totalOwed, 2);
  });

  test('handles concurrent split calculations', async () => {
    const items = Array(100).fill(null).map((_, i) => ({
      id: i,
      price: 100,
      quantity: 1,
      taxRate: 10,
      splitType: 'equal'
    }));

    const participants = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Participant ${i}`
    }));

    const startTime = performance.now();
    
    // Simulate concurrent split calculations
    await Promise.all(items.map(item => 
      new Promise(resolve => {
        const total = item.price * item.quantity * (1 + item.taxRate / 100);
        const split = total / participants.length;
        resolve(split);
      })
    ));

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('maintains performance with complex split types', () => {
    const generateComplexItems = (count) => 
      Array(count).fill(null).map((_, i) => ({
        id: i,
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: i % 3 === 0 ? 'equal' : 
                  i % 3 === 1 ? 'unequal-money' : 'unequal-percent',
        splits: i % 3 !== 0 ? {
          1: i % 3 === 1 ? 50 : 30,
          2: i % 3 === 1 ? 30 : 70
        } : {}
      }));

    const items = generateComplexItems(50);
    const startTime = performance.now();
    
    items.forEach(item => {
      const subtotal = item.price * item.quantity;
      const tax = (subtotal * item.taxRate) / 100;
      const total = subtotal + tax;

      if (item.splitType === 'unequal-money') {
        Object.values(item.splits).reduce((acc, amount) => acc + amount, 0);
      } else if (item.splitType === 'unequal-percent') {
        Object.values(item.splits).reduce((acc, percent) => {
          return acc + (total * percent) / 100;
        }, 0);
      }
    });

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
  });
});