/**
 * Validates and parses a bill JSON input from the external service.
 * It extracts only the relevant fields and renames titles to match the expected bill structure.
 *
 * @param {Object} jsonData - The JSON data from the external service
 * @returns {Object} - Parsed and validated bill data in the expected format
 */
export const loadBillFromJson = (jsonData) => {
  try {
    // Validate required top-level fields from the external JSON
    const requiredFields = ['storeInformation', 'items', 'grandTotal'];
    requiredFields.forEach(field => {
      if (!jsonData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    // Map store information to billInfo (note: using "title" instead of "storeName")
    const { storeInformation, grandTotal, paymentDetails } = jsonData;
    const billInfo = {
      billName: storeInformation.title || 'Unnamed Bill',
      totalAmount: parseFloat(grandTotal) || 0,
      billDate: storeInformation.dateTimeOfPurchase
        ? new Date(storeInformation.dateTimeOfPurchase)
        : new Date(),
      location: storeInformation.storeAddress || '',
      // Optionally, include the payment method in notes if available
      notes: paymentDetails?.paymentMethod
        ? `Payment method: ${paymentDetails.paymentMethod}`
        : '',
      payers: [] // Initialize empty payers array
    };

    // Parse and map items using new JSON keys
    const items = jsonData.items.map(item => ({
      id: Date.now() + Math.random(), // Generate a unique id
      name: item.name || '', // updated from itemName to name
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.totalPrice) || 0, // updated from pricePerUnit to totalPrice
      taxRate: parseFloat(item.tax) || 0,
      taxAmount: parseFloat(item.taxAmount) || 0, // new field from new JSON
      totalAfterTax: parseFloat(item.itemTotalAfterTax) || 0, // new field from new JSON
      splitType: 'equal', // default split type
      splits: {}, // No split details available from new JSON
      includedParticipants: [] // No participant-specific data available
    }));

    // Since the external JSON does not provide participants, we create an empty list
    const participants = [];

    return {
      billInfo,
      items,
      participants,
      isValid: true
    };
  } catch (error) {
    console.error('Error parsing new bill JSON:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

export function handleJsonBillUpload(jsonData, callbacks) {
  try {
    const parsedData = loadBillFromJson(jsonData);
    
    if (parsedData.isValid) {
      // Update bill info
      if (callbacks.setBillInfo && parsedData.billInfo) {
        callbacks.setBillInfo(parsedData.billInfo);
      }

      // Update items
      if (callbacks.setItems && parsedData.items) {
        callbacks.setItems(parsedData.items);
      }

      // Update participants if present
      if (callbacks.setParticipants && parsedData.participants && parsedData.participants.length > 0) {
        callbacks.setParticipants(prev => {
          // Create a map of existing participants by ID
          const existingMap = new Map(prev.map(p => [p.id, p]));
          
          // Update or add participants from the JSON
          parsedData.participants.forEach(p => {
            if (existingMap.has(p.id)) {
              existingMap.set(p.id, { ...existingMap.get(p.id), ...p });
            } else {
              existingMap.set(p.id, p);
            }
          });
          
          return Array.from(existingMap.values());
        });
      }

      return { success: true };
    } else {
      throw new Error(parsedData.error || 'Invalid JSON format');
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Example new JSON structure for reference
export const sampleNewBillJson = {
  storeInformation: {
    title: "Walmart.com",
    storeAddress: "",
    dateTimeOfPurchase: "2025-02-23"
  },
  items: [
    {
      name: "Fresh Jalapeno Pepper",
      quantity: 1,
      totalPrice: 2.83,
      itemType: "Produce",
      taxRate: 0.018,
      taxAmount: 0.05,
      itemTotalAfterTax: 2.88
    },
    // ... additional items
  ],
  subtotalBeforeChargesAndTaxes: 82.01,
  totalExtraChargesDistributed: 0.0,
  taxOnFood: 1.48,
  grandTotal: 83.49,
  paymentDetails: {
    paymentMethod: "Credit Card ending in 9668"
  }
};
