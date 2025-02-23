// src/components/BillDetails.jsx
import React, { useState } from 'react';
import '../App.css';

function BillDetails({
  billName, setBillName,
  amount, setAmount,
  billDate, setBillDate,
  location, setLocation,
  paidBy, setPaidBy,
  notes, setNotes,
  receiptFile, setReceiptFile,
  participants, // your existing participants array, e.g. from ParticipantsSection
  billParticipants, // the currently selected participants from App
  onBillParticipantsChange
}) {
  // We'll track local checkboxes for "Add Participants"
  // If you already have a custom multi-select, adapt the logic accordingly.
  // For demonstration, let's assume you have participants with IDs 1..N.
  // We'll map them to "Participant 1", "Participant 2", etc.

  // We can store them as strings for convenience:
  const allNames = ['Participant 1', 'Participant 2', 'Participant 3'];

  // If you want your 6 fixed names, just do:
  // const allNames = ["naman", "charu", "gaurav", "chetan", "parchi", "Mayank"];

  // Local state mirrors the parent's billParticipants
  const [localSelected, setLocalSelected] = useState(billParticipants || []);

  // Toggling a name
  const handleToggleName = (name) => {
    let updated;
    if (localSelected.includes(name)) {
      updated = localSelected.filter((n) => n !== name);
    } else {
      updated = [...localSelected, name];
    }
    setLocalSelected(updated);
    // Also tell parent
    onBillParticipantsChange(updated);
  };

  return (
    <section className="sectionContainer">
      <h2>1. Bill Details</h2>
      <div className="billDetailsCard">
        {/* Bill Name */}
        <div className="inputRow">
          <label>Bill Name / Title</label>
          <input
            type="text"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
          />
        </div>

        {/* Total Amount */}
        <div className="inputRow">
          <label>Total Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Bill Date */}
        <div className="inputRow">
          <label>Bill Date</label>
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="inputRow">
          <label>Location / Restaurant</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Paid By (existing logic) */}
        <div className="inputRow">
          <label>Paid By</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            <option value="">Select One</option>
            {participants.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Add Participants (simple checkboxes) */}
        <div className="inputRow">
          <label>Add Participants</label>
          <div>
            {allNames.map((name) => (
              <label key={name} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={localSelected.includes(name)}
                  onChange={() => handleToggleName(name)}
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="inputRow">
          <label>Notes / Comments</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Upload Receipt */}
        <div className="inputRow">
          <label>Upload Receipt (OCR)</label>
          <input
            type="file"
            onChange={(e) => setReceiptFile(e.target.files[0])}
          />
        </div>
      </div>
    </section>
  );
}

export default BillDetails;
