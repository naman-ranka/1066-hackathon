import React from "react";
import { Box, Typography } from "@mui/material";

export default function SettlementSection({ items, billInfo, billParticipants, settlement }) {
  return (
    <Box sx={{ mb: 3 }}>
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

      {/* Optionally, show final total from billInfo */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Final Total: ${billInfo.totalAmount.toFixed(2)}
      </Typography>
    </Box>
  );
}
