import { loadBillFromJson, sampleNewBillJson } from './billLoader';

describe('Bill Loading', () => {
  test('should handle empty or invalid JSON', () => {
    const result = loadBillFromJson({});
    expect(result.isValid).toBeFalsy();
  });

  test('should correctly parse valid bill JSON', () => {
    const validJson = {
      storeInformation: {
        storeName: "Test Store",
        dateTimeOfPurchase: "2024-01-30T10:00:00Z"
      },
      items: [
        {
          itemName: "Test Item",
          quantity: 2,
          pricePerUnit: 10,
          totalPrice: 20,
          itemType: "Produce",
          taxRate: 1.8,
        }
      ]
    };

    const result = loadBillFromJson(validJson);
    
    expect(result.isValid).toBeTruthy();
    expect(result.billInfo.billName).toBe("Test Store");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      name: "Test Item",
      quantity: 2,
      price: 10,
      taxRate: 1.8,
      splitType: "equal"
    });
  });

  test('should handle missing optional fields', () => {
    const minimalJson = {
      storeInformation: {
        storeName: "Test Store"
      },
      items: [
        {
          itemName: "Test Item",
          pricePerUnit: 10
        }
      ]
    };

    const result = loadBillFromJson(minimalJson);
    
    expect(result.isValid).toBeTruthy();
    expect(result.items[0]).toMatchObject({
      quantity: 1,  // default value
      taxRate: 0,   // default value
      splitType: "equal",
      splits: {},
      includedParticipants: []
    });
  });

  test('should match sample JSON structure', () => {
    expect(sampleNewBillJson).toBeDefined();
    expect(sampleNewBillJson.storeInformation).toBeDefined();
    expect(sampleNewBillJson.items).toBeDefined();
  });

  describe('Error Handling', () => {
    test('should handle invalid store information', () => {
      const invalidJson = {
        storeInformation: null,
        items: []
      };

      const result = loadBillFromJson(invalidJson);
      expect(result.isValid).toBeFalsy();
      expect(result.error).toContain('store information');
    });

    test('should handle invalid date format', () => {
      const invalidDateJson = {
        storeInformation: {
          storeName: "Test Store",
          dateTimeOfPurchase: "invalid-date"
        },
        items: []
      };

      const result = loadBillFromJson(invalidDateJson);
      expect(result.isValid).toBeFalsy();
      expect(result.error).toContain('date');
    });

    test('should handle missing required fields in items', () => {
      const invalidItemsJson = {
        storeInformation: {
          storeName: "Test Store",
          dateTimeOfPurchase: "2024-01-30T10:00:00Z"
        },
        items: [
          { 
            // Missing itemName
            pricePerUnit: 10
          }
        ]
      };

      const result = loadBillFromJson(invalidItemsJson);
      expect(result.isValid).toBeFalsy();
      expect(result.error).toContain('item name');
    });

    test('should handle negative prices', () => {
      const negativeValuesJson = {
        storeInformation: {
          storeName: "Test Store",
          dateTimeOfPurchase: "2024-01-30T10:00:00Z"
        },
        items: [
          {
            itemName: "Test Item",
            pricePerUnit: -10,
            quantity: 1
          }
        ]
      };

      const result = loadBillFromJson(negativeValuesJson);
      expect(result.isValid).toBeFalsy();
      expect(result.error).toContain('negative');
    });

    test('should handle malformed JSON structure', () => {
      const malformedJson = {
        storeInformation: {
          storeName: "Test Store"
        },
        // items is not an array
        items: "not an array"
      };

      const result = loadBillFromJson(malformedJson);
      expect(result.isValid).toBeFalsy();
      expect(result.error).toContain('invalid');
    });
  });

  describe('Data Transformation', () => {
    test('should convert legacy format to new format', () => {
      const legacyJson = {
        store: "Old Store",
        date: "2024-01-30",
        items: [
          {
            name: "Legacy Item",
            price: 10,
            qty: 2
          }
        ]
      };

      const result = loadBillFromJson(legacyJson);
      expect(result.isValid).toBeTruthy();
      expect(result.billInfo.billName).toBe("Old Store");
      expect(result.items[0].quantity).toBe(2);
    });

    test('should handle different tax formats', () => {
      const mixedTaxJson = {
        storeInformation: {
          storeName: "Test Store",
          dateTimeOfPurchase: "2024-01-30T10:00:00Z"
        },
        items: [
          {
            itemName: "Item 1",
            pricePerUnit: 10,
            taxRate: "10%"
          },
          {
            itemName: "Item 2",
            pricePerUnit: 20,
            taxRate: 0.15
          }
        ]
      };

      const result = loadBillFromJson(mixedTaxJson);
      expect(result.isValid).toBeTruthy();
      expect(result.items[0].taxRate).toBe(10);
      expect(result.items[1].taxRate).toBe(15);
    });

    test('should sanitize item names', () => {
      const dirtyJson = {
        storeInformation: {
          storeName: "Test Store",
          dateTimeOfPurchase: "2024-01-30T10:00:00Z"
        },
        items: [
          {
            itemName: "   Item with spaces   ",
            pricePerUnit: 10
          },
          {
            itemName: "<script>alert('xss')</script>Item",
            pricePerUnit: 20
          }
        ]
      };

      const result = loadBillFromJson(dirtyJson);
      expect(result.isValid).toBeTruthy();
      expect(result.items[0].name).toBe("Item with spaces");
      expect(result.items[1].name).not.toContain("<script>");
    });
  });

  describe('Performance', () => {
    test('should handle large number of items efficiently', () => {
      const largeJson = {
        storeInformation: {
          storeName: "Big Store",
          dateTimeOfPurchase: "2024-01-30T10:00:00Z"
        },
        items: Array(1000).fill(null).map((_, i) => ({
          itemName: `Item ${i}`,
          pricePerUnit: 10,
          quantity: 1
        }))
      };

      const startTime = performance.now();
      const result = loadBillFromJson(largeJson);
      const endTime = performance.now();

      expect(result.isValid).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // Should process within 1 second
      expect(result.items).toHaveLength(1000);
    });
  });
});