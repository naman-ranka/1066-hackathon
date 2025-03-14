import React, { useState, useMemo, useCallback, useRef } from "react";
import debounce from 'lodash/debounce';
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
  Paper,
  TableContainer,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Chip,
  Grid,
  Divider,
  useMediaQuery,
  useTheme,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  ButtonGroup,
  InputLabel,
  FormControl,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  RadioGroup,
  Radio,
  Slider,
  Accordion,
  FormLabel
  

} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  ViewColumn as ViewColumnIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  SelectAll as SelectAllIcon,
  Cached as CachedIcon,
  People as PeopleIcon,
  
} from "@mui/icons-material";



import ItemSplitControl from "./ItemSplitControl";

// Helper functions
const calculateItemTotal = (item) => {
  const subtotal = Number((item.price * item.quantity).toFixed(2));
  const taxAmount = Number(((subtotal * item.taxRate) / 100).toFixed(2));
  return Number((subtotal + taxAmount).toFixed(2));
};

const calculateShares = (item, itemTotal, participants) => {
  if (!participants.length) return {};
  
  switch (item.splitType) {
    case "equal": {
      const relevantIds = item.includedParticipants?.length
        ? item.includedParticipants
        : participants.map(p => p.id);
      const share = itemTotal / (relevantIds.length || 1);
      return Object.fromEntries(
        participants.map(p => [
          p.id,
          relevantIds.includes(p.id) ? Number(share.toFixed(2)) : 0
        ])
      );
    }
    case "unequal-money":
      return Object.fromEntries(
        participants.map(p => [
          p.id,
          Number((item.splits[p.id] || 0).toFixed(2))
        ])
      );
    case "unequal-percent": {
      const totalPercent = Object.values(item.splits).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );
      return Object.fromEntries(
        participants.map(p => [
          p.id,
          totalPercent
            ? Number(((itemTotal * (parseFloat(item.splits[p.id]) || 0)) / totalPercent).toFixed(2))
            : 0
        ])
      );
    }
    case "unequal-shares": {
      const totalShares = Object.values(item.splits).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );
      return Object.fromEntries(
        participants.map(p => [
          p.id,
          totalShares
            ? Number(((itemTotal * (parseFloat(item.splits[p.id]) || 0)) / totalShares).toFixed(2))
            : 0
        ])
      );
    }
    default:
      return {};
  }
};

// Memoized individual item component
const BillItem = React.memo(({ 
  item, 
  onItemChange, 
  onItemDelete, 
  participants,
  index 
}) => {
  // Memoize split calculations
  const splitDetails = useMemo(() => {
    const itemTotal = calculateItemTotal(item);
    return {
      total: itemTotal,
      shares: calculateShares(item, itemTotal, participants)
    };
  }, [item, participants]);

  
});



export default function ItemsSection({ items, setItems, participants }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");

  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [taxCalculationMethod, setTaxCalculationMethod] = useState("basedOnRate"); 
  // "basedOnRate" = user provides a tax rate (%) for each item
  // "basedOnFinalTotal" = user provides the final bill total (incl. tax)
  //    from which we derive each item's taxRate proportionally

  const [taxInput, setTaxInput] = useState("");

  // Debounced setItems function
  const debouncedSetItems = useRef(
    debounce((newItems) => {
      setItems(newItems);
    }, 300)
  ).current;

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      debouncedSetItems.cancel();
    };
  }, [debouncedSetItems]);

  // --------------------------------------
  // Memoized Calculations
  // --------------------------------------
  const itemTotals = useMemo(() => {
    return items.reduce((acc, item) => {
      const subtotal = item.price;
      const taxAmount = (subtotal * item.taxRate) / 100;
      acc[item.id] = (subtotal + taxAmount).toFixed(2);
      return acc;
    }, {});
  }, [items]);

  const billCalculations = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + i.price, 0);
    const tax = items.reduce((acc, i) => acc + (i.price * i.taxRate) / 100, 0);
    const total = subtotal + tax;
    
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    };
  }, [items]);

  // --------------------------------------
  // Memoized Event Handlers
  // --------------------------------------
  const handleAddItem = useCallback(() => {
    const newItem = {
      id: Date.now(),
      name: "",
      quantity: 1,
      price: 0,
      taxRate: 0,
      splitType: "equal",
      splits: {},
      includedParticipants: participants.map(p => p.id),
    };
    
    setItems((prev) => [...prev, newItem]);
    
    if (viewMode === "card") {
      setExpandedItemId(newItem.id);
    }
  }, [participants, viewMode, setItems]);

  const handleRemoveItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [setItems]);

  const handleItemChange = useCallback((id, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, [setItems]);

  const handleItemSplitChange = useCallback((itemId, participantId, value) => {
    debouncedSetItems((prev) =>
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
  }, [debouncedSetItems]);

  const handleToggleEqualParticipant = useCallback((itemId, participantId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const currentlyIncluded = item.includedParticipants || [];
          const newIncluded = currentlyIncluded.includes(participantId)
            ? currentlyIncluded.filter((id) => id !== participantId)
            : [...currentlyIncluded, participantId];
          return { ...item, includedParticipants: newIncluded };
        }
        return item;
      })
    );
  }, [setItems]);

  const handleSplitTypeChange = useCallback((itemId, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            splitType: value,
            splits: {},
            includedParticipants: value === "equal" ? participants.map(p => p.id) : []
          };
        }
        return item;
      })
    );
  }, [participants]);

  const toggleExpandItem = useCallback((itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  }, [expandedItemId]);

  // --------------------------------------
  // Memoized Quick Action Handlers
  // --------------------------------------
  const quickActionHandlers = useMemo(() => ({
    markAllEqual: (item) => {
      setItems((prev) =>
        prev.map((i) => 
          i.id === item.id 
            ? { ...i, splitType: "equal", includedParticipants: participants.map((p) => p.id) }
            : i
        )
      );
    },
    excludeAllFromItem: (item) => {
      setItems((prev) =>
        prev.map((i) => 
          i.id === item.id 
            ? { ...i, includedParticipants: [] }
            : i
        )
      );
    },
    splitEvenlyInMoney: (item) => {
      const itemTotal = parseFloat(itemTotals[item.id]);
      const perPersonAmount = participants.length > 0 
        ? (itemTotal / participants.length).toFixed(2) 
        : "0.00";
      
      setItems((prev) =>
        prev.map((i) => 
          i.id === item.id 
            ? { 
                ...i, 
                splitType: "unequal-money",
                splits: Object.fromEntries(participants.map(p => [p.id, perPersonAmount]))
              }
            : i
        )
      );
    }
  }), [participants, setItems, itemTotals]);


  const handleApplyTax = useCallback(() => {
    const inputValue = parseFloat(taxInput) || 0;
  
    if (taxCalculationMethod === "basedOnRate") {
      // If user provides a direct tax rate (%) for all items
      setItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          taxRate: inputValue,
        }))
      );
    } else if (taxCalculationMethod === "basedOnFinalTotal") {
      // If user provides the *final* total (subtotal + tax)
      const currentSubTotal = items.reduce((acc, i) => acc + i.price, 0);
      if (inputValue <= currentSubTotal) {
        // If the final total is less or equal to subtotal, set taxRate = 0
        setItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            taxRate: 0,
          }))
        );
      } else {
        // Distribute the difference (taxOverSubtotal) proportionally
        const taxOverSubtotal = inputValue - currentSubTotal;
        setItems((prevItems) => {
          return prevItems.map((item) => {
            if (!currentSubTotal) {
              return { ...item, taxRate: 0 };
            }
            const itemTaxAmount =
              (item.price / currentSubTotal) * taxOverSubtotal;
            const newRate = (itemTaxAmount / item.price) * 100;
            return { ...item, taxRate: parseFloat(newRate.toFixed(2)) };
          });
        });
      }
    } else if (taxCalculationMethod === "basedOnTaxAmount") {
      // If user provides a total tax amount in dollars (e.g., $50)
      const currentSubTotal = items.reduce((acc, i) => acc + i.price, 0);
      if (!currentSubTotal || inputValue <= 0) {
        // If no subtotal or invalid tax, set all taxRate=0
        setItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            taxRate: 0,
          }))
        );
      } else {
        // Distribute the specified tax across items proportionally
        setItems((prevItems) =>
          prevItems.map((item) => {
            const itemTaxAmount =
              (item.price / currentSubTotal) * inputValue;
            const newRate = (itemTaxAmount / item.price) * 100;
            return { ...item, taxRate: parseFloat(newRate.toFixed(2)) };
          })
        );
      }
    }
  
    // Close the dialog at the end
    setTaxDialogOpen(false);
  }, [taxCalculationMethod, taxInput, items, setItems]);
  

  // --------------------------------------
  // Memoized Render Components
  // --------------------------------------
  const renderQuickActionButtons = useCallback((item) => {
    if (item.splitType === "equal") {
      return (
        <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { minWidth: '28px', px: 0.5 } }}>
          <Tooltip title="Select All">
            <Button onClick={() => quickActionHandlers.markAllEqual(item)}>
              <SelectAllIcon sx={{ fontSize: "0.7rem" }} />
            </Button>
          </Tooltip>
          <Tooltip title="Exclude All">
            <Button onClick={() => quickActionHandlers.excludeAllFromItem(item)}>
              <PersonRemoveIcon sx={{ fontSize: "0.7rem" }} />
            </Button>
          </Tooltip>
        </ButtonGroup>
      );
    } else if (item.splitType === "unequal-money") {
      return (
        <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { minWidth: '28px', px: 0.5 } }}>
          <Tooltip title="Split Evenly">
            <Button onClick={() => quickActionHandlers.splitEvenlyInMoney(item)}>
              <MonetizationOnIcon sx={{ fontSize: "0.7rem" }} />
            </Button>
          </Tooltip>
          <Tooltip title="First Person Pays">
            <Button onClick={() => {
              const totalAmount = parseFloat(itemTotals[item.id]);
              const newSplits = {};
              participants.forEach((p, index) => {
                newSplits[p.id] = index === 0 ? totalAmount.toFixed(2) : "0.00";
              });
              setItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, splits: newSplits } : i
              ));
            }}>
              1P
            </Button>
          </Tooltip>
          <Tooltip title="Clear All">
            <Button onClick={() => {
              const newSplits = {};
              participants.forEach(p => {
                newSplits[p.id] = "";
              });
              setItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, splits: newSplits } : i
              ));
            }}>
              0
            </Button>
          </Tooltip>
        </ButtonGroup>
      );
    } else if (item.splitType === "unequal-percent") {
      return (
        <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { minWidth: '28px', px: 0.5 } }}>
          <Tooltip title="Split Evenly">
            <Button onClick={() => quickActionHandlers.splitEvenlyInMoney(item)}>
              %
            </Button>
          </Tooltip>
          <Tooltip title="100% First Person">
            <Button onClick={() => {
              const newSplits = {};
              participants.forEach((p, index) => {
                newSplits[p.id] = index === 0 ? "100" : "0";
              });
              setItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, splits: newSplits } : i
              ));
            }}>
              1P
            </Button>
          </Tooltip>
          <Tooltip title="Clear All">
            <Button onClick={() => {
              const newSplits = {};
              participants.forEach(p => {
                newSplits[p.id] = "";
              });
              setItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, splits: newSplits } : i
              ));
            }}>
              0
            </Button>
          </Tooltip>
        </ButtonGroup>
      );
    } else if (item.splitType === "unequal-shares") {
      return (
        <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { minWidth: '28px', px: 0.5 } }}>
          <Tooltip title="Split Evenly">
            <Button onClick={() => quickActionHandlers.splitEvenlyInMoney(item)}>
              <PeopleIcon sx={{ fontSize: "0.7rem" }} />
            </Button>
          </Tooltip>
          <Tooltip title="First Person Only">
            <Button onClick={() => {
              const newSplits = {};
              participants.forEach((p, index) => {
                newSplits[p.id] = index === 0 ? "1" : "0";
              });
              setItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, splits: newSplits } : i
              ));
            }}>
              1P
            </Button>
          </Tooltip>
          <Tooltip title="Clear All">
            <Button onClick={() => {
              const newSplits = {};
              participants.forEach(p => {
                newSplits[p.id] = "";
              });
              setItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, splits: newSplits } : i
              ));
            }}>
              0
            </Button>
          </Tooltip>
        </ButtonGroup>
      );
    }
    return null;
  }, [participants, quickActionHandlers, itemTotals, setItems]);

  const renderSplitTypeButtons = useCallback((item) => {
    return (
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Equal Split">
          <Button
            onClick={() => handleSplitTypeChange(item.id, "equal")}
            variant={item.splitType === "equal" ? "contained" : "outlined"}
            sx={{ minWidth: '32px', px: 0.5 }}
          >
            <SelectAllIcon sx={{ fontSize: "0.7rem" }} />
          </Button>
        </Tooltip>
        <Tooltip title="Split by Amount">
          <Button
            onClick={() => handleSplitTypeChange(item.id, "unequal-money")}
            variant={item.splitType === "unequal-money" ? "contained" : "outlined"}
            sx={{ minWidth: '32px', px: 0.5 }}
          >
            <MonetizationOnIcon sx={{ fontSize: "0.7rem" }} />
          </Button>
        </Tooltip>
        <Tooltip title="Split by Percentage">
          <Button
            onClick={() => handleSplitTypeChange(item.id, "unequal-percent")}
            variant={item.splitType === "unequal-percent" ? "contained" : "outlined"}
            sx={{ minWidth: '32px', px: 0.5 }}
          >
            %
          </Button>
        </Tooltip>
        <Tooltip title="Split by Parts">
          <Button
            onClick={() => handleSplitTypeChange(item.id, "unequal-shares")}
            variant={item.splitType === "unequal-shares" ? "contained" : "outlined"}
            sx={{ minWidth: '32px', px: 0.5 }}
          >
            <PeopleIcon sx={{ fontSize: "0.7rem" }} />
          </Button>
        </Tooltip>
      </ButtonGroup>
    );
  }, []);

  const renderMatrixCell = useCallback((item, participant) => {
    if (item.splitType === "equal") {
      const isIncluded = (item.includedParticipants || []).includes(participant.id);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Checkbox 
            checked={isIncluded}
            onChange={() => handleToggleEqualParticipant(item.id, participant.id)}
            size="small"
            sx={{ padding: '4px' }}
          />
        </Box>
      );
    } else {
      return (
        <TextField
          type="number"
          size="small"
          value={item.splits[participant.id] || ""}
          onChange={(e) => handleItemSplitChange(item.id, participant.id, e.target.value)}
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
          InputProps={{
            endAdornment: item.splitType === "unequal-percent" ? 
              <InputAdornment position="end" sx={{ fontSize: "0.7rem" }}>%</InputAdornment> : null
          }}
        />
      );
    }
  }, [handleToggleEqualParticipant, handleItemSplitChange]);

  // Memoize the matrix view header cells
  const participantHeaderCells = useMemo(() => (
    participants.map((participant) => (
      <TableCell key={participant.id} align="center">
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
          {participant.name}
        </Typography>
      </TableCell>
    ))
  ), [participants]);

  // Memoize the bill summary component
  const BillSummary = useMemo(() => (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 1.5, 
        mt: 2, 
        backgroundColor: theme.palette.background.default,
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
      }}
    >
      <Typography variant="subtitle2" sx={{ fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
        Bill Summary
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: "0.75rem", color: 'text.secondary' }}>
              Subtotal:
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
              ${billCalculations.subtotal}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: "0.75rem", color: 'text.secondary' }}>
              Tax:
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
              ${billCalculations.tax}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Total:
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: 'primary.main' }}>
              ${billCalculations.total}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  ), [theme, billCalculations]);

  // Update the matrix view to include the new buttons
  const renderMatrixView = () => {
    if (items.length === 0) {
      return (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: '1px',
            borderColor: 'grey.400',
            backgroundColor: 'grey.50' 
          }}
        >
          <Typography color="text.secondary" sx={{ mb: 2 }}>No items added yet</Typography>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleAddItem}
            startIcon={<AddIcon />}
          >
            Add First Item
          </Button>
        </Paper>
      );
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddItem}
            startIcon={<AddIcon sx={{ fontSize: "0.9rem" }} />}
            sx={{ fontSize: "0.8rem", py: 0.5, mr: 1 }}
          >
            Add New Item
          </Button>
          
          {/* Quick Actions for all items */}
          {items.length > 0 && (
            <Tooltip title="Quick Split Options">
              <ButtonGroup size="small" variant="outlined" sx={{ ml: 'auto' }}>
                <Tooltip title="Mark all items as equal split">
                  <Button 
                    size="small" 
                    onClick={() => {
                      setItems(prev => prev.map(item => ({
                        ...item,
                        splitType: "equal",
                        includedParticipants: participants.map(p => p.id)
                      })));
                    }}
                    sx={{ px: 1 }}
                  >
                    <SelectAllIcon sx={{ fontSize: "0.9rem" }} />
                  </Button>
                </Tooltip>
                <Tooltip title="Reset all items to equal split">
                  <Button 
                    size="small" 
                    onClick={() => {
                      setItems(prev => prev.map(item => ({
                        ...item,
                        splitType: "equal",
                        includedParticipants: [],
                        splits: {}
                      })));
                    }}
                    sx={{ px: 1 }}
                  >
                    <CachedIcon sx={{ fontSize: "0.9rem" }} />
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Tooltip>
          )}
        </Box>
        
        <Paper variant="outlined">
          <TableContainer>
            <Table
              size="small"
              sx={{
                "& .MuiTableCell-root": {
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ minWidth: '140px' }}>Item</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Split</TableCell>
                  {participantHeaderCells}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item) => {
                  return (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:hover": { backgroundColor: "#f8f9fa" },
                      }}
                    >
                      {/* Item Name */}
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                          placeholder="Item description"
                          sx={{
                            width: '100%',
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

                      {/* Item Amount */}
                      <TableCell>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                          ${itemTotals[item.id]}
                        </Typography>
                      </TableCell>

                      {/* Split Type */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 0.5 }}>
                          {renderSplitTypeButtons(item)}
                          {renderQuickActionButtons(item)}
                        </Box>
                      </TableCell>

                      {/* Participant Cells */}
                      {participants.map((participant) => (
                        <TableCell key={participant.id} align="center">
                          {renderMatrixCell(item, participant)}
                        </TableCell>
                      ))}

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
      </Box>
    );
  };

  // --------------------------------------
  // Card View Render
  // --------------------------------------
  const renderCardView = () => {
    return (
      <Box sx={{ mt: 1 }}>
        {items.length === 0 ? (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderStyle: 'dashed',
              borderWidth: '1px',
              borderColor: 'grey.400',
              backgroundColor: 'grey.50' 
            }}
          >
            <Typography color="text.secondary" sx={{ mb: 2 }}>No items added yet</Typography>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleAddItem}
              startIcon={<AddIcon />}
            >
              Add First Item
            </Button>
          </Paper>
        ) : (
          items.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const itemTotal = itemTotals[item.id];
            
            return (
              <Card 
                key={item.id} 
                variant="outlined" 
                sx={{ 
                  mb: 1.5,
                  borderColor: isExpanded ? 'primary.main' : 'inherit',
                  transition: 'all 0.2s',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 1,
                  }
                }}
              >
                <CardContent sx={{ pb: 0, pt: 1.5 }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs>
                      {isExpanded ? (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                          variant="standard"
                        />
                      ) : (
                        <Typography 
                          variant="subtitle1" 
                          sx={{ fontWeight: 500 }}
                          noWrap
                        >
                          {item.name || "Unnamed item"}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item>
                      <Chip
                        icon={<MonetizationOnIcon sx={{ fontSize: '0.8rem !important' }} />}
                        label={`$${itemTotal}`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </Grid>
                    
                    <Grid item>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleExpandItem(item.id)}
                        color={isExpanded ? "primary" : "default"}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Grid>
                  </Grid>
                  
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Price"
                            type="number"
                            size="small"
                            fullWidth
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={6} md={4}>
                          <TextField
                            label="Quantity (for reference)"
                            type="number"
                            size="small"
                            fullWidth
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 1, step: "1" }}
                          />
                        </Grid>
                        
                        <Grid item xs={6} md={4}>
                          <TextField
                            label="Tax %"
                            type="number"
                            size="small"
                            fullWidth
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(item.id, "taxRate", parseFloat(e.target.value) || 0)}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                          />
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Split Options
                        </Typography>
                        
                        <ItemSplitControl
                          item={item}
                          participants={participants}
                          onSplitTypeChange={(value) => handleSplitTypeChange(item.id, value)}
                          onToggleEqualParticipant={(participantId) => handleToggleEqualParticipant(item.id, participantId)}
                          onItemSplitChange={(participantId, value) => handleItemSplitChange(item.id, participantId, value)}
                        />
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
                
                {isExpanded && (
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </CardActions>
                )}
              </Card>
            );
          })
        )}
        
        {items.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              onClick={handleAddItem}
              startIcon={<AddIcon />}
            >
              Add Item
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  // --------------------------------------
  // Table View Render
  // --------------------------------------
  const renderTableView = () => {
    return (
      <>
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
                  <TableCell>Price</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Tax %</TableCell>
                  <TableCell>Split</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item) => {
                  const itemTotal = itemTotals[item.id];

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
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
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

                      {/* Split Control */}
                      <TableCell sx={{ width: "120px" }}>
                        <ItemSplitControl
                          item={item}
                          participants={participants}
                          onSplitTypeChange={(value) => handleSplitTypeChange(item.id, value)}
                          onToggleEqualParticipant={(participantId) => 
                            handleToggleEqualParticipant(item.id, participantId)}
                          onItemSplitChange={(participantId, value) => 
                            handleItemSplitChange(item.id, participantId, value)}
                          compact={true}
                        />
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
      </>
    );
  };

  // --------------------------------------
  // Main Render
  // --------------------------------------
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "0.9rem", mb: 0, fontWeight: 500 }}>
          2. Items
        </Typography>
        
        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(e, newView) => {
            if (newView !== null) {
              setViewMode(newView);
            }
          }}
          aria-label="view mode"
        >
          <ToggleButton value="card" aria-label="card view" sx={{ padding: '4px' }}>
            <Tooltip title="Card View">
              <GridViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table" aria-label="table view" sx={{ padding: '4px' }}>
            <Tooltip title="Table View">
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="matrix" aria-label="matrix view" sx={{ padding: '4px' }}>
            <Tooltip title="Split Matrix View">
              <ViewColumnIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Button
        variant="contained"
        size="small"
        onClick={() => setTaxDialogOpen(true)}
        sx={{ mt: 1 }}
      >
        Open Tax Calculation
      </Button>

      <Dialog open={taxDialogOpen} onClose={() => setTaxDialogOpen(false)}>
        <DialogTitle>Tax Calculation</DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ fontSize: "0.85rem" }}>
              Calculation Method
            </FormLabel>
            <RadioGroup
              row
              value={taxCalculationMethod}
              onChange={(e) => setTaxCalculationMethod(e.target.value)}
            >
              <FormControlLabel
                value="basedOnRate"
                control={<Radio size="small" />}
                label="Based on Tax Rate (%)"
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="basedOnFinalTotal"
                control={<Radio size="small" />}
                label="Based on Final Total"
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="basedOnTaxAmount"
                control={<Radio size="small" />}
                label="Based on Tax Amount ($)"
              />
            </RadioGroup>
          </FormControl>

          {taxCalculationMethod === "basedOnRate" && (
            <TextField
              label="Tax Rate (%)"
              type="number"
              size="small"
              fullWidth
              value={taxInput}
              onChange={(e) => setTaxInput(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          )}

          {taxCalculationMethod === "basedOnFinalTotal" && (
            <TextField
              label="Final Bill Total (incl. tax)"
              type="number"
              size="small"
              fullWidth
              value={taxInput}
              onChange={(e) => setTaxInput(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          )}

          {taxCalculationMethod === "basedOnTaxAmount" && (
            <TextField
              label="Total Tax Amount"
              type="number"
              size="small"
              fullWidth
              value={taxInput}
              onChange={(e) => setTaxInput(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyTax}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>


      {/* Render either table, card, or matrix view based on viewMode */}
      {viewMode === 'table' ? renderTableView() : 
       viewMode === 'card' ? renderCardView() : renderMatrixView()}

      {/* Bill Summary */}
      {BillSummary}
    </Box>
  );
}
