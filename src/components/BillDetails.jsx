import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BillDetails({
  billInfo,
  setBillInfo,
  onUploadReceipt,
  billParticipants = [],
}) {
  // Local state to open/close the "Who Paid?" dialog
  const [openPayerDialog, setOpenPayerDialog] = useState(false);

  // Local state used ONLY inside the dialog
  // We'll copy from billInfo.payers so user can edit partial amounts
  const [tempPayers, setTempPayers] = useState([]);

  // When the component first mounts or if total changes,
  // ensure we have at least 1 payer if none are set.
  useEffect(() => {
    if (billInfo.payers.length === 0 && billParticipants.length > 0) {
      // Default: first participant pays the entire bill
      setBillInfo((prev) => ({
        ...prev,
        payers: [
          {
            participantId: billParticipants[0].id,
            name: billParticipants[0].name,
            amount: prev.totalAmount || 0,
          },
        ],
      }));
    }
  }, [billInfo.payers, billInfo.totalAmount, billParticipants, setBillInfo]);

  // If totalAmount changes after the user has set a payer,
  // you may want to adjust the amounts. This is optional
  // and depends on your desired logic.
  // e.g., you could re-scale or do nothing. Omitted for brevity.

  const handleChange = (e) => {
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

  // ----------------------------
  // "Who Paid?" Display
  // ----------------------------
  // We'll show something like: "Alice($50), Bob($30)" or "No Payers"
  const payerDisplay = billInfo.payers.length > 0
    ? billInfo.payers
        .map((p) => `${p.name} ($${p.amount})`)
        .join(", ")
    : "No one assigned yet";

  // ----------------------------
  // Dialog Open/Close
  // ----------------------------
  const handleOpenPayerDialog = () => {
    // Clone the array from billInfo.payers
    setTempPayers([...billInfo.payers]);
    setOpenPayerDialog(true);
  };

  const handleClosePayerDialog = () => {
    setOpenPayerDialog(false);
  };

  // ----------------------------
  // Editing partial amounts
  // ----------------------------
  const handleAmountChange = (participantId, newAmount) => {
    setTempPayers((prev) =>
      prev.map((p) =>
        p.participantId === participantId
          ? { ...p, amount: parseFloat(newAmount) || 0 }
          : p
      )
    );
  };

  const handleToggleParticipant = (participant) => {
    setTempPayers((prev) => {
      // If participant is already in the array, remove them
      const existing = prev.find((p) => p.participantId === participant.id);
      if (existing) {
        // remove it
        return prev.filter((p) => p.participantId !== participant.id);
      } else {
        // add new with amount=0 or some default
        return [
          ...prev,
          { participantId: participant.id, name: participant.name, amount: 0 },
        ];
      }
    });
  };

  // ----------------------------
  // Save changes from the dialog
  // ----------------------------
  const handleSavePayers = () => {
    // Optionally, you might want to validate sum of amounts == totalAmount
    // or handle partial sums differently. For now, we just accept it.
    setBillInfo((prev) => ({
      ...prev,
      payers: tempPayers,
    }));
    setOpenPayerDialog(false);
  };

  // Example total of amounts from tempPayers
  const partialSum = tempPayers.reduce((acc, p) => acc + p.amount, 0);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Bill Details
      </Typography>

      {/* Bill Name */}
      <TextField
        label="Bill Name / Title"
        name="billName"
        value={billInfo.billName}
        onChange={handleChange}
        placeholder="e.g., Dinner at Joe’s"
        fullWidth
        margin="dense"
      />

      {/* Total Amount */}
      <TextField
        label="Total Amount (auto or override)"
        type="number"
        name="totalAmount"
        value={billInfo.totalAmount}
        onChange={handleChange}
        fullWidth
        margin="dense"
      />

      {/* Bill Date + Location */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Bill Date
          </Typography>
          <DatePicker
            selected={billInfo.billDate}
            onChange={handleDateChange}
            className="MuiDatePicker"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location / Restaurant"
            name="location"
            value={billInfo.location}
            onChange={handleChange}
            placeholder="e.g., Joe’s Diner"
            fullWidth
            margin="dense"
          />
        </Grid>
      </Grid>

      {/* Notes */}
      <TextField
        label="Notes / Comments"
        name="notes"
        value={billInfo.notes}
        onChange={handleChange}
        placeholder="Any extra transaction details..."
        multiline
        rows={2}
        fullWidth
        margin="dense"
      />

      {/* Who Paid? Display with Edit */}
      <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Who Paid?
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography sx={{ flex: 1 }}>
            {payerDisplay}
          </Typography>
          <IconButton color="primary" onClick={handleOpenPayerDialog}>
            <EditIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Upload Receipt */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Upload Receipt (OCR)</Typography>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadReceipt(e.target.files[0]);
            }
          }}
        />
      </Box>

      {/* Dialog for editing payers */}
      <Dialog open={openPayerDialog} onClose={handleClosePayerDialog} fullWidth maxWidth="sm">
        <DialogTitle>Who Paid?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select which participants paid, and specify how much they contributed.
          </Typography>
          {billParticipants.length === 0 && (
            <Typography color="text.secondary">
              No participants available. Please add participants first.
            </Typography>
          )}
          {billParticipants.map((participant) => {
            // see if they're in tempPayers
            const existing = tempPayers.find((p) => p.participantId === participant.id);
            return (
              <Box key={participant.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Button
                  variant={existing ? "contained" : "outlined"}
                  onClick={() => handleToggleParticipant(participant)}
                  sx={{ mr: 2, minWidth: 80 }}
                >
                  {existing ? "Selected" : "Select"}
                </Button>
                <Typography sx={{ width: 120 }}>{participant.name}</Typography>
                <TextField
                  type="number"
                  size="small"
                  value={existing ? existing.amount : 0}
                  onChange={(e) => handleAmountChange(participant.id, e.target.value)}
                  sx={{ maxWidth: 100 }}
                  disabled={!existing}
                />
              </Box>
            );
          })}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Sum of amounts: ${partialSum.toFixed(2)} 
              {" "} (Bill Total: ${billInfo.totalAmount})
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayerDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSavePayers} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
