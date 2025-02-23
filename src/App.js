import React, { useState, useEffect } from "react";
import "./styles.css";

// Subcomponents
import BillDetails from "./components/BillDetails";
import ItemsSection from "./components/ItemsSection";
import ParticipantsSection from "./components/ParticipantsSection";
import SettlementSection from "./components/SettlementSection";

// MUI imports
import { Container, Typography, Paper, Box } from "@mui/material";

// Helper function for minimal settlement
import { calculateSettlement } from "./utils/settlementUtils";

export default function App() {
  // ---------------------------
  // State
  // ---------------------------
  const [billInfo, setBillInfo] = useState({
    billName: "",
    totalAmount: 0,
    billDate: new Date(),
    location: "",
    notes: "",
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      name: "",
      quantity: 1,
      price: 0,
      taxRate: 0,
      splitType: "equal",
      splits: {},
      includedParticipants: [],
    },
  ]);

  const [participants, setParticipants] = useState([]);
  const [settlement, setSettlement] = useState([]);

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    recalculateBill();
    // eslint-disable-next-line
  }, [items, participants]);

  // ---------------------------
  // Calculation
  // ---------------------------
  const calculateItemTotal = (item) => {
    const subtotal = item.price * item.quantity;
    const taxAmount = (subtotal * item.taxRate) / 100;
    return subtotal + taxAmount;
  };

  const recalculateBill = () => {
    let total = 0;
    items.forEach((item) => {
      total += calculateItemTotal(item);
    });

    // Reset each participant’s amountOwed
    const updatedParticipants = participants.map((p) => ({ ...p, amountOwed: 0 }));

    // Distribute costs per item
    items.forEach((item) => {
      const itemTotal = calculateItemTotal(item);

      if (item.splitType === "equal") {
        // Use includedParticipants if set, else all
        const relevantIds = item.includedParticipants?.length
          ? item.includedParticipants
          : updatedParticipants.map((p) => p.id);
        const share = itemTotal / (relevantIds.length || 1);
        updatedParticipants.forEach((p) => {
          if (relevantIds.includes(p.id)) {
            p.amountOwed += share;
          }
        });
      } else if (item.splitType === "unequal-money") {
        // direct amounts in item.splits
        Object.entries(item.splits).forEach(([pid, amt]) => {
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += parseFloat(amt) || 0;
          }
        });
      } else if (item.splitType === "unequal-percent") {
        // percentages in item.splits
        let sumOfPercent = 0;
        Object.values(item.splits).forEach((percent) => {
          sumOfPercent += parseFloat(percent) || 0;
        });
        Object.entries(item.splits).forEach(([pid, percent]) => {
          const fraction = sumOfPercent ? (parseFloat(percent) || 0) / sumOfPercent : 0;
          const amount = itemTotal * fraction;
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += amount;
          }
        });
      } else if (item.splitType === "unequal-shares") {
        // shares in item.splits
        let totalShares = 0;
        Object.values(item.splits).forEach((sh) => {
          totalShares += parseFloat(sh) || 0;
        });
        Object.entries(item.splits).forEach(([pid, shares]) => {
          const fraction = totalShares ? (parseFloat(shares) || 0) / totalShares : 0;
          const amount = itemTotal * fraction;
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += amount;
          }
        });
      }
    });

    // Minimal settlement
    const minimalTxns = calculateSettlement(updatedParticipants);

    setBillInfo((prev) => ({ ...prev, totalAmount: total }));
    setParticipants(updatedParticipants);
    setSettlement(minimalTxns);
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Bill Splitting Application
      </Typography>

      <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <BillDetails
          billInfo={billInfo}
          setBillInfo={setBillInfo}
          onUploadReceipt={(file) => console.log("Uploaded:", file)}
        />
      </Box>

      <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <ItemsSection
          items={items}
          setItems={setItems}
          participants={participants}
        />
      </Box>

      <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <ParticipantsSection
          participants={participants}
          setParticipants={setParticipants}
        />
      </Box>

      <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <SettlementSection
          items={items}
          billInfo={billInfo}
          participants={participants}
          settlement={settlement}
        />
      </Box>
    </Container>
  );
}
