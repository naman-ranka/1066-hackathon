import { saveBill } from './billService';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Bill Service API Integration', () => {
  beforeEach(() => {
    axios.post.mockClear();
  });

  test('should format and send bill data correctly', async () => {
    // Mock data
    const billInfo = {
      billName: 'Test Bill',
      totalAmount: 110,
      billDate: new Date('2024-01-30'),
      location: 'Test Location',
      notes: 'Test notes'
    };

    const items = [
      {
        id: 1,
        name: 'Item 1',
        quantity: 2,
        price: 50,
        taxRate: 10,
        splitType: 'equal',
        includedParticipants: [1, 2]
      }
    ];

    const billParticipants = [
      {
        id: 1,
        name: 'Alice',
        amountPaid: 110,
        amountOwed: 55
      },
      {
        id: 2,
        name: 'Bob',
        amountPaid: 0,
        amountOwed: 55
      }
    ];

    // Mock successful response
    axios.post.mockResolvedValue({
      data: { id: 1, ...billInfo }
    });

    // Make the API call
    await saveBill(billInfo, items, billParticipants);

    // Verify the request format
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/bills/',
      expect.objectContaining({
        name: billInfo.billName,
        date: '2024-01-30',
        total_amount: 110,
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Item 1',
            quantity: 2,
            price: 50,
            tax_rate: 10
          })
        ]),
        billParticipants: expect.arrayContaining([
          expect.objectContaining({
            name: 'Alice',
            amount_paid: 110,
            amount_owed: 55
          })
        ])
      })
    );
  });

  test('should handle API errors', async () => {
    const errorMessage = 'Network Error';
    axios.post.mockRejectedValue(new Error(errorMessage));

    const billInfo = {
      billName: 'Test Bill',
      totalAmount: 100,
      billDate: new Date()
    };

    await expect(saveBill(billInfo, [], [])).rejects.toThrow(errorMessage);
  });

  describe('Network Resilience', () => {
    test('should retry on network failure', async () => {
      // First call fails, second succeeds
      axios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { id: 1, message: 'Success' } });

      const billInfo = {
        billName: 'Test Bill',
        totalAmount: 100,
        billDate: new Date('2024-01-30')
      };

      const result = await saveBill(billInfo, [], []);
      expect(result).toEqual({ id: 1, message: 'Success' });
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    test('should handle timeout', async () => {
      axios.post.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

      await expect(saveBill({}, [], [])).rejects.toThrow('timeout');
    });

    test('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      axios.post.mockRejectedValue(serverError);

      await expect(saveBill({}, [], [])).rejects.toThrow('Internal server error');
    });
  });

  describe('Data Validation', () => {
    test('should validate bill data before sending', async () => {
      const invalidBillInfo = {
        billName: '',  // Empty name
        totalAmount: -100,  // Negative amount
        billDate: 'invalid-date'
      };

      await expect(saveBill(invalidBillInfo, [], [])).rejects.toThrow('validation');
    });

    test('should handle large payloads', async () => {
      const largeBillInfo = {
        billName: 'Large Bill',
        totalAmount: 1000000,
        billDate: new Date()
      };

      const largeItemList = Array(1000).fill(null).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        price: 10,
        quantity: 1
      }));

      const manyParticipants = Array(100).fill(null).map((_, i) => ({
        id: i,
        name: `Person ${i}`,
        amountPaid: 0,
        amountOwed: 100
      }));

      axios.post.mockResolvedValueOnce({ data: { id: 1, message: 'Success' } });
      
      const result = await saveBill(largeBillInfo, largeItemList, manyParticipants);
      expect(result).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple concurrent saves', async () => {
      const bills = Array(5).fill(null).map((_, i) => ({
        billInfo: {
          billName: `Bill ${i}`,
          totalAmount: 100,
          billDate: new Date()
        },
        items: [],
        participants: []
      }));

      axios.post.mockResolvedValue({ data: { id: 1, message: 'Success' } });

      await Promise.all(bills.map(({ billInfo, items, participants }) => 
        saveBill(billInfo, items, participants)
      ));

      expect(axios.post).toHaveBeenCalledTimes(5);
    });
  });

  describe('Response Handling', () => {
    test('should handle partial success response', async () => {
      const partialSuccess = {
        data: {
          id: 1,
          message: 'Saved with warnings',
          warnings: ['Some items could not be processed']
        }
      };
      axios.post.mockResolvedValue(partialSuccess);

      const result = await saveBill({}, [], []);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Some items could not be processed');
    });

    test('should handle malformed response', async () => {
      axios.post.mockResolvedValue({ data: null });
      
      await expect(saveBill({}, [], [])).rejects.toThrow('Invalid response');
    });
  });

  describe('Authorization', () => {
    test('should handle unauthorized access', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      axios.post.mockRejectedValue(unauthorizedError);

      await expect(saveBill({}, [], [])).rejects.toThrow('Unauthorized');
    });

    test('should handle expired session', async () => {
      const sessionExpiredError = {
        response: {
          status: 403,
          data: { message: 'Session expired' }
        }
      };
      axios.post.mockRejectedValue(sessionExpiredError);

      await expect(saveBill({}, [], [])).rejects.toThrow('Session expired');
    });
  });
});