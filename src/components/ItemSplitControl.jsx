import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Popover,
  IconButton,
  Chip,
  Badge,
  Tooltip,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import {
  PieChart as PieChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Money as MoneyIcon,
  Percent as PercentIcon,
} from "@mui/icons-material";

const SplitTypeIcon = ({ type }) => {
  switch (type) {
    case "equal":
      return <PieChartIcon sx={{ fontSize: "0.9rem" }} />;
    case "unequal-money":
      return <MoneyIcon sx={{ fontSize: "0.9rem" }} />;
    case "unequal-percent":
      return <PercentIcon sx={{ fontSize: "0.9rem" }} />;
    case "unequal-shares":
      return <PeopleIcon sx={{ fontSize: "0.9rem" }} />;
    default:
      return <PieChartIcon sx={{ fontSize: "0.9rem" }} />;
  }
};

export default function ItemSplitControl({
  item,
  participants,
  onSplitTypeChange,
  onToggleEqualParticipant,
  onItemSplitChange,
  compact = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Count participants involved in the split
  const getParticipantCount = () => {
    if (item.splitType === "equal") {
      return item.includedParticipants?.length || 0;
    }
    return Object.keys(item.splits || {}).filter(id => item.splits[id]).length || 0;
  };

  // Get color for the split chip
  const getSplitTypeColor = () => {
    switch (item.splitType) {
      case "equal": return "primary";
      case "unequal-money": return "success";
      case "unequal-percent": return "warning";
      case "unequal-shares": return "info";
      default: return "primary";
    }
  };

  // Get label for split type
  const getSplitTypeLabel = () => {
    switch (item.splitType) {
      case "equal": return "Equal";
      case "unequal-money": return "Money";
      case "unequal-percent": return "Percent";
      case "unequal-shares": return "Parts";
      default: return "Split";
    }
  };

  // Display compact view (for small screens or table cell)
  if (compact) {
    return (
      <>
        <Badge 
          badgeContent={getParticipantCount()} 
          color="secondary" 
          max={9}
          overlap="circular"
          sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem" } }}
        >
          <Chip
            icon={<SplitTypeIcon type={item.splitType} />}
            label={getSplitTypeLabel()}
            size="small"
            color={getSplitTypeColor()}
            onClick={handleClick}
            sx={{ fontSize: "0.7rem" }}
          />
        </Badge>
        
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          PaperProps={{
            sx: { 
              p: 2, 
              width: 280,
              boxShadow: 3,
              borderRadius: 2
            }
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Split Settings
          </Typography>
          
          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Split Type</InputLabel>
            <Select
              value={item.splitType}
              label="Split Type"
              onChange={(e) => onSplitTypeChange(e.target.value)}
            >
              <MenuItem value="equal">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PieChartIcon sx={{ mr: 1, fontSize: "1rem" }} />
                  <Typography>Equal Split</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="unequal-money">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <MoneyIcon sx={{ mr: 1, fontSize: "1rem" }} />
                  <Typography>Unequal (Money)</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="unequal-percent">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PercentIcon sx={{ mr: 1, fontSize: "1rem" }} />
                  <Typography>Unequal (Percentage)</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="unequal-shares">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PeopleIcon sx={{ mr: 1, fontSize: "1rem" }} />
                  <Typography>Unequal (Parts)</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
            {item.splitType === "equal" ? (
              <FormGroup>
                {participants.map((p) => {
                  const isChecked = item.includedParticipants?.includes(p.id) || false;
                  return (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => onToggleEqualParticipant(p.id)}
                          size="small"
                        />
                      }
                      label={p.name}
                    />
                  );
                })}
              </FormGroup>
            ) : (
              <>
                <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                  {item.splitType === "unequal-money" && "Enter amount for each person"}
                  {item.splitType === "unequal-percent" && "Enter percentage for each person"}
                  {item.splitType === "unequal-shares" && "Enter share count for each person"}
                </Typography>
                {participants.map((p) => (
                  <Box key={p.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ flex: 1 }}>{p.name}</Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={item.splits[p.id] || ""}
                      onChange={(e) => onItemSplitChange(p.id, e.target.value)}
                      sx={{ width: "80px" }}
                      InputProps={{
                        endAdornment: item.splitType === "unequal-percent" ? "%" : null,
                      }}
                    />
                  </Box>
                ))}
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  }

  // Full featured view (for larger screens)
  return (
    <Box sx={{ width: "100%" }}>
      <FormControl size="small" sx={{ width: "100%", mb: 0.5 }}>
        <InputLabel sx={{ fontSize: "0.75rem" }}>Split Type</InputLabel>
        <Select
          label="Split Type"
          value={item.splitType}
          onChange={(e) => onSplitTypeChange(e.target.value)}
          sx={{
            fontSize: "0.75rem",
            "& .MuiSelect-select": {
              padding: "2px 4px",
              height: "1.2rem",
            },
            height: "24px",
          }}
          startAdornment={<SplitTypeIcon type={item.splitType} />}
        >
          <MenuItem value="equal" sx={{ fontSize: "0.75rem" }}>
            Equal
          </MenuItem>
          <MenuItem value="unequal-money" sx={{ fontSize: "0.75rem" }}>
            Unequal (₹)
          </MenuItem>
          <MenuItem value="unequal-percent" sx={{ fontSize: "0.75rem" }}>
            Unequal (%)
          </MenuItem>
          <MenuItem value="unequal-shares" sx={{ fontSize: "0.75rem" }}>
            Unequal (Parts)
          </MenuItem>
        </Select>
      </FormControl>

      {/* Render either checkboxes (equal) or text fields (unequal) */}
      {item.splitType === "equal" ? (
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
            {participants.map((p) => {
              const isChecked =
                item.includedParticipants?.includes(p.id) || false;
              return (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      checked={isChecked}
                      onChange={() => onToggleEqualParticipant(p.id)}
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
      ) : (
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
          {participants.map((p) => (
            <Box
              key={p.id}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Typography sx={{ width: 60, fontSize: "0.7rem" }}>
                {p.name}
              </Typography>
              <TextField
                type="number"
                size="small"
                value={item.splits[p.id] || ""}
                onChange={(e) => onItemSplitChange(p.id, e.target.value)}
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
    </Box>
  );
}