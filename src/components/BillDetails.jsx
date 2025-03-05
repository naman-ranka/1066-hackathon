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
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EnhancedReceiptUpload from "./EnhancedReceiptUpload";
import {
  Share as ShareIcon,
  SaveAlt as SaveAltIcon,
  FileCopy as FileCopyIcon,
  PictureAsPdf as PdfIcon,
  Description as JsonIcon,
  InsertDriveFile as CsvIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

// Remove the datepicker CSS import which might be causing issues
// import "react-datepicker/dist/react-datepicker.css";

export default function BillDetails({
  billInfo,
  setBillInfo,
  onUploadReceipt,
  billParticipants = [],
  items = [],
  settlement = [],
}) {
  // Local state to open/close the "Who Paid?" dialog
  const [openPayerDialog, setOpenPayerDialog] = useState(false);

  // Local state used ONLY inside the dialog
  const [tempPayers, setTempPayers] = useState([]);
  
  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    // Handle date from input type date
    setBillInfo((prev) => ({
      ...prev,
      billDate: e.target.value,
    }));
  };

  // Format date for the date input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d instanceof Date && !isNaN(d) 
      ? d.toISOString().split('T')[0] 
      : '';
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

  // ----------------------------
  // Enhanced Receipt Upload
  // ----------------------------
  const handleProcessComplete = (data) => {
    // Process the data returned from the EnhancedReceiptUpload component
    console.log("Receipt processing complete:", data);
    
    // Use the existing onUploadReceipt function
    // This assumes the backend returns data in a format compatible with the existing flow
    onUploadReceipt(data);
  };

  // ----------------------------
  // Export Functions
  // ----------------------------
  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleCopyToClipboard = () => {
    // Create a text summary of the bill
    const summary = generateBillSummary('text');
    navigator.clipboard.writeText(summary)
      .then(() => {
        showSnackbar('Bill summary copied to clipboard!', 'success');
        handleExportClose();
      })
      .catch(err => {
        showSnackbar('Failed to copy to clipboard', 'error');
        console.error('Could not copy text: ', err);
      });
  };

  const handleExportJSON = () => {
    const jsonData = generateBillSummary('json');
    downloadFile(
      jsonData, 
      `${billInfo.billName || 'split-bill'}-${new Date().toISOString().split('T')[0]}.json`, 
      'application/json'
    );
    showSnackbar('Bill exported as JSON file', 'success');
    handleExportClose();
  };

  const handleExportCSV = () => {
    const csvData = generateBillSummary('csv');
    downloadFile(
      csvData, 
      `${billInfo.billName || 'split-bill'}-${new Date().toISOString().split('T')[0]}.csv`, 
      'text/csv'
    );
    showSnackbar('Bill exported as CSV file', 'success');
    handleExportClose();
  };

  const handleExportPDF = () => {
    // In a real application, this would generate a PDF
    // For this example, we'll just show a message that it's not implemented
    showSnackbar('PDF export would be implemented in production version', 'info');
    handleExportClose();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const downloadFile = (content, fileName, contentType) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const generateBillSummary = (format) => {
    switch (format) {
      case 'json':
        return JSON.stringify({
          billInfo,
          items,
          billParticipants,
          settlement
        }, null, 2);
      
      case 'csv':
        // Create CSV for items
        let csvContent = 'Bill Name,Date,Location,Total Amount\n';
        csvContent += `"${billInfo.billName || ''}","${billInfo.billDate ? new Date(billInfo.billDate).toLocaleDateString() : ''}","${billInfo.location || ''}",${billInfo.totalAmount || 0}\n\n`;
        
        // Items section
        csvContent += 'Items:\n';
        csvContent += 'Name,Quantity,Price,Tax Rate,Total\n';
        items.forEach(item => {
          const itemTotal = item.price * item.quantity * (1 + item.taxRate/100);
          csvContent += `"${item.name}",${item.quantity},${item.price},${item.taxRate},${itemTotal.toFixed(2)}\n`;
        });
        
        // Participants section
        csvContent += '\nParticipants:\n';
        csvContent += 'Name,Paid,Owed,Balance\n';
        billParticipants.forEach(p => {
          const payer = billInfo.payers.find(payer => payer.participantId === p.id);
          const amountPaid = payer ? payer.amount : 0;
          const balance = amountPaid - p.amountOwed;
          csvContent += `"${p.name}",${amountPaid},${p.amountOwed},${balance.toFixed(2)}\n`;
        });
        
        // Settlement section
        csvContent += '\nSettlement:\n';
        csvContent += 'From,To,Amount\n';
        settlement.forEach(s => {
          csvContent += `"${s.from}","${s.to}",${s.amount}\n`;
        });
        
        return csvContent;
      
      case 'text':
      default:
        let textSummary = `${billInfo.billName || 'Bill'}\n`;
        textSummary += `Date: ${billInfo.billDate ? new Date(billInfo.billDate).toLocaleDateString() : 'N/A'}\n`;
        textSummary += `Location: ${billInfo.location || 'N/A'}\n`;
        textSummary += `Total Amount: $${billInfo.totalAmount}\n\n`;
        
        textSummary += `Items:\n`;
        items.forEach(item => {
          const itemTotal = item.price * item.quantity * (1 + item.taxRate/100);
          textSummary += `- ${item.name}: $${itemTotal.toFixed(2)} (${item.quantity} x $${item.price} + ${item.taxRate}% tax)\n`;
        });
        
        textSummary += `\nParticipants:\n`;
        billParticipants.forEach(p => {
          const payer = billInfo.payers.find(payer => payer.participantId === p.id);
          const amountPaid = payer ? payer.amount : 0;
          const balance = amountPaid - p.amountOwed;
          textSummary += `- ${p.name}: Paid $${amountPaid}, Owes $${p.amountOwed}, Balance: $${balance.toFixed(2)}\n`;
        });
        
        if (settlement.length > 0) {
          textSummary += `\nSettlement:\n`;
          settlement.forEach(s => {
            textSummary += `- ${s.from} pays ${s.to} $${s.amount}\n`;
          });
        } else {
          textSummary += `\nAll settled! No transactions needed.\n`;
        }
        
        return textSummary;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "0.9rem", mb: 0, fontWeight: 500 }}>
          1. Bill Details
        </Typography>
        
        <Tooltip title="Export or Share Bill">
          <IconButton color="primary" onClick={handleExportClick}>
            <ShareIcon />
          </IconButton>
        </Tooltip>

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={handleCopyToClipboard}>
            <ListItemIcon>
              <FileCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Summary</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportJSON}>
            <ListItemIcon>
              <JsonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export as JSON</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportCSV}>
            <ListItemIcon>
              <CsvIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export as CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportPDF}>
            <ListItemIcon>
              <PdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export as PDF</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Bill Name */}
      <TextField
        label="Bill Name / Title"
        name="billName"
        value={billInfo.billName}
        onChange={handleChange}
        placeholder="e.g., Dinner at Joe's"
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
          <TextField
            label="Bill Date"
            type="date"
            name="billDate"
            value={formatDateForInput(billInfo.billDate)}
            onChange={handleDateChange}
            fullWidth
            margin="dense"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location / Restaurant"
            name="location"
            value={billInfo.location}
            onChange={handleChange}
            placeholder="e.g., Joe's Diner"
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

      {/* Upload Receipt Section */}
      <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Upload Receipt
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload a receipt image to automatically extract bill details.
            </Typography>
          </Grid>
          
          {/* Simple Upload (Original method) */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Simple Upload (Single Image):
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadReceipt(e.target.files[0]);
                  }
                }}
                style={{ marginBottom: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Advanced Upload with OCR+LLM:
              </Typography>
              <EnhancedReceiptUpload onProcessComplete={handleProcessComplete} />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              * Use Enhanced Upload for multiple images or advanced processing options.
            </Typography>
          </Grid>
        </Grid>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
