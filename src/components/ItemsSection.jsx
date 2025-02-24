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
  Paper,
  TableContainer,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon
} from "@mui/icons-material";

export default function ItemsSection({ items, setItems, billParticipants }) {
  // --------------------------------------
  // Utility Functions
  // --------------------------------------
  const calculateItemTotal = (item) => {
    const subtotal = item.price * item.quantity;
    const taxAmount = (subtotal * item.taxRate) / 100;
    return (subtotal + taxAmount).toFixed(2);
  };

  // --------------------------------------
  // Event Handlers
  // --------------------------------------
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
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
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
            // Remove participant
            newIncluded = currentlyIncluded.filter((id) => id !== participantId);
          } else {
            // Add participant
            newIncluded = [...currentlyIncluded, participantId];
          }
          return { ...item, includedParticipants: newIncluded };
        }
        return item;
      })
    );
  };

  // --------------------------------------
  // Render
  // --------------------------------------
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "0.9rem", mb: 0.5 }}>
        2. Items
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleAddItem}
          startIcon={<AddIcon sx={{ fontSize: "0.9rem" }} />}
          sx={{ fontSize: "0.8rem", py: 0.5 }}
        >
          Add New Item
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ mb: 0.5 }}>
        <TableContainer>
          <Table
            size="small"
            sx={{
              "& .MuiTableCell-root": {
                padding: "2px 4px",
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              },
              "& .MuiTableBody-root .MuiTableRow-root": {
                height: "32px",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>Item Name</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Price/Unit</TableCell>
                <TableCell>Tax %</TableCell>
                <TableCell>Split</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((item) => {
                const itemTotal = calculateItemTotal(item);

                return (
                  <TableRow
                    key={item.id}
                    sx={{ "&:hover": { backgroundColor: "#f8f9fa" } }}
                  >
                    {/* Item Name */}
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(item.id, "name", e.target.value)
                        }
                        placeholder="Description"
                        sx={{
                          "& .MuiInputBase-input": {
                            fontSize: "0.75rem",
                            padding: "2px 4px",
                            height: "1.2rem",
                          },
                          "& .MuiOutlinedInput-root": {
                            height: "24px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{
                          min: 1,
                          style: {
                            fontSize: "0.75rem",
                            padding: "2px 4px",
                            height: "1.2rem",
                          },
                        }}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            parseFloat(e.target.value)
                          )
                        }
                        sx={{
                          width: "60px",
                          "& .MuiOutlinedInput-root": {
                            height: "24px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "price",
                            parseFloat(e.target.value)
                          )
                        }
                        sx={{
                          width: "80px",
                          "& .MuiInputBase-input": {
                            fontSize: "0.75rem",
                            padding: "2px 4px",
                            height: "1.2rem",
                          },
                          "& .MuiOutlinedInput-root": {
                            height: "24px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Tax Rate */}
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={item.taxRate}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "taxRate",
                            parseFloat(e.target.value)
                          )
                        }
                        sx={{
                          width: "60px",
                          "& .MuiInputBase-input": {
                            fontSize: "0.75rem",
                            padding: "2px 4px",
                            height: "1.2rem",
                          },
                          "& .MuiOutlinedInput-root": {
                            height: "24px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Split UI (inline, always visible) */}
                    <TableCell sx={{ width: "220px", verticalAlign: "top" }}>
                      {/* Split Type Select */}
                      <FormControl
                        size="small"
                        sx={{ width: "120px", mb: 0.5 }}
                      >
                        <InputLabel sx={{ fontSize: "0.75rem" }}>
                          Split
                        </InputLabel>
                        <Select
                          label="Split"
                          value={item.splitType}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "splitType",
                              e.target.value
                            )
                          }
                          sx={{
                            fontSize: "0.75rem",
                            "& .MuiSelect-select": {
                              padding: "2px 4px",
                              height: "1.2rem",
                            },
                            height: "24px",
                          }}
                        >
                          <MenuItem value="equal" sx={{ fontSize: "0.75rem" }}>
                            Equal
                          </MenuItem>
                          <MenuItem
                            value="unequal-money"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            Unequal (₹)
                          </MenuItem>
                          <MenuItem
                            value="unequal-percent"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            Unequal (%)
                          </MenuItem>
                          <MenuItem
                            value="unequal-shares"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            Unequal (Parts)
                          </MenuItem>
                        </Select>
                      </FormControl>

                      {/* Render either checkboxes (equal) or text fields (unequal) */}
                      {item.splitType === "equal" && (
                        <Box
                          sx={{
                            border: "1px dashed #ccc",
                            p: 0.5,
                            mt: 0,
                            maxHeight: "70px",
                            overflowY: "auto",
                          }}
                        >
                          <FormGroup sx={{ flexDirection: "row" }}>
                            {billParticipants.map((p) => {
                              const isChecked =
                                item.includedParticipants?.includes(p.id) ||
                                false;
                              return (
                                <FormControlLabel
                                  key={p.id}
                                  control={
                                    <Checkbox
                                      checked={isChecked}
                                      onChange={() =>
                                        handleToggleEqualParticipant(
                                          item.id,
                                          p.id
                                        )
                                      }
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Typography sx={{ fontSize: "0.7rem" }}>
                                      {p.name}
                                    </Typography>
                                  }
                                  sx={{
                                    "& .MuiFormControlLabel-label": {
                                      lineHeight: 1.1,
                                    },
                                  }}
                                />
                              );
                            })}
                          </FormGroup>
                        </Box>
                      )}

                      {item.splitType !== "equal" && (
                        <Box
                          sx={{
                            border: "1px dashed #ccc",
                            p: 0.5,
                            mt: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            maxHeight: "80px",
                            overflowY: "auto",
                          }}
                        >
                          {billParticipants.map((p) => (
                            <Box
                              key={p.id}
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              <Typography
                                sx={{ width: 60, fontSize: "0.7rem" }}
                              >
                                {p.name}
                              </Typography>
                              <TextField
                                type="number"
                                size="small"
                                value={item.splits[p.id] || ""}
                                onChange={(e) =>
                                  handleItemSplitChange(
                                    item.id,
                                    p.id,
                                    e.target.value
                                  )
                                }
                                sx={{
                                  width: "60px",
                                  ml: 1,
                                  "& .MuiInputBase-input": {
                                    fontSize: "0.7rem",
                                    padding: "2px 4px",
                                    height: "1.2rem",
                                  },
                                  "& .MuiOutlinedInput-root": {
                                    height: "24px",
                                  },
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      )}
                    </TableCell>

                    {/* Total */}
                    <TableCell>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                        ${itemTotal}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Tooltip title="Remove Item">
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                          size="small"
                          sx={{ padding: "2px" }}
                        >
                          <DeleteIcon sx={{ fontSize: "0.9rem" }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary */}
      <Paper variant="outlined" sx={{ p: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: "0.8rem", mb: 0.25 }}>
          Summary
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
          Subtotal: $
          {items
            .reduce((acc, i) => acc + i.price * i.quantity, 0)
            .toFixed(2)}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
          Tax: $
          {items
            .reduce(
              (acc, i) => acc + (i.price * i.quantity * i.taxRate) / 100,
              0
            )
            .toFixed(2)}
        </Typography>
      </Paper>
    </Box>
  );
}
