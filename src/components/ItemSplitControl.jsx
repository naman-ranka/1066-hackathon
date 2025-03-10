import React, { useState, useMemo, useCallback } from "react";
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

const ItemSplitControl = ({
  item,
  participants,
  onSplitTypeChange,
  onToggleEqualParticipant,
  onItemSplitChange,
  compact = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Memoized participant count calculation
  const participantCount = useMemo(() => {
    if (item.splitType === "equal") {
      return item.includedParticipants?.length || 0;
    }
    return Object.keys(item.splits || {}).filter(id => item.splits[id]).length || 0;
  }, [item.splitType, item.includedParticipants, item.splits]);

  // Memoized color and label getters
  const splitTypeColor = useMemo(() => {
    switch (item.splitType) {
      case "equal": return "primary";
      case "unequal-money": return "success";
      case "unequal-percent": return "warning";
      case "unequal-shares": return "info";
      default: return "primary";
    }
  }, [item.splitType]);

  const splitTypeLabel = useMemo(() => {
    switch (item.splitType) {
      case "equal": return "Equal";
      case "unequal-money": return "Money";
      case "unequal-percent": return "Percent";
      case "unequal-shares": return "Parts";
      default: return "Split";
    }
  }, [item.splitType]);

  // Memoized split type change handler
  const handleSplitTypeChange = useCallback((e) => {
    onSplitTypeChange(e.target.value);
  }, [onSplitTypeChange]);

  // Memoize the menu items for split type selection
  const splitTypeMenuItems = useMemo(() => ([
    {
      value: "equal",
      icon: <PieChartIcon sx={{ mr: 1, fontSize: "1rem" }} />,
      label: "Equal Split"
    },
    {
      value: "unequal-money",
      icon: <MoneyIcon sx={{ mr: 1, fontSize: "1rem" }} />,
      label: "Unequal (Money)"
    },
    {
      value: "unequal-percent",
      icon: <PercentIcon sx={{ mr: 1, fontSize: "1rem" }} />,
      label: "Unequal (Percentage)"
    },
    {
      value: "unequal-shares",
      icon: <PeopleIcon sx={{ mr: 1, fontSize: "1rem" }} />,
      label: "Unequal (Parts)"
    }
  ]), []);

  // Memoize participant input fields
  const participantInputs = useMemo(() => (
    participants.map((p) => {
      if (item.splitType === "equal") {
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
      }
      
      return (
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
      );
    })
  ), [item, participants, onToggleEqualParticipant, onItemSplitChange]);

  // Memoize the popover content
  const popoverContent = useMemo(() => (
    <Box sx={{ p: 2, width: 280 }}>
      <Typography variant="subtitle2" gutterBottom>
        Split Settings
      </Typography>
      
      <FormControl size="small" fullWidth sx={{ mb: 2 }}>
        <InputLabel>Split Type</InputLabel>
        <Select
          value={item.splitType}
          label="Split Type"
          onChange={handleSplitTypeChange}
        >
          {splitTypeMenuItems.map(({ value, icon, label }) => (
            <MenuItem key={value} value={value}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {icon}
                <Typography>{label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
        {item.splitType === "equal" ? (
          <FormGroup>
            {participantInputs}
          </FormGroup>
        ) : (
          <>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
              {item.splitType === "unequal-money" && "Enter amount for each person"}
              {item.splitType === "unequal-percent" && "Enter percentage for each person"}
              {item.splitType === "unequal-shares" && "Enter share count for each person"}
            </Typography>
            {participantInputs}
          </>
        )}
      </Box>
    </Box>
  ), [item.splitType, splitTypeMenuItems, participantInputs, handleSplitTypeChange]);

  // Render compact view
  if (compact) {
    return (
      <>
        <Badge 
          badgeContent={participantCount} 
          color="secondary" 
          max={9}
          overlap="circular"
          sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem" } }}
        >
          <Chip
            icon={<SplitTypeIcon type={item.splitType} />}
            label={splitTypeLabel}
            size="small"
            color={splitTypeColor}
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
            sx: { boxShadow: 3, borderRadius: 2 }
          }}
        >
          {popoverContent}
        </Popover>
      </>
    );
  }

  // Render full view (with same optimizations)
  return (
    <Box sx={{ width: "100%" }}>
      <FormControl size="small" sx={{ width: "100%", mb: 0.5 }}>
        <InputLabel sx={{ fontSize: "0.75rem" }}>Split Type</InputLabel>
        <Select
          label="Split Type"
          value={item.splitType}
          onChange={handleSplitTypeChange}
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
          {splitTypeMenuItems.map(({ value, label }) => (
            <MenuItem key={value} value={value} sx={{ fontSize: "0.75rem" }}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        sx={{
          border: "1px dashed #ccc",
          p: 0.5,
          mt: 0,
          ...(item.splitType === "equal" 
            ? { maxHeight: "70px" }
            : {
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                maxHeight: "80px",
              }
          ),
          overflowY: "auto",
        }}
      >
        {item.splitType === "equal" ? (
          <FormGroup sx={{ flexDirection: "row" }}>
            {participantInputs}
          </FormGroup>
        ) : (
          participantInputs
        )}
      </Box>
    </Box>
  );
};

// Custom comparison function for React.memo
const compareProps = (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.participants === nextProps.participants &&
    prevProps.compact === nextProps.compact &&
    prevProps.onSplitTypeChange === nextProps.onSplitTypeChange &&
    prevProps.onToggleEqualParticipant === nextProps.onToggleEqualParticipant &&
    prevProps.onItemSplitChange === nextProps.onItemSplitChange
  );
};

export default React.memo(ItemSplitControl, compareProps);