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
  
      // Map store information to billInfo
      const { storeInformation, grandTotal, paymentDetails } = jsonData;
      const billInfo = {
        billName: storeInformation.storeName || 'Unnamed Bill',
        totalAmount: parseFloat(grandTotal) || 0,
        billDate: storeInformation.dateTimeOfPurchase ? new Date(storeInformation.dateTimeOfPurchase) : new Date(),
        location: storeInformation.storeAddress || '',
        // Optionally, include the payment method in notes if available
        notes: paymentDetails?.paymentMethod ? `Payment method: ${paymentDetails.paymentMethod}` : '',
        payers: [], // Initialize empty payers array
      };
  
      // Parse and map items
      const items = jsonData.items.map(item => ({
        id: Date.now() + Math.random(), // Generate a unique id
        name: item.itemName || '',
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.pricePerUnit) || 0,
        taxRate: parseFloat(item.taxRate) || 0,
        splitType: 'equal', // default split type
        splits: {}, // No split details available from new JSON
        includedParticipants: [] // No participant-specific data available
      }));
  
      // Since the external JSON does not provide billParticipants, we create an empty list
      const billParticipants = [];
  
      return {
        billInfo,
        items,
        billParticipants,
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
  
  // Example new JSON structure for reference
  export const sampleNewBillJson = {
    storeInformation: {
      storeName: "SuperMart",
      storeAddress: "123 Market St",
      storeContact: "555-1234",
      dateTimeOfPurchase: "2023-11-01T18:30:00Z"
    },
    items: [
      {
        itemName: "Organic Apples",
        quantity: 5,
        pricePerUnit: 1.2,
        totalPrice: 6.0,
        itemType: "Produce",
        taxRate: 0,
        extraCharges: 0,
        taxAmount: 0,
        itemTotalAfterChargesAndTax: 6.0
      },
      {
        itemName: "Packaged Cheese",
        quantity: 2,
        pricePerUnit: 4.5,
        totalPrice: 9.0,
        itemType: "Packaged",
        taxRate: 5,
        extraCharges: 0.5,
        taxAmount: 0.45,
        itemTotalAfterChargesAndTax: 9.95
      }
    ],
    subtotalBeforeChargesAndTaxes: 15.0,
    totalExtraChargesDistributed: 0.5,
    taxOnProduce: 0,
    taxOnPackaged: 0.45,
    grandTotal: 16.0,
    paymentDetails: {
      paymentMethod: "Credit Card"
    }
  };
