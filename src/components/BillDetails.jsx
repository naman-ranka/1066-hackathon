import React from "react";
import { Box, Typography, TextField, Grid } from "@mui/material";
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
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        1. Bill Details
      </Typography>

      <Box sx={{ my: 2 }}>
        <TextField
          label="Bill Name / Title"
          name="billName"
          value={billInfo.billName}
          onChange={handleChange}
          placeholder="e.g., Dinner at Joe's"
          fullWidth
          margin="dense"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Total Amount"
            type="number"
            name="totalAmount"
            value={billInfo.totalAmount}
            onChange={handleChange}
            fullWidth
            margin="dense"
            variant="outlined"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Bill Date
          </Typography>
          <DatePicker
            selected={billInfo.billDate}
            onChange={handleDateChange}
            className="form-control"
            wrapperClassName="datePicker"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Location / Restaurant"
            name="location"
            value={billInfo.location}
            onChange={handleChange}
            placeholder="e.g., Joe's Diner"
            fullWidth
            margin="dense"
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
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
          variant="outlined"
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Upload Receipt (OCR)
        </Typography>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadReceipt(e.target.files[0]);
            }
          }}
          style={{ width: '100%' }}
        />
      </Box>
    </Box>
  );
}
