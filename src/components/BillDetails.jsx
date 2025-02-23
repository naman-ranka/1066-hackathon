import React from "react";
import { Box, Typography, TextField, Button, Grid } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BillDetails({ billInfo, setBillInfo, onUploadReceipt }) {
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

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        1. Bill Details
      </Typography>
      <TextField
        label="Bill Name / Title"
        name="billName"
        value={billInfo.billName}
        onChange={handleChange}
        placeholder="e.g., Dinner at Joe’s"
        fullWidth
        margin="dense"
      />

      <TextField
        label="Total Amount (auto or override)"
        type="number"
        name="totalAmount"
        value={billInfo.totalAmount}
        onChange={handleChange}
        fullWidth
        margin="dense"
      />

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
    </Box>
  );
}
