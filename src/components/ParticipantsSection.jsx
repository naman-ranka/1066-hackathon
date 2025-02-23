// src/components/ParticipantsSection.jsx
import React from 'react';
import '../App.css'; // or './ParticipantsSection.css'

function ParticipantsSection({
  participants,
  setParticipants,
  handleAddParticipant,
  handleRemoveParticipant,
  handleRecalculate
}) {
  const handlePaidChange = (id, value) => {
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, amountPaid: parseFloat(value) || 0 } : p
      )
    );
  };

  const handleNameChange = (id, value) => {
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, name: value } : p
      )
    );
  };

  return (
    <section className="sectionContainer">
      <h2>3. Participants</h2>
      <button onClick={handleAddParticipant} className="addButton">
        ADD PARTICIPANT
      </button>

      <table className="participantsTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Amount Paid</th>
            <th>Amount Owed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => handleNameChange(p.id, e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.amountPaid}
                  onChange={(e) => handlePaidChange(p.id, e.target.value)}
                />
              </td>
              <td>${p.amountOwed.toFixed(2)}</td>
              <td>
                <button
                  onClick={() => handleRemoveParticipant(p.id)}
                  className="removeButton"
                >
                  REMOVE
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleRecalculate} className="recalculateButton">
        RECALCULATE AMOUNT OWED
      </button>
    </section>
  );
}

export default ParticipantsSection;
