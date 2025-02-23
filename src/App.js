import React, { useState, useEffect } from "react";
import "./styles.css";
import { saveBill } from "./api/billService";
import { loadBillFromJson } from "./utils/billLoader";
import { processReceiptImage } from "./utils/imageProcessor";

// Subcomponents
import BillDetails from "./components/BillDetails";
import ItemsSection from "./components/ItemsSection";
import ParticipantsSection from "./components/ParticipantsSection";
import SettlementSection from "./components/SettlementSection";

// MUI imports
import { Container, Typography, Paper, Box, Button } from "@mui/material";

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

  const handleSave = async () => {
    try {
      const result = await saveBill(billInfo, items, participants);
      alert("Bill saved successfully!");
      console.log("Saved bill:", result);
    } catch (error) {
      console.error("Error saving bill:", error);
      alert("Error saving bill: " + (error.message || "Unknown error"));
    }
  };

  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const parsedData = loadBillFromJson(jsonData);
          
          if (parsedData.isValid) {
            setBillInfo(parsedData.billInfo);
            setItems(parsedData.items);
            setParticipants(parsedData.participants);
          } else {
            alert("Error loading JSON: " + parsedData.error);
          }
        } catch (error) {
          alert("Invalid JSON file: " + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReceiptUpload = async (file) => {
    try {
      // Process the image and get JSON response
      const jsonData = await processReceiptImage(file);
      
      // Use existing billLoader to parse the data
      const parsedData = loadBillFromJson(jsonData);
      
      if (parsedData.isValid) {
        setBillInfo(parsedData.billInfo);
        setItems(parsedData.items);
        setParticipants(parsedData.participants);
      } else {
        alert("Error processing receipt: " + parsedData.error);
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Error processing receipt: " + (error.message || "Unknown error"));
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Bill Splitting Application
        </Typography>
        <Box>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="json-file-input"
            type="file"
            onChange={handleJsonUpload}
          />
          <label htmlFor="json-file-input">
            <Button 
              variant="outlined" 
              component="span"
              sx={{ mr: 2 }}
            >
              Load from JSON
            </Button>
          </label>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            sx={{ minWidth: 100 }}
          >
            Save Bill
          </Button>
        </Box>
      </Box>

      <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <BillDetails
          billInfo={billInfo}
          setBillInfo={setBillInfo}
          onUploadReceipt={handleReceiptUpload}
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
