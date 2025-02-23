// src/api/billService.js
import axios from "axios";

/**
 * Save a bill to the backend (Django)
 * @param {Object} billInfo - { billName, totalAmount, billDate, location, notes }
 * @param {Array} items - array of item objects
 * @param {Array} participants - array of participant objects
 * @returns {Promise<Object>} - the created or updated Bill from Django
 */
export async function saveBill(billInfo, items, participants) {
  // 1. Prepare the JSON payload
  const payload = {
    name: billInfo.billName,
    date: billInfo.billDate.toISOString().slice(0, 10),
    location: billInfo.location,
    notes: billInfo.notes,
    total_amount: billInfo.totalAmount,
    participants: participants.map((p) => ({
      name: p.name,
      amount_paid: p.amountPaid,
      amount_owed: p.amountOwed,
    })),
    items: items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      tax_rate: i.taxRate,
      split_type: i.splitType,
      // Possibly other fields
    })),
  };

  // 2. Make the POST request to Django
  const response = await axios.post("http://localhost:8000/api/bills/", payload);
  return response.data; // the newly created Bill object
}
