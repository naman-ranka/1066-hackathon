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
  participants,         // existing participants array from parent
  setParticipants,      // function to update participants from parent
  billParticipants,     // the currently selected participants from App
  onBillParticipantsChange
}) {
  // --------------------------------------------------
  // Local state for multi-select dropdown + modals
  // --------------------------------------------------
  const [localSelected, setLocalSelected] = useState(billParticipants || []);

  // For toggling dropdown open/close
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // For "Add New Participant" modal
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');

  // For "Add New Group" modal
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupParticipants, setSelectedGroupParticipants] = useState([]);

  // Keep track of created groups in local state
  // Each group: { groupName: 'Group1', members: ['Participant 1', 'Participant 2'] }
  const [groups, setGroups] = useState([]);

  // --------------------------------------------------
  // 1) Helper: combined list of participant names + group names
  // --------------------------------------------------
  const participantNames = participants.map((p) => p.name);
  const groupNames = groups.map((g) => g.groupName);

  // This is what's displayed in the dropdown (excluding the special "Add" items)
  const allOptions = [...participantNames, ...groupNames];

  // Utility to check if a name is actually a group
  const isGroup = (name) => groupNames.includes(name);

  // --------------------------------------------------
  // 2) Toggling an item in the multi-select
  // --------------------------------------------------
  const handleToggleItem = (name) => {
    if (isGroup(name)) {
      // If user clicked on a group, toggle all members
      handleToggleGroup(name);
    } else {
      // Otherwise, toggle a single participant
      let updated;
      if (localSelected.includes(name)) {
        updated = localSelected.filter((n) => n !== name);
      } else {
        updated = [...localSelected, name];
      }
      setLocalSelected(updated);
      onBillParticipantsChange(updated);
    }
  };

  // Toggling a group means add or remove all of its members
  const handleToggleGroup = (groupName) => {
    const group = groups.find((g) => g.groupName === groupName);
    if (!group) return;

    const { members } = group;

    // Check if *all* members of this group are already selected
    const allMembersSelected = members.every((m) => localSelected.includes(m));

    let updated = [...localSelected];

    if (allMembersSelected) {
      // If all members are currently selected, unselect them
      updated = updated.filter((item) => !members.includes(item));
    } else {
      // Otherwise, add any that are not already selected
      members.forEach((m) => {
        if (!updated.includes(m)) {
          updated.push(m);
        }
      });
    }

    setLocalSelected(updated);
    onBillParticipantsChange(updated);
  };

  // --------------------------------------------------
  // 3) "Add New Participant" logic
  // --------------------------------------------------
  const openAddParticipantModal = () => {
    setNewParticipantName('');
    setIsAddParticipantModalOpen(true);
  };
  const closeAddParticipantModal = () => {
    setIsAddParticipantModalOpen(false);
  };
  const handleSaveNewParticipant = () => {
    if (!newParticipantName.trim()) return;

    // Update parent's participants array
    const newId = Date.now();
    setParticipants((prev) => [
      ...prev,
      { id: newId, name: newParticipantName, amountPaid: 0, amountOwed: 0 },
    ]);

    // Also auto-select this new participant in BillDetails
    const updated = [...localSelected, newParticipantName];
    setLocalSelected(updated);
    onBillParticipantsChange(updated);

    closeAddParticipantModal();
  };

  // --------------------------------------------------
  // 4) "Add New Group" logic
  // --------------------------------------------------
  const openAddGroupModal = () => {
    setNewGroupName('');
    setSelectedGroupParticipants([]);
    setIsAddGroupModalOpen(true);
  };
  const closeAddGroupModal = () => {
    setIsAddGroupModalOpen(false);
  };
  const handleToggleGroupParticipant = (partName) => {
    if (selectedGroupParticipants.includes(partName)) {
      setSelectedGroupParticipants((prev) =>
        prev.filter((p) => p !== partName)
      );
    } else {
      setSelectedGroupParticipants((prev) => [...prev, partName]);
    }
  };
  const handleSaveNewGroup = () => {
    if (!newGroupName.trim() || selectedGroupParticipants.length === 0) return;

    // Create the new group
    const newGroup = {
      groupName: newGroupName,
      members: selectedGroupParticipants,
    };

    setGroups((prev) => [...prev, newGroup]);

    // Optionally, auto-select all members of this group upon creation
    let updated = [...localSelected];
    selectedGroupParticipants.forEach((m) => {
      if (!updated.includes(m)) {
        updated.push(m);
      }
    });

    setLocalSelected(updated);
    onBillParticipantsChange(updated);

    closeAddGroupModal();
  };

  // --------------------------------------------------
  // 5) Render
  // --------------------------------------------------
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

        {/* Paid By */}
        <div className="inputRow">
          <label>Paid By</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="">Select One</option>
            {participants.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* --- Add Participants (Multi-Select Dropdown) --- */}
        <div className="inputRow">
          <label>Add Participants</label>
          <div className="multiSelectContainer">
            {/* Header that shows how many selected / or lists them */}
            <div
              className="multiSelectHeader"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {localSelected.length === 0
                ? 'No participants selected'
                : localSelected.join(', ')}
            </div>

            {isDropdownOpen && (
              <div className="multiSelectDropdown">
                {allOptions.map((option) => (
                  <div
                    key={option}
                    className="multiSelectOption"
                    onClick={() => handleToggleItem(option)}
                  >
                    <input
                      type="checkbox"
                      checked={option && localSelected.includes(option)}
                      readOnly
                    />
                    <span style={{ marginLeft: '0.5rem' }}>{option}</span>
                  </div>
                ))}

                {/* Special items */}
                <div
                  className="specialOption"
                  onClick={openAddParticipantModal}
                >
                  + Add New Participant
                </div>
                <div className="specialOption" onClick={openAddGroupModal}>
                  + Add New Group
                </div>
              </div>
            )}
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

      {/* Modals */}
      {/* Add New Participant Modal */}
      {isAddParticipantModalOpen && (
        <div className="modalBackdrop">
          <div className="modalContent">
            <h3>Add New Participant</h3>
            <input
              type="text"
              placeholder="Participant Name"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
            />
            <div className="modalButtons">
              <button onClick={closeAddParticipantModal}>Cancel</button>
              <button onClick={handleSaveNewParticipant}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Group Modal */}
      {isAddGroupModalOpen && (
        <div className="modalBackdrop">
          <div className="modalContent">
            <h3>Add New Group</h3>
            <input
              type="text"
              placeholder="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            />

            <div className="groupSelectionList">
              {participantNames.map((pname) => (
                <label key={pname} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={selectedGroupParticipants.includes(pname)}
                    onChange={() => handleToggleGroupParticipant(pname)}
                  />
                  <span style={{ marginLeft: '0.5rem' }}>{pname}</span>
                </label>
              ))}
            </div>

            <div className="modalButtons">
              <button onClick={closeAddGroupModal}>Cancel</button>
              <button onClick={handleSaveNewGroup}>Add Group</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BillDetails;
