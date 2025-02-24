describe('Item Calculations', () => {
  const calculateItemTotal = (item) => {
    const subtotal = Number((item.price * item.quantity).toFixed(2));
    const taxAmount = Number(((subtotal * item.taxRate) / 100).toFixed(2));
    return Number((subtotal + taxAmount).toFixed(2));
  };

  test('should calculate basic item total without tax', () => {
    const item = {
      price: 10,
      quantity: 2,
      taxRate: 0
    };
    expect(calculateItemTotal(item)).toBe(20);
  });

  test('should calculate item total with tax', () => {
    const item = {
      price: 10,
      quantity: 2,
      taxRate: 10
    };
    expect(calculateItemTotal(item)).toBe(22); // 20 + (20 * 0.1)
  });

  test('should handle fractional quantities and amounts', () => {
    const item = {
      price: 9.99,
      quantity: 2.5,
      taxRate: 8.1
    };
    // 9.99 * 2.5 = 24.975, rounded to 24.98
    // Tax: 24.98 * 0.081 = 2.02338, rounded to 2.02
    // Total: 24.98 + 2.02 = 27
    expect(calculateItemTotal(item)).toBe(27);
  });
});

describe('Split Calculations', () => {
  test('should split equally between participants', () => {
    const item = {
      price: 30,
      quantity: 1,
      taxRate: 10,
      splitType: 'equal',
      includedParticipants: [1, 2, 3]
    };
    const total = 33; // 30 + (30 * 0.1)
    const perPersonShare = total / 3;
    expect(perPersonShare).toBe(11);
  });

  test('should handle unequal money splits', () => {
    const item = {
      price: 100,
      quantity: 1,
      taxRate: 10,
      splitType: 'unequal-money',
      splits: {
        '1': 60,
        '2': 40,
        '3': 10
      }
    };
    const splits = Object.values(item.splits);
    const totalSplit = splits.reduce((sum, amount) => sum + amount, 0);
    expect(totalSplit).toBe(110); // Should match total with tax
  });

  test('should handle percentage splits', () => {
    const item = {
      price: 100,
      quantity: 1,
      taxRate: 10,
      splitType: 'unequal-percent',
      splits: {
        '1': 50, // 50%
        '2': 30, // 30%
        '3': 20  // 20%
      }
    };
    const total = 110; // 100 + 10% tax
    const splits = Object.values(item.splits);
    const totalPercent = splits.reduce((sum, percent) => sum + percent, 0);
    expect(totalPercent).toBe(100);
    
    // Check individual shares
    expect(total * 0.5).toBe(55); // Person 1's share
    expect(total * 0.3).toBe(33); // Person 2's share
    expect(total * 0.2).toBe(22); // Person 3's share
  });
});

describe('Complex Split Calculations', () => {
  const calculateItemSplit = (item, participants) => {
    const itemTotal = calculateItemTotal(item);
    const splits = {};

    if (item.splitType === 'equal') {
      const relevantParticipants = item.includedParticipants?.length 
        ? item.includedParticipants 
        : participants.map(p => p.id);
      const share = itemTotal / relevantParticipants.length;
      relevantParticipants.forEach(id => {
        splits[id] = share;
      });
    } else if (item.splitType === 'unequal-money') {
      Object.entries(item.splits).forEach(([id, amount]) => {
        splits[id] = parseFloat(amount);
      });
    } else if (item.splitType === 'unequal-percent') {
      const totalPercent = Object.values(item.splits)
        .reduce((sum, percent) => sum + parseFloat(percent), 0);
      Object.entries(item.splits).forEach(([id, percent]) => {
        splits[id] = (itemTotal * parseFloat(percent)) / totalPercent;
      });
    }
    return splits;
  };

  describe('Equal Splits', () => {
    test('handles split with excluded participants', () => {
      const item = {
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: 'equal',
        includedParticipants: [1, 2] // Only participants 1 and 2
      };
      
      const participants = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' } // Excluded
      ];

      const splits = calculateItemSplit(item, participants);
      expect(splits[1]).toBe(55); // (100 + 10% tax) / 2
      expect(splits[2]).toBe(55);
      expect(splits[3]).toBeUndefined();
    });

    test('handles split with all participants by default', () => {
      const item = {
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: 'equal'
      };
      
      const participants = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];

      const splits = calculateItemSplit(item, participants);
      expect(splits[1]).toBeCloseTo(36.67, 2);
      expect(splits[2]).toBeCloseTo(36.67, 2);
      expect(splits[3]).toBeCloseTo(36.66, 2);
    });
  });

  describe('Unequal Money Splits', () => {
    test('handles partial payments', () => {
      const item = {
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: 'unequal-money',
        splits: {
          1: 60,
          2: 50 // Underpaid by 0.50
        }
      };

      const splits = calculateItemSplit(item);
      expect(splits[1]).toBe(60);
      expect(splits[2]).toBe(50);
      expect(Object.values(splits).reduce((a, b) => a + b)).toBeLessThan(110);
    });

    test('handles overpayment', () => {
      const item = {
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: 'unequal-money',
        splits: {
          1: 60,
          2: 55 // Overpaid by 5
        }
      };

      const splits = calculateItemSplit(item);
      expect(splits[1]).toBe(60);
      expect(splits[2]).toBe(55);
      expect(Object.values(splits).reduce((a, b) => a + b)).toBeGreaterThan(110);
    });
  });

  describe('Percentage Splits', () => {
    test('normalizes percentages when they don\'t sum to 100', () => {
      const item = {
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: 'unequal-percent',
        splits: {
          1: 30, // Should become 37.5%
          2: 50  // Should become 62.5%
        }
      };

      const splits = calculateItemSplit(item);
      expect(splits[1]).toBeCloseTo(41.25); // 37.5% of 110
      expect(splits[2]).toBeCloseTo(68.75); // 62.5% of 110
    });

    test('handles fractional percentages', () => {
      const item = {
        price: 99,
        quantity: 1,
        taxRate: 10,
        splitType: 'unequal-percent',
        splits: {
          1: 33.33,
          2: 33.33,
          3: 33.34
        }
      };

      const splits = calculateItemSplit(item);
      const total = 108.90; // 99 + 10% tax
      expect(splits[1]).toBeCloseTo(36.30);
      expect(splits[2]).toBeCloseTo(36.30);
      expect(splits[3]).toBeCloseTo(36.30);
      expect(Object.values(splits).reduce((a, b) => a + b)).toBeCloseTo(total);
    });
  });

  describe('Edge Cases', () => {
    test('handles zero price items', () => {
      const item = {
        price: 0,
        quantity: 1,
        taxRate: 10,
        splitType: 'equal'
      };
      
      const participants = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];

      const splits = calculateItemSplit(item, participants);
      expect(splits[1]).toBe(0);
      expect(splits[2]).toBe(0);
    });

    test('handles single participant split', () => {
      const item = {
        price: 100,
        quantity: 1,
        taxRate: 10,
        splitType: 'equal',
        includedParticipants: [1]
      };
      
      const participants = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];

      const splits = calculateItemSplit(item, participants);
      expect(splits[1]).toBe(110);
      expect(splits[2]).toBeUndefined();
    });

    test('handles high precision numbers', () => {
      const item = {
        price: 33.33,
        quantity: 3,
        taxRate: 7.725,
        splitType: 'equal'
      };
      
      const participants = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];

      const splits = calculateItemSplit(item, participants);
      const totalSplit = Object.values(splits).reduce((a, b) => a + b);
      expect(totalSplit).toBeCloseTo(107.73); // (33.33 * 3) + 7.725%
      expect(splits[1]).toBeCloseTo(53.865);
      expect(splits[2]).toBeCloseTo(53.865);
    });
  });
});