import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Grid,
  Avatar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  useTheme,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  Stack,
} from "@mui/material";
import { 
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  QrCode2 as QrCode2Icon,
  FileCopy as FileCopyIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
} from "@mui/icons-material";

// QR Code library - normally we would install this with npm, here just defining a placeholder
// In a real app, you would install qrcode.react: npm install qrcode.react
// and then import { QRCodeSVG } from 'qrcode.react'
const QRCodeSVG = ({ value, size, ...props }) => (
  <div style={{ 
    width: size, 
    height: size, 
    backgroundColor: '#f5f5f5', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ddd'
  }} {...props}>
    <QrCode2Icon style={{ fontSize: size * 0.6 }} />
    <div style={{ 
      position: 'absolute', 
      fontSize: '10px', 
      bottom: 5, 
      color: '#666' 
    }}>
      QR Code Placeholder
    </div>
  </div>
);

export default function SettlementSection({ items, billInfo, billParticipants, settlement }) {
  const theme = useTheme();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('venmo');
  const [paymentDetails, setPaymentDetails] = useState('');
  
  // Helper to get a participant's total contribution
  const getParticipantTotal = (participantId) => {
    const payer = billInfo.payers?.find(p => p.participantId === participantId);
    return payer ? payer.amount : 0;
  };
  
  // Helper to get a color for a participant (deterministic based on name)
  const getParticipantColor = (name) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main, 
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];
    
    // Simple hash function for the name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Open payment dialog for a transaction
  const handleOpenPaymentDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setPaymentDialogOpen(true);
  };

  // Close payment dialog
  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
  };

  // Generate payment link based on selected payment method
  const generatePaymentLink = () => {
    if (!selectedTransaction) return '';

    const amount = selectedTransaction.amount;
    const recipient = selectedTransaction.to;
    const note = `Payment for ${billInfo.billName || 'split bill'}`;
    
    switch(paymentMethod) {
      case 'venmo':
        return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(paymentDetails)}&amount=${amount}&note=${encodeURIComponent(note)}`;
      case 'paypal':
        return `https://www.paypal.com/paypalme/${encodeURIComponent(paymentDetails)}/${amount}`;
      case 'cashapp':
        return `https://cash.app/$${encodeURIComponent(paymentDetails)}/${amount}`;
      case 'upi':
        return `upi://pay?pa=${encodeURIComponent(paymentDetails)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
      default:
        return '';
    }
  };

  // Share payment info
  const handleShare = () => {
    const paymentLink = generatePaymentLink();
    
    if (navigator.share) {
      navigator.share({
        title: `Payment to ${selectedTransaction.to}`,
        text: `Please send $${selectedTransaction.amount} to ${selectedTransaction.to} for ${billInfo.billName || 'split bill'}`,
        url: paymentLink
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert('Copy the payment details and share them manually.');
    }
  };

  // Copy payment details to clipboard
  const handleCopy = () => {
    const textToCopy = `Please send $${selectedTransaction.amount} to ${selectedTransaction.to} (${paymentDetails}) for ${billInfo.billName || 'split bill'}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Payment details copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Generate WhatsApp message
  const generateWhatsAppLink = () => {
    const message = `I'm sending you $${selectedTransaction.amount} for ${billInfo.billName || 'our split bill'}. Payment details: ${paymentDetails}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "0.9rem", mb: 1, fontWeight: 500 }}>
        4. Settlement
      </Typography>

      {settlement.length === 0 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: '1px',
            borderColor: 'grey.400',
            backgroundColor: 'grey.50',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CheckCircleIcon color="success" sx={{ fontSize: '2rem' }} />
          <Typography color="text.secondary" fontWeight="medium">
            All settled! No transactions needed.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            {settlement.map((txn, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Card 
                  variant="outlined"
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getParticipantColor(txn.from),
                            width: 40,
                            height: 40
                          }}
                        >
                          {getInitials(txn.from)}
                        </Avatar>
                        
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {txn.from}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pays
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Chip 
                          label={`$${txn.amount}`} 
                          color="primary" 
                          size="small"
                          sx={{ fontWeight: 'bold', mb: 0.5 }}
                        />
                        <ArrowForwardIcon color="action" fontSize="small" />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {txn.to}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receives
                          </Typography>
                        </Box>
                        
                        <Avatar 
                          sx={{ 
                            bgcolor: getParticipantColor(txn.to),
                            width: 40,
                            height: 40
                          }}
                        >
                          {getInitials(txn.to)}
                        </Avatar>
                      </Box>
                    </Box>
                    
                    {/* Payment Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<QrCode2Icon />}
                        onClick={() => handleOpenPaymentDialog(txn)}
                      >
                        Generate Payment QR
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Bill Summary */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 1.5, 
          mt: 2, 
          backgroundColor: theme.palette.background.default,
          borderRadius: '8px',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <AccountBalanceIcon color="action" fontSize="small" />
          </Grid>
          
          <Grid item xs>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Bill Summary
            </Typography>
          </Grid>
          
          <Grid item>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ${billInfo.totalAmount.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              Participants:
            </Typography>
          </Grid>
          
          {billParticipants.map((participant) => {
            const amountPaid = getParticipantTotal(participant.id);
            const netBalance = amountPaid - participant.amountOwed;
            const status = netBalance > 0 ? 'creditor' : netBalance < 0 ? 'debtor' : 'settled';
            
            return (
              <Grid item xs={12} key={participant.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '0.75rem',
                        bgcolor: getParticipantColor(participant.name)
                      }}
                    >
                      {getInitials(participant.name)}
                    </Avatar>
                    <Typography variant="body2">{participant.name}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: status === 'creditor' ? 'success.main' : 
                               status === 'debtor' ? 'error.main' : 'text.primary',
                        fontWeight: 500
                      }}
                    >
                      {netBalance > 0 ? '+' : ''}{netBalance.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Payment Details
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 2 }}>
              <Typography variant="h6">
                {selectedTransaction.from} pays {selectedTransaction.to}
              </Typography>
              
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                ${selectedTransaction.amount}
              </Typography>

              <Box sx={{ width: '100%', mt: 1 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="venmo">Venmo</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="cashapp">Cash App</MenuItem>
                    <MenuItem value="upi">UPI (India)</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label={paymentMethod === 'venmo' ? 'Venmo Username' :
                         paymentMethod === 'paypal' ? 'PayPal Username' :
                         paymentMethod === 'cashapp' ? 'Cash App Username' :
                         'UPI ID'}
                  placeholder={paymentMethod === 'venmo' ? '@username' :
                              paymentMethod === 'paypal' ? 'username' :
                              paymentMethod === 'cashapp' ? 'username' :
                              'name@bank'}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  fullWidth
                  sx={{ mb: 3 }}
                />
              </Box>

              {/* QR Code */}
              {paymentDetails && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                  <QRCodeSVG 
                    value={generatePaymentLink()}
                    size={200}
                  />
                </Box>
              )}

              {/* Action Buttons */}
              {paymentDetails && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 2, width: '100%', justifyContent: 'center' }}
                >
                  <Tooltip title="Copy payment details">
                    <Button 
                      variant="outlined" 
                      startIcon={<FileCopyIcon />}
                      onClick={handleCopy}
                    >
                      Copy
                    </Button>
                  </Tooltip>

                  <Tooltip title="Share payment details">
                    <Button 
                      variant="outlined" 
                      startIcon={<ShareIcon />}
                      onClick={handleShare}
                    >
                      Share
                    </Button>
                  </Tooltip>

                  <Tooltip title="Send via WhatsApp">
                    <Button 
                      variant="outlined" 
                      color="success"
                      startIcon={<WhatsAppIcon />}
                      component="a"
                      href={generateWhatsAppLink()}
                      target="_blank"
                    >
                      WhatsApp
                    </Button>
                  </Tooltip>
                </Stack>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                The recipient will need to have the selected payment app installed to process the payment. QR code can be scanned directly from most payment apps.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
