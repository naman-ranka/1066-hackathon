import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// MUI Components
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Paper,
  Grid,
  Divider,
} from "@mui/material";

export default function App() {
  // -------------------
  // State
  // -------------------
  const [billInfo, setBillInfo] = useState({
    billName: "",
    totalAmount: 0,
    participants: [],
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
      splitType: "equal", // "equal" | "unequal"
      splits: {},
    },
  ]);

  const [participants, setParticipants] = useState([]);
  const [settlement, setSettlement] = useState([]);

  // -------------------
  // Effects
  // -------------------
  useEffect(() => {
    recalculateBill();
    // eslint-disable-next-line
  }, [items, participants]);

  // -------------------
  // Calculation Logic
  // -------------------
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
        const share = itemTotal / (updatedParticipants.length || 1);
        updatedParticipants.forEach((p) => {
          p.amountOwed += share;
        });
      } else {
        // "unequal"
        Object.keys(item.splits).forEach((pid) => {
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += parseFloat(item.splits[pid]) || 0;
          }
        });
      }
    });

    // Calculate minimal settlement
    const minimalTxns = calculateSettlement(updatedParticipants);

    // Update state
    setBillInfo((prev) => ({ ...prev, totalAmount: total }));
    setParticipants(updatedParticipants);
    setSettlement(minimalTxns);
  };

  const calculateSettlement = (updatedParticipants) => {
    const balances = updatedParticipants.map((p) => {
      const netBalance = p.amountPaid - p.amountOwed;
      return { ...p, netBalance };
    });

    const debtors = balances
      .filter((p) => p.netBalance < 0)
      .sort((a, b) => a.netBalance - b.netBalance);
    const creditors = balances
      .filter((p) => p.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance);

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

      debtor.netBalance += amount;
      creditor.netBalance -= amount;

      if (Math.abs(debtor.netBalance) < 0.0001) d++;
      if (creditor.netBalance < 0.0001) c++;
    }

    return settlementPlan;
  };

  // -------------------
  // Handlers
  // -------------------
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
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
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
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleItemSplitChange = (itemId, participantId, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            splits: { ...item.splits, [participantId]: value },
          };
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

  const handleUploadReceipt = async (file) => {
    console.log("Uploaded file: ", file);
    // TODO: Integrate OCR
  };

  // -------------------
  // Render
  // -------------------
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bill Splitting Application
      </Typography>

      {/* Bill Section */}
      <Box component={Paper} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Bill Details
        </Typography>

        <Box sx={{ my: 2 }}>
          <TextField
            label="Bill Name / Title"
            name="billName"
            value={billInfo.billName}
            onChange={handleBillInfoChange}
            placeholder="e.g., Dinner at Joe’s"
            fullWidth
            margin="dense"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Total Amount (auto or override)"
              type="number"
              name="totalAmount"
              value={billInfo.totalAmount}
              onChange={handleBillInfoChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Bill Date
            </Typography>
            <DatePicker
              selected={billInfo.billDate}
              onChange={handleDateChange}
              className="MuiDatePicker"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Location / Restaurant"
              name="location"
              value={billInfo.location}
              onChange={handleBillInfoChange}
              placeholder="e.g., Joe’s Diner"
              fullWidth
              margin="dense"
            />
          </Grid>
        </Grid>

        <Box sx={{ my: 2 }}>
          <TextField
            label="Notes / Comments"
            name="notes"
            value={billInfo.notes}
            onChange={handleBillInfoChange}
            placeholder="Any extra transaction details..."
            multiline
            rows={2}
            fullWidth
            margin="dense"
          />
        </Box>

        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle2">Upload Receipt (OCR)</Typography>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadReceipt(e.target.files[0]);
              }
            }}
          />
        </Box>
      </Box>

      {/* Items Section */}
      <Box component={Paper} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          2. Items
        </Typography>

        <Button variant="contained" color="primary" onClick={handleAddItem} sx={{ mb: 2 }}>
          Add New Item
        </Button>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Price/Unit</TableCell>
              <TableCell>Tax %</TableCell>
              <TableCell>Split Type</TableCell>
              <TableCell>Total (auto)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const itemTotal = calculateItemTotal(item).toFixed(2);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <TextField
                      variant="outlined"
                      size="small"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      inputProps={{ min: 1 }}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, "quantity", parseFloat(e.target.value))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(item.id, "price", parseFloat(e.target.value))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small">
                      <InputLabel>Tax</InputLabel>
                      <Select
                        label="Tax"
                        value={item.taxRate}
                        onChange={(e) =>
                          handleItemChange(item.id, "taxRate", parseFloat(e.target.value))
                        }
                      >
                        <MenuItem value={0}>0%</MenuItem>
                        <MenuItem value={5}>5%</MenuItem>
                        <MenuItem value={12}>12%</MenuItem>
                        <MenuItem value={18}>18%</MenuItem>
                      </Select>
                      <FormHelperText>Tax Rate</FormHelperText>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small">
                      <InputLabel>Split Type</InputLabel>
                      <Select
                        label="Split Type"
                        value={item.splitType}
                        onChange={(e) => handleItemChange(item.id, "splitType", e.target.value)}
                      >
                        <MenuItem value="equal">Equal</MenuItem>
                        <MenuItem value="unequal">Unequal</MenuItem>
                      </Select>
                    </FormControl>
                    {item.splitType === "unequal" && (
                      <Box sx={{ mt: 1, p: 1, border: "1px dashed #ccc" }}>
                        {participants.map((p) => (
                          <Box key={p.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Typography variant="body2" sx={{ width: 80, mr: 1 }}>
                              {p.name}
                            </Typography>
                            <TextField
                              type="number"
                              variant="outlined"
                              size="small"
                              value={item.splits[p.id] || ""}
                              onChange={(e) =>
                                handleItemSplitChange(item.id, p.id, e.target.value)
                              }
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography>${itemTotal}</Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* Summary Section */}
      <Box component={Paper} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
          <Typography>Subtotal</Typography>
          <Typography>
            $
            {items
              .reduce((acc, item) => acc + item.price * item.quantity, 0)
              .toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
          <Typography>Tax</Typography>
          <Typography>
            $
            {items
              .reduce(
                (acc, item) => acc + (item.price * item.quantity * item.taxRate) / 100,
                0
              )
              .toFixed(2)}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
          <Typography>Total</Typography>
          <Typography>${billInfo.totalAmount.toFixed(2)}</Typography>
        </Box>
      </Box>

      {/* Participants Section */}
      <Box component={Paper} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          3. Participants
        </Typography>
        <Button variant="contained" onClick={handleAddParticipant} sx={{ mb: 2 }}>
          Add Participant
        </Button>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Amount Paid</TableCell>
              <TableCell>Amount Owed (auto)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <TextField
                    variant="outlined"
                    size="small"
                    value={p.name}
                    onChange={(e) => handleParticipantChange(p.id, "name", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    variant="outlined"
                    size="small"
                    value={p.amountPaid}
                    onChange={(e) =>
                      handleParticipantChange(p.id, "amountPaid", parseFloat(e.target.value))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography>${p.amountOwed.toFixed(2)}</Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleRemoveParticipant(p.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Settlement and Payment Calculations */}
      <Box component={Paper} variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          4. Settlement
        </Typography>
        {settlement.length === 0 ? (
          <Typography>All settled! No transactions needed.</Typography>
        ) : (
          <Box component="ul" sx={{ pl: 4 }}>
            {settlement.map((txn, i) => (
              <li key={i}>
                {txn.from} pays {txn.to} ${txn.amount}
              </li>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}
