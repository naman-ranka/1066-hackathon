describe('Currency and Internationalization', () => {
  const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  describe('Currency Formatting', () => {
    test('handles different currency symbols', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100.00');
      expect(formatCurrency(100, 'EUR', 'de-DE')).toBe('100,00 €');
      expect(formatCurrency(100, 'JPY', 'ja-JP')).toBe('￥100');
      expect(formatCurrency(100, 'GBP')).toBe('£100.00');
    });

    test('handles different decimal separators', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €');
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'INR', 'en-IN')).toBe('₹1,234.56');
    });

    test('handles currencies without decimals', () => {
      expect(formatCurrency(1234, 'JPY', 'ja-JP')).toBe('￥1,234');
      expect(formatCurrency(1234.56, 'KRW', 'ko-KR')).toBe('₩1,235');
    });
  });

  describe('Currency Conversion', () => {
    const convertCurrency = async (amount, fromCurrency, toCurrency, rates) => {
      if (fromCurrency === toCurrency) return amount;
      const rate = rates[`${fromCurrency}_${toCurrency}`];
      return amount * rate;
    };

    const mockRates = {
      'USD_EUR': 0.85,
      'EUR_USD': 1.18,
      'GBP_USD': 1.38,
      'USD_GBP': 0.72
    };

    test('converts between different currencies', async () => {
      const usdAmount = 100;
      const eurAmount = await convertCurrency(usdAmount, 'USD', 'EUR', mockRates);
      expect(eurAmount).toBe(85);

      const gbpAmount = await convertCurrency(usdAmount, 'USD', 'GBP', mockRates);
      expect(gbpAmount).toBe(72);
    });

    test('handles conversion back to original currency', async () => {
      const originalUSD = 100;
      const inEUR = await convertCurrency(originalUSD, 'USD', 'EUR', mockRates);
      const backToUSD = await convertCurrency(inEUR, 'EUR', 'USD', mockRates);
      expect(backToUSD).toBeCloseTo(originalUSD, 2);
    });

    test('maintains precision in calculations', async () => {
      const amount = 33.33;
      const converted = await convertCurrency(amount, 'USD', 'EUR', mockRates);
      expect(converted).toBeCloseTo(28.33, 2);
    });
  });

  describe('Bill Splitting with Multiple Currencies', () => {
    test('splits bill with mixed currency payments', () => {
      const bill = {
        totalAmount: 100,
        currency: 'USD',
        payments: [
          { amount: 50, currency: 'USD' },
          { amount: 42.5, currency: 'EUR' } // Equivalent to $50 USD
        ]
      };

      const validatePayments = (payments, totalAmount, rates) => {
        const totalUSD = payments.reduce((sum, payment) => {
          if (payment.currency === 'USD') return sum + payment.amount;
          return sum + (payment.amount * rates[`${payment.currency}_USD`]);
        }, 0);
        return Math.abs(totalUSD - totalAmount) < 0.01;
      };

      expect(validatePayments(bill.payments, bill.totalAmount, mockRates)).toBe(true);
    });

    test('handles rounding in different currencies', () => {
      const roundInCurrency = (amount, currency) => {
        switch(currency) {
          case 'JPY': return Math.round(amount);
          case 'BHD': return Number(amount.toFixed(3));
          default: return Number(amount.toFixed(2));
        }
      };

      expect(roundInCurrency(10.545, 'USD')).toBe(10.55);
      expect(roundInCurrency(10.545, 'JPY')).toBe(11);
      expect(roundInCurrency(10.5454, 'BHD')).toBe(10.545);
    });
  });

  describe('Localization', () => {
    const formatDate = (date, locale) => {
      return new Intl.DateTimeFormat(locale).format(new Date(date));
    };

    test('formats dates according to locale', () => {
      const date = '2024-01-30';
      expect(formatDate(date, 'en-US')).toBe('1/30/2024');
      expect(formatDate(date, 'de-DE')).toBe('30.1.2024');
      expect(formatDate(date, 'ja-JP')).toBe('2024/1/30');
    });

    test('formats large numbers according to locale', () => {
      const number = 1234567.89;
      expect(new Intl.NumberFormat('en-US').format(number)).toBe('1,234,567.89');
      expect(new Intl.NumberFormat('de-DE').format(number)).toBe('1.234.567,89');
      expect(new Intl.NumberFormat('en-IN').format(number)).toBe('12,34,567.89');
    });
  });
});