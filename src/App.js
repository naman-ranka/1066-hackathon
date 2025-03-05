import React, { useState, useEffect } from "react";
import "./styles.css";
import { saveBill } from "./api/billService";
import { loadBillFromJson } from "./utils/billLoader";
import { processReceiptImage } from "./utils/imageProcessor";
import axios from "axios";

import Header from "./components/Header/headers";

// Subcomponents
import BillDetails from "./components/BillDetails";
import ItemsSection from "./components/ItemsSection";
import ParticipantsSection from "./components/ParticipantsSection";
import SettlementSection from "./components/SettlementSection";

// MUI imports
import { Container, Typography, Paper, Box, Button, useMediaQuery, useTheme, Fab, Drawer, List, ListItem, ListItemText, Divider } from "@mui/material";
import { Add as AddIcon, NavigateNext, NavigateBefore, SaveAlt as SaveAltIcon } from '@mui/icons-material';

// Helper function for minimal settlement
import { calculateSettlement } from "./utils/settlementUtils";

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

// Configure axios
const api = axios.create({
    baseURL: API_URL
});

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // ---------------------------
  // State
  // ---------------------------
  const [billInfo, setBillInfo] = useState({
    billName: "",
    totalAmount: 0,
    billDate: new Date(),
    location: "",
    notes: "",
    payers: [], // array of {participantId, name, amount}
  });

  const [allParticipants, setAllParticipants] = useState([]);

  const [items, setItems] = useState([
    {
      id: Date.now(),
      name: "",
      quantity: 1,
      price: 0,
      taxRate: 0,
      splitType: "equal",
      splits: {},
      includedParticipants: [],
    },
  ]);

  const [billParticipants, setBillParticipants] = useState([]);
  const [settlement, setSettlement] = useState([]);

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    recalculateBill();
    // eslint-disable-next-line
  }, [items, billParticipants]);

  useEffect(() => {
    async function fetchAllParticipants() {
      try {
        const response = await api.get("/global-participants/");
        setAllParticipants(response.data);
      } catch (error) {
        console.error("Error fetching billParticipants from backend:", error);
      }
    }
  
    fetchAllParticipants();
  }, []);

  // ---------------------------
  // Navigation and Mobile UI
  // ---------------------------
  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, 3));
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const handleStepChange = (step) => {
    setActiveStep(step);
    setDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // ---------------------------
  // Calculation
  // ---------------------------
  const calculateItemTotal = (item) => {
    const subtotal = Number((item.price * item.quantity).toFixed(2));
    const taxAmount = Number(((subtotal * item.taxRate) / 100).toFixed(2));
    return Number((subtotal + taxAmount).toFixed(2));
  };

  const recalculateBill = () => {
    let total = 0;
    items.forEach((item) => {
      total += calculateItemTotal(item);
    });

    // Reset each participant's amountOwed
    const updatedParticipants = billParticipants.map((p) => ({ ...p, amountOwed: 0 }));

    // Distribute costs per item
    items.forEach((item) => {
      const itemTotal = calculateItemTotal(item);

      if (item.splitType === "equal") {
        // Use includedParticipants if set, else all
        const relevantIds = item.includedParticipants?.length
          ? item.includedParticipants
          : updatedParticipants.map((p) => p.id);
        const share = itemTotal / (relevantIds.length || 1);
        updatedParticipants.forEach((p) => {
          if (relevantIds.includes(p.id)) {
            p.amountOwed += share;
          }
        });
      } else if (item.splitType === "unequal-money") {
        // direct amounts in item.splits
        Object.entries(item.splits).forEach(([pid, amt]) => {
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += parseFloat(amt) || 0;
          }
        });
      } else if (item.splitType === "unequal-percent") {
        // percentages in item.splits
        let sumOfPercent = 0;
        Object.values(item.splits).forEach((percent) => {
          sumOfPercent += parseFloat(percent) || 0;
        });
        Object.entries(item.splits).forEach(([pid, percent]) => {
          const fraction = sumOfPercent ? (parseFloat(percent) || 0) / sumOfPercent : 0;
          const amount = itemTotal * fraction;
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += amount;
          }
        });
      } else if (item.splitType === "unequal-shares") {
        // shares in item.splits
        let totalShares = 0;
        Object.values(item.splits).forEach((sh) => {
          totalShares += parseFloat(sh) || 0;
        });
        Object.entries(item.splits).forEach(([pid, shares]) => {
          const fraction = totalShares ? (parseFloat(shares) || 0) / totalShares : 0;
          const amount = itemTotal * fraction;
          const idx = updatedParticipants.findIndex((p) => p.id === Number(pid));
          if (idx !== -1) {
            updatedParticipants[idx].amountOwed += amount;
          }
        });
      }
    });

    // Minimal settlement
    const minimalTxns = calculateSettlement(updatedParticipants);

    setBillInfo((prev) => ({ ...prev, totalAmount: Number(total.toFixed(2)) }));
    setBillParticipants(updatedParticipants);
    setSettlement(minimalTxns);
  };

  const handleSave = async () => {
    try {
      const result = await saveBill(billInfo, items, billParticipants);
      alert("Bill saved successfully!");
      console.log("Saved bill:", result);
    } catch (error) {
      console.error("Error saving bill:", error);
      alert("Error saving bill: " + (error.message || "Unknown error"));
    }
  };

  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const parsedData = loadBillFromJson(jsonData);
          
          if (parsedData.isValid) {
            setBillInfo(parsedData.billInfo);
            setItems(parsedData.items);
            setBillParticipants(parsedData.billParticipants);
          } else {
            alert("Error loading JSON: " + parsedData.error);
          }
        } catch (error) {
          alert("Invalid JSON file: " + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReceiptUpload = async (file) => {
    try {
      // Process the image and get JSON response
      const jsonData = await processReceiptImage(file);
      
      // Use existing billLoader to parse the data
      const parsedData = loadBillFromJson(jsonData);
      
      if (parsedData.isValid) {
        setBillInfo(parsedData.billInfo);
        setItems(parsedData.items);
        setBillParticipants(parsedData.billParticipants);
      } else {
        alert("Error processing receipt: " + parsedData.error);
      }
    } catch (error) {
      console.error('Failed to process receipt:', error);
    }
  };

  // Define section components for mobile navigation
  const sections = [
    { title: "Participants", component: ParticipantsSection, props: { allParticipants, billParticipants, setBillParticipants, billInfo } },
    { title: "Bill Details", component: BillDetails, props: { billInfo, setBillInfo, onUploadReceipt: handleReceiptUpload, billParticipants, items, settlement } },
    { title: "Items", component: ItemsSection, props: { items, setItems, billParticipants } },
    { title: "Settlement", component: SettlementSection, props: { items, billInfo, billParticipants, settlement } }
  ];

  // ---------------------------
  // Render
  // ---------------------------
  const renderCurrentSection = () => {
    const CurrentSection = sections[activeStep].component;
    return <CurrentSection {...sections[activeStep].props} />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 8 }}>
      <Header />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0, fontSize: isMobile ? '1.5rem' : '2.125rem' }}>
          Bill Splitting Application
        </Typography>
        
        {!isMobile && (
          <Box>
            <input
              accept=".json"
              style={{ display: 'none' }}
              id="json-file-input"
              type="file"
              onChange={handleJsonUpload}
            />
            <label htmlFor="json-file-input">
              <Button 
                variant="outlined" 
                component="span"
                sx={{ mr: 2 }}
              >
                Load from JSON
              </Button>
            </label>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              sx={{ minWidth: 100 }}
            >
              Save Bill
            </Button>
          </Box>
        )}
      </Box>

      {/* Mobile view with step navigation */}
      {isMobile ? (
        <Box>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <Button 
              onClick={toggleDrawer}
              variant="text" 
              color="primary"
              size="small"
            >
              {sections[activeStep].title}
            </Button>
            
            <Box sx={{ display: 'flex' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                size="small"
                sx={{ minWidth: 'auto', mr: 1 }}
              >
                <NavigateBefore />
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={activeStep === sections.length - 1}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                <NavigateNext />
              </Button>
            </Box>
          </Paper>
          
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            <List sx={{ width: 250 }}>
              {sections.map((section, index) => (
                <ListItem 
                  button 
                  key={index} 
                  onClick={() => handleStepChange(index)}
                  selected={activeStep === index}
                  sx={{
                    backgroundColor: activeStep === index ? 'primary.light' : 'inherit'
                  }}
                >
                  <ListItemText primary={`${index + 1}. ${section.title}`} />
                </ListItem>
              ))}
              <Divider />
              <ListItem button onClick={handleSave}>
                <ListItemText primary="Save Bill" />
              </ListItem>
              <ListItem button>
                <input
                  accept=".json"
                  style={{ display: 'none' }}
                  id="json-file-input-mobile"
                  type="file"
                  onChange={handleJsonUpload}
                />
                <label htmlFor="json-file-input-mobile" style={{ width: '100%' }}>
                  <ListItemText primary="Load from JSON" sx={{ cursor: 'pointer' }} />
                </label>
              </ListItem>
            </List>
          </Drawer>

          <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            {renderCurrentSection()}
          </Box>
          
          <Fab 
            color="primary" 
            aria-label="save" 
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={handleSave}
          >
            <SaveAltIcon />
          </Fab>
        </Box>
      ) : (
        // Desktop view with all sections
        <>
          <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
            <ParticipantsSection
              allParticipants={allParticipants}
              billParticipants={billParticipants}
              setBillParticipants={setBillParticipants}
              billInfo={billInfo}
            />
          </Box>

          <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
            <BillDetails
              billInfo={billInfo}
              setBillInfo={setBillInfo}
              onUploadReceipt={handleReceiptUpload}
              billParticipants={billParticipants}
              items={items}
              settlement={settlement}
            />
          </Box>

          <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
            <ItemsSection
              items={items}
              setItems={setItems}
              billParticipants={billParticipants}
            />
          </Box>

          <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SettlementSection
              items={items}
              billInfo={billInfo}
              billParticipants={billParticipants}
              settlement={settlement}
            />
          </Box>
        </>
      )}
    </Container>
  );
}
