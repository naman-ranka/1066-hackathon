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
  TextField,
} from "@mui/material";

export default function ParticipantsSection({ participants, setParticipants }) {
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

  const handleRemoveParticipant = (id) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleParticipantChange = (id, field, value) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        3. Participants
      </Typography>

      <Button 
        variant="contained" 
        onClick={handleAddParticipant} 
        sx={{ mb: 3 }}
      >
        Add Participant
      </Button>

      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="center">Amount Paid</TableCell>
            <TableCell align="center">Amount Owed (auto)</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participants.map((p) => (
            <TableRow key={p.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>
                <TextField
                  size="small"
                  value={p.name}
                  onChange={(e) => handleParticipantChange(p.id, "name", e.target.value)}
                  placeholder="Enter name"
                  fullWidth
                />
              </TableCell>
              <TableCell align="center">
                <TextField
                  type="number"
                  size="small"
                  value={p.amountPaid}
                  onChange={(e) => handleParticipantChange(p.id, "amountPaid", parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                  }}
                  sx={{ width: '120px' }}
                />
              </TableCell>
              <TableCell align="center">
                <Typography color="text.secondary">
                  ${p.amountOwed.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleRemoveParticipant(p.id)}
                  size="small"
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {participants.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography color="text.secondary">
            No participants added yet. Add participants to start splitting the bill.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
