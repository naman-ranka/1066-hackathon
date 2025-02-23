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
    location: billInfo.location || "",
    notes: billInfo.notes || "",
    total_amount: parseFloat(billInfo.totalAmount),
    participants: participants.map((p) => ({
      name: p.name,
      amount_paid: parseFloat(p.amountPaid || 0),
      amount_owed: parseFloat(p.amountOwed || 0),
    })),
    items: items.map((i) => ({
      name: i.name,
      quantity: parseInt(i.quantity || 1),
      price: parseFloat(i.price || 0),
      tax_rate: parseFloat(i.taxRate || 0),
      split_type: i.splitType || "equal",
      included_participants: i.includedParticipants || [],
      splits: i.splits || {},
    })),
  };

  console.log("Payload to saveBill:", payload);

  // 2. Make the POST request to Django
  const response = await axios.post("http://localhost:8000/api/bills/", payload);
  return response.data;
}
