import { processReceiptImage } from './imageProcessor';

describe('Image Processing', () => {
  // Mock fetch for API calls
  global.fetch = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
  });

  test('should process valid image file', async () => {
    const mockResponse = {
      text: [
        'Store: Test Restaurant',
        'Date: 2024-01-30',
        'Item 1 $10.00',
        'Item 2 $20.00',
        'Tax: $3.00',
        'Total: $33.00'
      ],
      confidence: 0.95,
      items: [
        { name: 'Item 1', price: 10.00 },
        { name: 'Item 2', price: 20.00 }
      ],
      totalAmount: 33.00,
      taxAmount: 3.00
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const imageFile = new File(['dummy image content'], 'receipt.jpg', {
      type: 'image/jpeg'
    });

    const result = await processReceiptImage(imageFile);
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.totalAmount).toBe(33.00);
  });

  test('should handle image processing errors', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    const imageFile = new File(['dummy image content'], 'receipt.jpg', {
      type: 'image/jpeg'
    });

    const result = await processReceiptImage(imageFile);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('should validate image file type', async () => {
    const invalidFile = new File(['dummy content'], 'document.pdf', {
      type: 'application/pdf'
    });

    const result = await processReceiptImage(invalidFile);
    expect(result.success).toBe(false);
    expect(result.error).toContain('file type');
  });

  test('should handle low confidence OCR results', async () => {
    const mockResponse = {
      text: ['Unclear Text'],
      confidence: 0.3,
      items: [],
      totalAmount: 0,
      taxAmount: 0
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const imageFile = new File(['dummy image content'], 'receipt.jpg', {
      type: 'image/jpeg'
    });

    const result = await processReceiptImage(imageFile);
    expect(result.success).toBe(false);
    expect(result.error).toContain('confidence');
  });

  test('should extract store information when available', async () => {
    const mockResponse = {
      text: [
        'Store: Test Restaurant',
        'Address: 123 Test St',
        'Phone: 555-1234',
        'Date: 2024-01-30',
        'Total: $50.00'
      ],
      confidence: 0.95,
      storeInfo: {
        name: 'Test Restaurant',
        address: '123 Test St',
        phone: '555-1234'
      },
      items: [],
      totalAmount: 50.00
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const imageFile = new File(['dummy image content'], 'receipt.jpg', {
      type: 'image/jpeg'
    });

    const result = await processReceiptImage(imageFile);
    expect(result.success).toBe(true);
    expect(result.storeInfo).toBeDefined();
    expect(result.storeInfo.name).toBe('Test Restaurant');
  });

  test('should handle partial OCR results', async () => {
    const mockResponse = {
      text: [
        'Store: Test Restaurant',
        'Item 1 $10.00',
        // Missing total and tax information
      ],
      confidence: 0.95,
      items: [{ name: 'Item 1', price: 10.00 }],
      // Missing totalAmount and taxAmount
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const imageFile = new File(['dummy image content'], 'receipt.jpg', {
      type: 'image/jpeg'
    });

    const result = await processReceiptImage(imageFile);
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.totalAmount).toBe(10.00); // Should calculate from items
    expect(result.taxAmount).toBe(0); // Should default to 0
  });

  describe('Receipt Format Recognition', () => {
    test('should handle handwritten receipts', async () => {
      const mockResponse = {
        text: [
          'handwritten content',
          'Total: $45.00'
        ],
        confidence: 0.65,
        isHandwritten: true
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const imageFile = new File(['dummy content'], 'handwritten.jpg', {
        type: 'image/jpeg'
      });

      const result = await processReceiptImage(imageFile);
      expect(result.isHandwritten).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
    });

    test('should handle thermal paper receipts', async () => {
      const mockResponse = {
        text: [
          'Faded thermal print',
          'Total: $30.00'
        ],
        confidence: 0.75,
        isThermal: true,
        requiresEnhancement: true
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const imageFile = new File(['dummy content'], 'thermal.jpg', {
        type: 'image/jpeg'
      });

      const result = await processReceiptImage(imageFile);
      expect(result.requiresEnhancement).toBe(true);
    });

    test('should handle receipts with multiple currencies', async () => {
      const mockResponse = {
        text: [
          'Amount: €50.00',
          'USD: $55.30',
          'Local: ¥6000'
        ],
        currencies: {
          EUR: 50.00,
          USD: 55.30,
          JPY: 6000
        }
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'multi_currency.jpg', { type: 'image/jpeg' })
      );
      expect(result.currencies).toBeDefined();
      expect(Object.keys(result.currencies).length).toBe(3);
    });
  });

  describe('Image Quality Handling', () => {
    test('should handle blurry images', async () => {
      const mockResponse = {
        isBlurry: true,
        blurScore: 0.8,
        needsRetake: true
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'blurry.jpg', { type: 'image/jpeg' })
      );
      expect(result.needsRetake).toBe(true);
    });

    test('should handle poor lighting conditions', async () => {
      const mockResponse = {
        isDark: true,
        brightnessFactor: 0.2,
        needsEnhancement: true
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'dark.jpg', { type: 'image/jpeg' })
      );
      expect(result.needsEnhancement).toBe(true);
    });

    test('should handle rotated images', async () => {
      const mockResponse = {
        originalOrientation: 90,
        correctedOrientation: 0,
        wasRotated: true
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      expect(result.wasRotated).toBe(true);
    });
  });

  describe('Special Receipt Types', () => {
    test('should handle split checks from restaurants', async () => {
      const mockResponse = {
        text: [
          'Split Check 1 of 2',
          'Table: 15',
          'Items:',
          'Pizza $20',
          'Subtotal: $20',
          'Tax: $2',
          'Total: $22'
        ],
        isSplitCheck: true,
        splitNumber: 1,
        totalSplits: 2
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'split_check.jpg', { type: 'image/jpeg' })
      );
      expect(result.isSplitCheck).toBe(true);
      expect(result.splitNumber).toBe(1);
    });

    test('should handle digital receipts (QR/barcode)', async () => {
      const mockResponse = {
        text: ['Regular receipt content'],
        hasQRCode: true,
        qrContent: {
          id: '123456',
          items: [
            { name: 'Item 1', price: 10 }
          ]
        }
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'digital.jpg', { type: 'image/jpeg' })
      );
      expect(result.hasQRCode).toBe(true);
      expect(result.qrContent).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    test('should attempt text extraction when OCR fails', async () => {
      fetch
        .mockRejectedValueOnce(new Error('OCR failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: ['Backup text extraction'],
            confidence: 0.4
          })
        });

      const result = await processReceiptImage(
        new File(['dummy content'], 'receipt.jpg', { type: 'image/jpeg' })
      );
      expect(result.usedBackupExtraction).toBe(true);
      expect(result.text).toBeDefined();
    });

    test('should handle partial OCR results', async () => {
      const mockResponse = {
        text: ['Total: $50'],
        confidence: 0.9,
        isPartial: true,
        missingFields: ['items', 'tax']
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processReceiptImage(
        new File(['dummy content'], 'partial.jpg', { type: 'image/jpeg' })
      );
      expect(result.isPartial).toBe(true);
      expect(result.missingFields).toContain('items');
    });
  });
});