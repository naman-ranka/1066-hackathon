// ParticipantsSection.jsx
import React from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  CircularProgress,
  Alert
} from "@mui/material";

export default function ParticipantsSection({
  participants,
  setParticipants,
  billInfo,
  loadingParticipants = false
}) {
  // Helper function to get amount paid by a participant
  const getAmountPaid = (participantId) => {
    if (!billInfo?.payers) return 0;
    const payer = billInfo.payers.find(p => p.participantId === participantId);
    return payer ? payer.amount : 0;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bill Participants
      </Typography>

      {loadingParticipants ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : participants.length > 0 ? (
        <Table sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Amount Paid</TableCell>
              <TableCell>Amount Owed</TableCell>
              <TableCell>Net Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {participants.map((p) => {
              const amountPaid = getAmountPaid(p.id);
              const netBalance = amountPaid - p.amountOwed;
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.email || '-'}</TableCell>
                  <TableCell>${amountPaid.toFixed(2)}</TableCell>
                  <TableCell>${p.amountOwed.toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography
                      color={netBalance > 0 ? "success.main" : netBalance < 0 ? "error.main" : "text.primary"}
                    >
                      ${netBalance.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Alert severity="info" sx={{ my: 2 }}>
          No participants available. Please make sure your group is set up correctly.
        </Alert>
      )}
    </Box>
  );
}
