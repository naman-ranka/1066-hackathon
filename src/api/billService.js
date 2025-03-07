// src/api/billService.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
const DEFAULT_GROUP_ID = 1; // Fixed group ID

/**
 * Save a bill to the backend (Django)
 * @param {Object} billInfo - { billName, totalAmount, billDate, location, notes }
 * @param {Array} items - array of item objects
 * @param {Array} participants - array of participant objects
 * @returns {Promise<Object>} - the created or updated Bill from Django
 */
export async function saveBill(billInfo, items, participants) {
  try {
    // Transform data into proper format
    const payload = transformToBackendFormat(billInfo, items, participants);

    // Debugging log
    console.log("Final JSON Payload:", JSON.stringify(payload, null, 2));

    // Send as raw object (Axios will handle JSON conversion)
    const response = await axios.post(`${API_URL}/new/save-bill/`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error in saveBill:", error);
    throw error;
  }
}

/**
 * Fetch participants from the default group
 * @returns {Promise<Array>} - Array of participants
 */
export async function fetchGroupParticipants() {
  try {
    // Use fixed group ID
    const response = await axios.get(`${API_URL}/new/groups/${DEFAULT_GROUP_ID}/participants/`);
    
    // Extract participants from the response structure
    if (response.data && response.data.success && Array.isArray(response.data.participants)) {
      // Map to a more convenient format for our frontend
      return response.data.participants.map(participant => ({
        id: participant.id,
        name: `${participant.first_name} ${participant.last_name}`,
        username: participant.username,
        email: participant.email,
        phone: participant.phone_number,
      }));
    } else {
      console.warn('Unexpected response structure from participants API:', response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching participants:", error);
    return []; // Return empty array on error
  }
}

/**
 * Transforms frontend data model into the format expected by the new backend API
 */
function transformToBackendFormat(billInfo, items, participants) {
  // 1. Transform billInfo to bill object
  const bill = {
    title: billInfo.billName || "Untitled Bill",
    description: billInfo.notes || "",
    date: billInfo.billDate instanceof Date 
      ? billInfo.billDate.toISOString().split('T')[0] 
      : String(billInfo.billDate).split('T')[0]
  };
  
  // Add location as part of description if provided
  if (billInfo.location) {
    bill.description = `${bill.description}${bill.description ? '. ' : ''}Location: ${billInfo.location}`;
  }
  
  // 2. Extract person IDs for persons array
  const persons = participants.map(p => p.id);
  
  // 3. Transform items with quantity and tax rate applied
  const transformedItems = items.map(item => {
    // Calculate the actual price including quantity
    const basePrice = item.price * item.quantity;
    // Apply tax if applicable
    const totalPrice = basePrice * (1 + item.taxRate / 100);
    
    // Create name that includes quantity if > 1
    let displayName = item.name;
    if (item.quantity > 1) {
      displayName = `${displayName} (Qty: ${item.quantity})`;
    }
    if (item.taxRate > 0) {
      displayName = `${displayName}${item.quantity > 1 ? ', ' : ' '}(Tax: ${item.taxRate}%)`;
    }
    
    // Transform splits based on splitType
    const shares = [];
    
    switch(item.splitType) {
      case 'equal':
        // For equal split, add all included participants
        (item.includedParticipants || []).forEach(personId => {
          shares.push({
            person_id: personId,
            split_type: "EQUAL"
          });
        });
        break;
        
      case 'unequal-money':
        // For exact amounts
        Object.entries(item.splits || {}).forEach(([personId, amount]) => {
          if (parseFloat(amount) > 0) {
            shares.push({
              person_id: parseInt(personId),
              split_type: "EXACT",
              exact_amount: parseFloat(amount)
            });
          }
        });
        break;
        
      case 'unequal-percent':
        // For percentages
        Object.entries(item.splits || {}).forEach(([personId, percentage]) => {
          if (parseFloat(percentage) > 0) {
            shares.push({
              person_id: parseInt(personId),
              split_type: "PERCENTAGE",
              percentage: parseFloat(percentage)
            });
          }
        });
        break;
        
      case 'unequal-shares':
        // For share units
        Object.entries(item.splits || {}).forEach(([personId, shareUnits]) => {
          if (parseFloat(shareUnits) > 0) {
            shares.push({
              person_id: parseInt(personId),
              split_type: "SHARES",
              share_units: parseFloat(shareUnits)
            });
          }
        });
        break;
        
      default:
        console.warn(`Unsupported split type: ${item.splitType}`);
    }
    
    return {
      name: displayName,
      price: parseFloat(totalPrice.toFixed(2)),
      shares
    };
  });
  
  // 4. Transform payers info
  const bill_paid_by = (billInfo.payers || []).map(payer => ({
    person_id: payer.participantId,
    amount: parseFloat(payer.amount)
  }));
  
  // 5. Transform participant shares
  const bill_participants_share = participants.map(participant => ({
    person_id: participant.id,
    owed_amount: parseFloat(participant.amountOwed.toFixed(2))
  }));
  
  // Complete payload
  return {
    bill,
    bill_total: parseFloat(billInfo.totalAmount.toFixed(2)),
    group_id: DEFAULT_GROUP_ID, // Use fixed group ID
    persons,
    items: transformedItems,
    bill_paid_by,
    bill_participants_share
  };
}
