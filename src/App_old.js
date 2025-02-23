import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";

/**
 * Main Application Component
 */
export default function App() {
  const [billInfo, setBillInfo] = useState({
    billName: "",
    totalAmount: 0,
    participants: [],
    billDate: new Date(),
    location: "",
    notes: "",
  });

  // Items data structure
  const [items, setItems] = useState([
    {
      id: Date.now(),
      name: "",
      quantity: 1,
      price: 0,
      taxRate: 0,
      splitType: "equal", // "equal" | "unequal"
      splits: {}, // For "unequal" splits, store user => custom amount
    },
  ]);

  // Participants data structure
  const [participants, setParticipants] = useState([
    // Example: { id: 1, name: "Alice", amountPaid: 0, amountOwed: 0 }
  ]);

  // Settlement instructions (e.g. "Alice pays Bob $10")
  const [settlement, setSettlement] = useState([]);

  /**
   * Whenever `items` or `participants` changes, recalculate:
   * - item totals
   * - each participant's owed amount
   * - minimal settlement
   */
  useEffect(() => {
    recalculateBill();
  }, [items, participants]);

  // ----- Utility / Calculation Functions -----

  // Calculate the total for a single item
  const calculateItemTotal = (item) => {
    const subtotal = item.price * item.quantity;
    const taxAmount = (subtotal * item.taxRate) / 100;
    return subtotal + taxAmount;
  };

  // Recalculate all amounts whenever data changes
  const recalculateBill = () => {
    // 1. Calculate total bill from items
    let total = 0;
    let subtotal = 0;
    let tax = 0;
    items.forEach((item) => {
      subtotal += item.price * item.quantity;
      tax += (item.price * item.quantity * item.taxRate) / 100;
      total += calculateItemTotal(item);
    });

    // 2. Assign each participant an "owed" amount based on item splits
    const updatedParticipants = participants.map((p) => {
      return { ...p, amountOwed: 0 };
    });

    items.forEach((item) => {
      const itemTotal = calculateItemTotal(item);

      if (item.splitType === "equal") {
        // Even split among all participants
        const share = itemTotal / updatedParticipants.length || 0;
        updatedParticipants.forEach((p) => {
          p.amountOwed += share;
        });
      } else if (item.splitType === "unequal") {
        // Summation of explicit splits
        // item.splits might look like { [participantId]: amount, [participantId2]: amount2, ... }
        Object.keys(item.splits).forEach((pid) => {
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += parseFloat(item.splits[pid]) || 0;
          }
        });
      }
    });

    // 3. Calculate minimal settlement
    const minimalTxns = calculateSettlement(updatedParticipants);

    // 4. Update state
    setBillInfo((prev) => ({
      ...prev,
      totalAmount: total, // can be overridden manually if needed
    }));
    setParticipants(updatedParticipants);
    setSettlement(minimalTxns);
  };

  /**
   * Minimal Settlement Calculation
   *  - Creates a list of "X pays Y amount" transactions
   *    based on net balances (paid - owed).
   */
  const calculateSettlement = (updatedParticipants) => {
    // netBalance = amountPaid - amountOwed
    const balances = updatedParticipants.map((p) => {
      const netBalance = p.amountPaid - p.amountOwed;
      return { ...p, netBalance };
    });

    const debtors = balances.filter((p) => p.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);
    const creditors = balances.filter((p) => p.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);

    const settlementPlan = [];

    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const amount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);

      settlementPlan.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount.toFixed(2),
      });

      // Update netBalances
      debtor.netBalance += amount;
      creditor.netBalance -= amount;

      if (Math.abs(debtor.netBalance) < 0.0001) d++;
      if (creditor.netBalance < 0.0001) c++;
    }

    return settlementPlan;
  };

  // ----- Event Handlers -----

  const handleBillInfoChange = (e) => {
    const { name, value } = e.target;
    setBillInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setBillInfo((prev) => ({
      ...prev,
      billDate: date,
    }));
  };

  const handleAddParticipant = () => {
    setParticipants((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Participant ${prev.length + 1}`,
        amountPaid: 0,
        amountOwed: 0,
      },
    ]);
  };

  const handleParticipantChange = (id, field, value) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        quantity: 1,
        price: 0,
        taxRate: 0,
        splitType: "equal",
        splits: {},
      },
    ]);
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleItemSplitChange = (itemId, participantId, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newSplits = {
            ...item.splits,
            [participantId]: value,
          };
          return { ...item, splits: newSplits };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveParticipant = (id) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // ----- OCR / Receipt Upload (Pseudo-Implementation) -----
  // In a real app, you'd integrate with Tesseract.js or Google Vision.
  const handleUploadReceipt = async (file) => {
    // Example placeholder for OCR logic
    console.log("Uploaded file: ", file);
    // 1. Upload file to OCR service
    // 2. Parse extracted data
    // 3. Populate items, total, or other fields automatically
  };

  // ----- Render -----
  return (
    <div className="container">
      <h1>Bill Splitting Application</h1>

      {/* Bill Section */}
      <section className="section">
        <h2>1. Bill Details</h2>
        <div className="form-row">
          <label>Bill Name / Title</label>
          <input
            name="billName"
            value={billInfo.billName}
            onChange={handleBillInfoChange}
            placeholder="e.g., Dinner at Joe’s"
          />
        </div>

        <div className="form-row">
          <label>Total Amount (auto-calculated or override)</label>
          <input
            type="number"
            name="totalAmount"
            value={billInfo.totalAmount}
            onChange={handleBillInfoChange}
          />
        </div>

        <div className="form-row">
          <label>Bill Date</label>
          <DatePicker selected={billInfo.billDate} onChange={handleDateChange} />
        </div>

        <div className="form-row">
          <label>Location / Restaurant</label>
          <input
            name="location"
            value={billInfo.location}
            onChange={handleBillInfoChange}
            placeholder="e.g., Joe’s Diner"
          />
        </div>

        <div className="form-row">
          <label>Notes / Comments</label>
          <textarea
            name="notes"
            value={billInfo.notes}
            onChange={handleBillInfoChange}
            placeholder="Any extra transaction details..."
          />
        </div>

        <div className="form-row">
          <label>Upload Receipt (OCR)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadReceipt(e.target.files[0]);
              }
            }}
          />
        </div>
      </section>

      {/* Items Section */}
      <section className="section">
        <h2>2. Items</h2>

        <button onClick={handleAddItem}>Add New Item</button>
        <table className="items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Price/Unit</th>
              <th>Tax %</th>
              <th>Split Type</th>
              <th>Total (auto)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemTotal = calculateItemTotal(item).toFixed(2);
              return (
                <tr key={item.id}>
                  <td>
                    <input
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(item.id, "name", e.target.value)
                      }
                      placeholder="Description"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, "quantity", parseFloat(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(item.id, "price", parseFloat(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={item.taxRate}
                      onChange={(e) =>
                        handleItemChange(item.id, "taxRate", parseFloat(e.target.value))
                      }
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={item.splitType}
                      onChange={(e) =>
                        handleItemChange(item.id, "splitType", e.target.value)
                      }
                    >
                      <option value="equal">Equal</option>
                      <option value="unequal">Unequal</option>
                    </select>
                    {item.splitType === "unequal" && (
                      <div className="unequal-splits">
                        {participants.map((p) => (
                          <div key={p.id} className="unequal-split-row">
                            <label>{p.name}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.splits[p.id] || ""}
                              onChange={(e) =>
                                handleItemSplitChange(item.id, p.id, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{itemTotal}</td>
                  <td>
                    <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Summary Section */}
      <section className="section">
        <h2>Summary</h2>
        <div className="summary-row">
          <label>Subtotal:</label>
          <span>{items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <label>Tax:</label>
          <span>{items.reduce((acc, item) => acc + (item.price * item.quantity * item.taxRate) / 100, 0).toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <label>Total:</label>
          <span>{billInfo.totalAmount.toFixed(2)}</span>
        </div>
      </section>

      {/* Participants Section */}
      <section className="section">
        <h2>3. Participants</h2>

        <button onClick={handleAddParticipant}>Add Participant</button>
        <table className="participants-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount Paid</th>
              <th>Amount Owed (auto)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    value={p.name}
                    onChange={(e) => handleParticipantChange(p.id, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={p.amountPaid}
                    onChange={(e) =>
                      handleParticipantChange(p.id, "amountPaid", parseFloat(e.target.value))
                    }
                  />
                </td>
                <td>{p.amountOwed.toFixed(2)}</td>
                <td>
                  <button onClick={() => handleRemoveParticipant(p.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Settlement and Payment Calculations */}
      <section className="section">
        <h2>4. Settlement</h2>
        {settlement.length === 0 ? (
          <p>All settled! No transactions needed.</p>
        ) : (
          <ul>
            {settlement.map((txn, i) => (
              <li key={i}>
                {txn.from} pays {txn.to} ${txn.amount}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
