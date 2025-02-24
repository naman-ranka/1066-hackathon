/**
 * Validates and parses a bill JSON input
 * @param {Object} jsonData - The JSON data containing bill information
 * @returns {Object} - Parsed and validated bill data
 */
export const loadBillFromJson = (jsonData) => {
  try {
    // Validate required fields
    const requiredFields = ['billInfo', 'items', 'billParticipants'];
    requiredFields.forEach(field => {
      if (!jsonData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    // Parse bill info
    const billInfo = {
      billName: jsonData.billInfo.billName || '',
      totalAmount: parseFloat(jsonData.billInfo.totalAmount) || 0,
      billDate: jsonData.billInfo.billDate ? new Date(jsonData.billInfo.billDate) : new Date(),
      location: jsonData.billInfo.location || '',
      notes: jsonData.billInfo.notes || ''
    };

    // Parse items
    const items = jsonData.items.map(item => ({
      id: Date.now() + Math.random(),
      name: item.name || '',
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
      taxRate: parseFloat(item.taxRate) || 0,
      splitType: item.splitType || 'equal',
      splits: item.splits || {},
      includedParticipants: item.includedParticipants || []
    }));

    // Parse billParticipants
    const billParticipants = jsonData.billParticipants.map(p => ({
      id: Date.now() + Math.random(),
      name: p.name || '',
      amountPaid: parseFloat(p.amountPaid) || 0,
      amountOwed: parseFloat(p.amountOwed) || 0
    }));

    return {
      billInfo,
      items,
      billParticipants,
      isValid: true
    };
  } catch (error) {
    console.error('Error parsing bill JSON:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// Example JSON structure for reference
export const sampleBillJson = {
  billInfo: {
    billName: "Dinner at Restaurant",
    totalAmount: 150.00,
    billDate: "2023-10-20",
    location: "Sample Restaurant",
    notes: "Team dinner"
  },
  items: [
    {
      name: "Pizza",
      quantity: 2,
      price: 25.00,
      taxRate: 10,
      splitType: "equal",
      splits: {},
      includedParticipants: []
    }
  ],
  billParticipants: [
    {
      name: "John",
      amountPaid: 100,
      amountOwed: 50
    },
    {
      name: "Jane",
      amountPaid: 50,
      amountOwed: 100
    }
  ]
};