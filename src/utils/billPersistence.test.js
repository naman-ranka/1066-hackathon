import { calculateSettlement } from './settlementUtils';

describe('Bill Persistence and State Management', () => {
  const mockStorage = {
    data: {},
    setItem: (key, value) => {
      mockStorage.data[key] = value;
    },
    getItem: (key) => mockStorage.data[key],
    removeItem: (key) => {
      delete mockStorage.data[key];
    },
    clear: () => {
      mockStorage.data = {};
    }
  };

  beforeEach(() => {
    global.localStorage = mockStorage;
    mockStorage.clear();
  });

  describe('Bill State Persistence', () => {
    const saveBillState = (billData) => {
      const serialized = JSON.stringify(billData);
      localStorage.setItem('billState', serialized);
    };

    const loadBillState = () => {
      const serialized = localStorage.getItem('billState');
      return serialized ? JSON.parse(serialized) : null;
    };

    test('saves and restores complete bill state', () => {
      const billState = {
        billInfo: {
          billName: 'Test Bill',
          totalAmount: 100,
          billDate: '2024-01-30',
          location: 'Test Location'
        },
        items: [
          {
            id: 1,
            name: 'Item 1',
            price: 50,
            quantity: 1,
            taxRate: 10
          }
        ],
        participants: [
          { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 50 },
          { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 50 }
        ]
      };

      saveBillState(billState);
      const restored = loadBillState();

      expect(restored).toEqual(billState);
    });

    test('handles versioning of stored data', () => {
      const oldFormatBill = {
        name: 'Old Bill',
        total: 100,
        people: [
          { name: 'Alice', paid: 100 }
        ]
      };

      // Simulate storing old format
      localStorage.setItem('billState', JSON.stringify(oldFormatBill));

      const migrateBillData = (oldData) => {
        if (!oldData.billInfo) {
          return {
            billInfo: {
              billName: oldData.name,
              totalAmount: oldData.total,
              billDate: new Date().toISOString().split('T')[0]
            },
            participants: oldData.people.map(p => ({
              id: Date.now(),
              name: p.name,
              amountPaid: p.paid,
              amountOwed: 0
            })),
            items: []
          };
        }
        return oldData;
      };

      const restored = migrateBillData(loadBillState());
      expect(restored.billInfo).toBeDefined();
      expect(restored.billInfo.billName).toBe('Old Bill');
    });

    test('handles concurrent modifications', async () => {
      const initialState = {
        billInfo: { billName: 'Initial' },
        version: 1
      };

      saveBillState(initialState);

      // Simulate concurrent modifications
      const update1 = async () => {
        const current = loadBillState();
        current.billInfo.billName = 'Update 1';
        current.version++;
        await new Promise(resolve => setTimeout(resolve, 10));
        saveBillState(current);
        return current.version;
      };

      const update2 = async () => {
        const current = loadBillState();
        current.billInfo.billName = 'Update 2';
        current.version++;
        await new Promise(resolve => setTimeout(resolve, 5));
        saveBillState(current);
        return current.version;
      };

      const [version1, version2] = await Promise.all([update1(), update2()]);
      const finalState = loadBillState();

      expect(Math.max(version1, version2)).toBe(finalState.version);
    });
  });

  describe('Auto-save Functionality', () => {
    test('handles auto-save intervals', () => {
      jest.useFakeTimers();
      const autoSaveQueue = [];
      let lastSaveTime = Date.now();

      const queueAutoSave = (state) => {
        const now = Date.now();
        if (now - lastSaveTime > 1000) {
          saveBillState(state);
          lastSaveTime = now;
          autoSaveQueue.length = 0;
        } else {
          autoSaveQueue.push(state);
        }
      };

      const billState = { billInfo: { billName: 'Test' } };
      queueAutoSave(billState);
      
      jest.advanceTimersByTime(500);
      queueAutoSave({ ...billState, billInfo: { billName: 'Updated' } });
      
      jest.advanceTimersByTime(600);
      const saved = loadBillState();
      expect(saved.billInfo.billName).toBe('Updated');
    });
  });

  describe('Error Recovery', () => {
    test('handles corrupted storage data', () => {
      localStorage.setItem('billState', 'corrupted{json');

      const loadWithRecovery = () => {
        try {
          return loadBillState();
        } catch {
          return {
            billInfo: { billName: 'Recovered Bill' },
            items: [],
            participants: []
          };
        }
      };

      const recovered = loadWithRecovery();
      expect(recovered.billInfo).toBeDefined();
      expect(recovered.billInfo.billName).toBe('Recovered Bill');
    });

    test('maintains backup of previous state', () => {
      const billState = {
        billInfo: { billName: 'Original' },
        items: []
      };

      saveBillState(billState);
      localStorage.setItem('billState.backup', localStorage.getItem('billState'));

      // Simulate corruption
      localStorage.setItem('billState', 'corrupted');

      const getBackupState = () => {
        const backup = localStorage.getItem('billState.backup');
        return backup ? JSON.parse(backup) : null;
      };

      const backup = getBackupState();
      expect(backup.billInfo.billName).toBe('Original');
    });
  });

  describe('Storage Limits', () => {
    test('handles storage quota exceeded', () => {
      const largeBill = {
        billInfo: { billName: 'Large Bill' },
        items: Array(10000).fill({ name: 'Item', price: 1 })
      };

      const saveWithFallback = (billData) => {
        try {
          saveBillState(billData);
          return true;
        } catch (e) {
          if (e.name === 'QuotaExceededError') {
            // Fallback: Save only essential data
            const essential = {
              billInfo: billData.billInfo,
              items: billData.items.slice(0, 100),
              isPartial: true
            };
            saveBillState(essential);
            return 'partial';
          }
          throw e;
        }
      };

      // Mock QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn((key, value) => {
        if (value.length > 5000000) {
          throw new Error('QuotaExceededError');
        }
        mockStorage.data[key] = value;
      });

      const result = saveWithFallback(largeBill);
      expect(result).toBe('partial');

      localStorage.setItem = originalSetItem;
    });
  });
});

describe('Bill Split Data Persistence', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      store: new Map(),
      getItem: (key) => mockLocalStorage.store.get(key),
      setItem: (key, value) => mockLocalStorage.store.set(key, value),
      removeItem: (key) => mockLocalStorage.store.delete(key),
      clear: () => mockLocalStorage.store.clear()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });
  });

  describe('Bill State Management', () => {
    test('persists bill state across sessions', () => {
      const initialState = {
        billInfo: {
          billName: 'Test Dinner',
          totalAmount: 100,
          billDate: '2024-01-30'
        },
        items: [
          {
            id: 1,
            name: 'Pizza',
            price: 50,
            quantity: 2,
            splitType: 'equal'
          }
        ],
        participants: [
          { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 50 },
          { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 50 }
        ]
      };

      // Save state
      localStorage.setItem('billSplitState', JSON.stringify(initialState));

      // Simulate app reload
      const restoredState = JSON.parse(localStorage.getItem('billSplitState'));
      
      expect(restoredState.billInfo.totalAmount).toBe(100);
      expect(restoredState.items).toHaveLength(1);
      expect(restoredState.participants).toHaveLength(2);
    });

    test('handles incremental updates', () => {
      const initialState = {
        billInfo: { billName: 'Test', totalAmount: 0 },
        items: [],
        participants: []
      };

      // Initial save
      localStorage.setItem('billSplitState', JSON.stringify(initialState));

      // Update items
      const updatedState = JSON.parse(localStorage.getItem('billSplitState'));
      updatedState.items.push({
        id: 1,
        name: 'New Item',
        price: 50
      });
      localStorage.setItem('billSplitState', JSON.stringify(updatedState));

      // Verify update
      const finalState = JSON.parse(localStorage.getItem('billSplitState'));
      expect(finalState.items).toHaveLength(1);
      expect(finalState.items[0].name).toBe('New Item');
    });
  });

  describe('Settlement History', () => {
    test('maintains settlement calculation history', () => {
      const settlementHistory = [
        {
          timestamp: '2024-01-30T12:00:00Z',
          settlement: [
            { from: 'Bob', to: 'Alice', amount: '50.00' }
          ]
        }
      ];

      localStorage.setItem('settlementHistory', JSON.stringify(settlementHistory));

      // Add new settlement
      const history = JSON.parse(localStorage.getItem('settlementHistory'));
      history.push({
        timestamp: '2024-01-30T13:00:00Z',
        settlement: [
          { from: 'Charlie', to: 'Alice', amount: '30.00' }
        ]
      });
      localStorage.setItem('settlementHistory', JSON.stringify(history));

      const savedHistory = JSON.parse(localStorage.getItem('settlementHistory'));
      expect(savedHistory).toHaveLength(2);
    });

    test('handles storage limits for history', () => {
      const MAX_HISTORY_ITEMS = 50;
      const largeHistory = Array(100).fill(null).map((_, i) => ({
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        settlement: [{ from: 'User', to: 'Other', amount: '10.00' }]
      }));

      // Attempt to save large history
      const saveHistory = (history) => {
        if (history.length > MAX_HISTORY_ITEMS) {
          // Keep only most recent items
          history = history.slice(-MAX_HISTORY_ITEMS);
        }
        localStorage.setItem('settlementHistory', JSON.stringify(history));
        return history;
      };

      const savedHistory = saveHistory(largeHistory);
      expect(savedHistory).toHaveLength(MAX_HISTORY_ITEMS);
      expect(new Date(savedHistory[0].timestamp).getDate()).toBe(51); // Starts from day 51
    });
  });

  describe('Data Recovery', () => {
    test('recovers from corrupted storage', () => {
      // Simulate corrupted storage
      localStorage.setItem('billSplitState', 'invalid{json}data');

      const loadState = () => {
        try {
          return JSON.parse(localStorage.getItem('billSplitState'));
        } catch {
          // Return default state on corruption
          return {
            billInfo: { billName: 'Recovered Bill', totalAmount: 0 },
            items: [],
            participants: []
          };
        }
      };

      const recoveredState = loadState();
      expect(recoveredState.billInfo.billName).toBe('Recovered Bill');
    });

    test('maintains data integrity during updates', () => {
      const originalState = {
        billInfo: { billName: 'Test', totalAmount: 100 },
        items: [{ id: 1, name: 'Item', price: 100 }],
        participants: [{ id: 1, name: 'Alice', amountPaid: 100 }]
      };

      // Save original state
      localStorage.setItem('billSplitState', JSON.stringify(originalState));

      // Simulate failed update
      const updateState = (update) => {
        const currentState = JSON.parse(localStorage.getItem('billSplitState'));
        localStorage.setItem('billSplitState.backup', JSON.stringify(currentState));
        
        try {
          const newState = { ...currentState, ...update };
          localStorage.setItem('billSplitState', JSON.stringify(newState));
          return true;
        } catch {
          // Restore from backup
          const backup = localStorage.getItem('billSplitState.backup');
          if (backup) {
            localStorage.setItem('billSplitState', backup);
          }
          return false;
        }
      };

      // Attempt update with invalid data
      const success = updateState({ invalidKey: undefined });
      
      const finalState = JSON.parse(localStorage.getItem('billSplitState'));
      expect(finalState).toEqual(originalState);
    });
  });

  describe('Storage Optimization', () => {
    test('compresses large datasets', () => {
      const largeState = {
        billInfo: { billName: 'Large Bill' },
        items: Array(1000).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          price: 10
        }))
      };

      const compress = (data) => {
        // Simple compression: store frequent values as references
        const seen = new Map();
        let compressed = JSON.stringify(data, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            const str = JSON.stringify(value);
            if (seen.has(str)) {
              return { ref: seen.get(str) };
            }
            seen.set(str, seen.size);
            return value;
          }
          return value;
        });

        return compressed;
      };

      const compressedState = compress(largeState);
      localStorage.setItem('billSplitState', compressedState);

      // Verify storage optimization
      const originalSize = JSON.stringify(largeState).length;
      const compressedSize = compressedState.length;
      expect(compressedSize).toBeLessThan(originalSize);
    });

    test('prunes old data automatically', () => {
      const OLD_DATA_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days

      const oldData = {
        timestamp: Date.now() - (OLD_DATA_THRESHOLD + 1000),
        data: { billInfo: { billName: 'Old Bill' } }
      };

      localStorage.setItem('oldBill', JSON.stringify(oldData));

      const pruneOldData = () => {
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item.timestamp && (now - item.timestamp > OLD_DATA_THRESHOLD)) {
              localStorage.removeItem(key);
            }
          } catch {
            // Skip invalid items
          }
        }
      };

      pruneOldData();
      expect(localStorage.getItem('oldBill')).toBeNull();
    });
  });
});