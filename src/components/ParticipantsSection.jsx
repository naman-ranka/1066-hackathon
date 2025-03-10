import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Avatar,
  Grid
} from '@mui/material';

// Simple read-only participant card
const ParticipantCard = React.memo(({ participant }) => (
  <Card variant="outlined" sx={{ mb: 1 }}>
    <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
          {participant.name[0].toUpperCase()}
        </Avatar>
        <Typography variant="body1">{participant.name}</Typography>
      </Box>
    </CardContent>
  </Card>
));

// Main component wrapped in React.memo for performance
export default React.memo(function ParticipantsSection({ 
  participants, 
  loadingParticipants 
}) {
  // Memoize the participant list to prevent unnecessary re-renders
  const participantList = React.useMemo(() => (
    <Grid container spacing={1}>
      {participants.map(participant => (
        <Grid item xs={12} sm={6} md={4} key={participant.id}>
          <ParticipantCard participant={participant} />
        </Grid>
      ))}
    </Grid>
  ), [participants]);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontSize: "0.9rem", fontWeight: 500, mb: 1 }}>
        1. Group Participants
      </Typography>

      {loadingParticipants ? (
        <CircularProgress size={20} sx={{ display: "block", margin: "20px auto" }} />
      ) : participants.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: "center",
            borderStyle: "dashed",
            borderWidth: "1px",
            borderColor: "grey.400",
            backgroundColor: "grey.50"
          }}
        >
          <Typography color="text.secondary">
            No participants in this group yet
          </Typography>
        </Paper>
      ) : (
        participantList
      )}
    </Box>
  );
});