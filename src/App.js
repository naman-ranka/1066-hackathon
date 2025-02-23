// src/App.js
import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BillDetails from './components/BillDetails';
import ItemsSection from './components/ItemsSection';
import ParticipantsSection from './components/ParticipantsSection';
import SettlementSection from './components/SettlementSection';

function App() {
  // Bill Details states
  const [billName, setBillName] = useState('');
  const [amount, setAmount] = useState('');
  const [billDate, setBillDate] = useState('');
  const [location, setLocation] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  // -------------------------------------------
  // 1) Global array of “selected participants”
  // -------------------------------------------
  const [billParticipants, setBillParticipants] = useState([]); 
  // e.g. ["Participant 1", "Participant 2"] or [] if none are selected

  // Items
  const [items, setItems] = useState([
    { id: 1, name: 'bread', qty: 1, price: 10, tax: 8.1 },
    { id: 2, name: 'milk',  qty: 1, price: 6,  tax: 1.8 },
  ]);

  // Participants Section
  const [participants, setParticipants] = useState([
    { id: 1, name: 'Participant 1', amountPaid: 1, amountOwed: 10.85 },
    { id: 2, name: 'Participant 2', amountPaid: 0, amountOwed: 8.96 },
    { id: 3, name: 'Participant 3', amountPaid: 0, amountOwed: 6.85 },
  ]);

  // Handlers
  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now(),
      name: '',
      qty: 1,
      price: 0,
      tax: 0
    }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, {
      id: Date.now(),
      name: '',
      amountPaid: 0,
      amountOwed: 0
    }]);
  };

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleRecalculate = () => {
    console.log('Recalculating amounts...');
  };

  // ---------------------------------------------------
  // 2) Callback BillDetails will use to update selection
  // ---------------------------------------------------
  const handleBillParticipantsChange = (selectedNames) => {
    // Example: selectedNames = ["Participant 1", "Participant 2"]
    setBillParticipants(selectedNames);
  };

  return (
    <div className="appContainer">
      <Sidebar />

      <div className="mainContent">
        <Header title="IT'S WISER THAN SPLITWISE" />

        {/* Bill Details */}
        <BillDetails
          billName={billName}
          setBillName={setBillName}
          amount={amount}
          setAmount={setAmount}
          billDate={billDate}
          setBillDate={setBillDate}
          location={location}
          setLocation={setLocation}
          paidBy={paidBy}
          setPaidBy={setPaidBy}
          notes={notes}
          setNotes={setNotes}
          receiptFile={receiptFile}
          setReceiptFile={setReceiptFile}
          participants={participants} 
          
          // Pass the global "selected participants" and the callback:
          billParticipants={billParticipants}
          onBillParticipantsChange={handleBillParticipantsChange}
        />

        {/* Items Section */}
        <ItemsSection
          items={items}
          setItems={setItems}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          // Provide the global selected participants
          billParticipants={billParticipants}
        />

        {/* Participants Section */}
        <ParticipantsSection
          participants={participants}
          setParticipants={setParticipants}
          handleAddParticipant={handleAddParticipant}
          handleRemoveParticipant={handleRemoveParticipant}
          handleRecalculate={handleRecalculate}
        />

        <SettlementSection />
      </div>
    </div>
  );
}

export default App;
