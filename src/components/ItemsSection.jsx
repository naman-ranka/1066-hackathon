import React from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";

export default function ItemsSection({ items, setItems, participants }) {
  const calculateItemTotal = (item) => {
    const subtotal = item.price * item.quantity;
    const taxAmount = (subtotal * item.taxRate) / 100;
    return (subtotal + taxAmount).toFixed(2);
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
        includedParticipants: [],
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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

  const handleToggleEqualParticipant = (itemId, participantId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const currentlyIncluded = item.includedParticipants || [];
          let newIncluded;
          if (currentlyIncluded.includes(participantId)) {
            // remove
            newIncluded = currentlyIncluded.filter((id) => id !== participantId);
          } else {
            // add
            newIncluded = [...currentlyIncluded, participantId];
          }
          return { ...item, includedParticipants: newIncluded };
        }
        return item;
      })
    );
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        2. Items
      </Typography>

      <Button variant="contained" onClick={handleAddItem} sx={{ mb: 2 }}>
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
            const itemTotal = calculateItemTotal(item);
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <TextField
                    size="small"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                    placeholder="Description"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
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
                    size="small"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(item.id, "price", parseFloat(e.target.value))
                    }
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={item.taxRate}
                    onChange={(e) =>
                      handleItemChange(item.id, "taxRate", parseFloat(e.target.value))
                    }
                  />
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Split Type</InputLabel>
                    <Select
                      label="Split Type"
                      value={item.splitType}
                      onChange={(e) =>
                        handleItemChange(item.id, "splitType", e.target.value)
                      }
                    >
                      <MenuItem value="equal">Equal</MenuItem>
                      <MenuItem value="unequal-money">Unequal (Money)</MenuItem>
                      <MenuItem value="unequal-percent">Unequal (Percent)</MenuItem>
                      <MenuItem value="unequal-shares">Unequal (Shares)</MenuItem>
                    </Select>
                  </FormControl>

                  {/* For equal splits, choose which participants are included */}
                  {item.splitType === "equal" && (
                    <Box sx={{ mt: 1, p: 1, border: "1px dashed #ccc" }}>
                      <Typography variant="body2">Select participants:</Typography>
                      <FormGroup>
                        {participants.map((p) => {
                          const isChecked =
                            item.includedParticipants?.includes(p.id) || false;
                          return (
                            <FormControlLabel
                              key={p.id}
                              control={
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handleToggleEqualParticipant(item.id, p.id)}
                                />
                              }
                              label={p.name}
                            />
                          );
                        })}
                      </FormGroup>
                    </Box>
                  )}

                  {/* For unequal splits, choose money/percent/shares for each participant */}
                  {["unequal-money", "unequal-percent", "unequal-shares"].includes(
                    item.splitType
                  ) && (
                    <Box sx={{ mt: 1, p: 1, border: "1px dashed #ccc" }}>
                      {participants.map((p) => (
                        <Box
                          key={p.id}
                          sx={{ display: "flex", alignItems: "center", mt: 1 }}
                        >
                          <Typography variant="body2" sx={{ width: 80, mr: 1 }}>
                            {p.name}
                          </Typography>
                          <TextField
                            type="number"
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
                <TableCell>{itemTotal}</TableCell>
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

      {/* Summary within the Items Section (Optional) */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Subtotal: $
          {items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)}
        </Typography>
        <Typography variant="subtitle1">Tax: $
          {items.reduce((acc, i) => acc + (i.price * i.quantity * i.taxRate) / 100, 0).toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
