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
} from "@mui/material";

export default function ParticipantsSection({
  allParticipants,
  billParticipants,
  setBillParticipants,
  billInfo, // Add billInfo prop to access payers
}) {
  // Add participant to the "billParticipants" array
  const handleAddToBill = (participant) => {
    // if participant is not already in the bill
    if (!billParticipants.some((p) => p.id === participant.id)) {
      setBillParticipants((prev) => [
        ...prev,
        {
          // name, etc. from backend
          ...participant,
          amountOwed: 0, // Only initialize amountOwed, amountPaid comes from billInfo.payers
        },
      ]);
    }
  };

  const handleRemoveFromBill = (id) => {
    setBillParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // Helper function to get amount paid by a participant
  const getAmountPaid = (participantId) => {
    if (!billInfo?.payers) return 0;
    const payer = billInfo.payers.find(p => p.participantId === participantId);
    return payer ? payer.amount : 0;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Participants (Fetched from Backend)
      </Typography>

      {/* 1) Show all participants from the backend */}
      <Typography variant="body2" color="text.secondary">
        Select from available participants:
      </Typography>
      <Table sx={{ mt: 1, mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email (if you have that)</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allParticipants.map((participant) => (
            <TableRow key={participant.id}>
              <TableCell>{participant.name}</TableCell>
              <TableCell>{participant.email}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAddToBill(participant)}
                >
                  Add to Bill
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 2) Show the participants currently in this bill */}
      <Typography variant="h6" gutterBottom>
        Bill Participants
      </Typography>
      {billParticipants.length === 0 ? (
        <Typography color="text.secondary">No participants added yet.</Typography>
      ) : (
        <Table sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Amount Paid</TableCell>
              <TableCell>Amount Owed</TableCell>
              <TableCell>Net Balance</TableCell>
              <TableCell>Remove</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billParticipants.map((p) => {
              const amountPaid = getAmountPaid(p.id);
              const netBalance = amountPaid - p.amountOwed;
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>${amountPaid.toFixed(2)}</TableCell>
                  <TableCell>${p.amountOwed.toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography
                      color={netBalance > 0 ? "success.main" : netBalance < 0 ? "error.main" : "text.primary"}
                    >
                      ${netBalance.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveFromBill(p.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
