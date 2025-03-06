import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Paper,
  IconButton,
  Grid,
  Alert,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Slider,
  Divider,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import ContrastIcon from '@mui/icons-material/Contrast';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { processMultipleReceiptImages } from '../utils/imageProcessor';

/**
 * Enhanced Receipt Upload Component with multi-phase approach:
 * 1. Upload images
 * 2. Process data
 * 3. Review data
 */
export default function EnhancedReceiptUpload({ onProcessComplete }) {
  // Dialog open state
  const [open, setOpen] = useState(false);
  
  // Multi-phase approach
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Upload Images', 'Adjust & Process', 'Review Data'];
  
  // Upload settings
  const [useLLM, setUseLLM] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [adjustedImages, setAdjustedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  
  // Image adjustment settings
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  // Handle dialog open/close
  const handleOpen = () => {
    setOpen(true);
    resetState();
  };
  
  const handleClose = () => {
    if (!isLoading) {
      setOpen(false);
      resetState();
    }
  };
  
  // Reset component state
  const resetState = () => {
    setActiveStep(0);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setAdjustedImages([]);
    setProcessedData(null);
    setError(null);
    setBrightness(100);
    setContrast(100);
    setSelectedImageIndex(0);
  };

  // Handle file selection from the file input
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length > 0) {
      // Check file types
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        setError("Only image files are allowed");
        return;
      }
      
      // Update the selected files
      setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
      
      // Initialize adjusted images array with default settings
      const newAdjustedImages = validFiles.map(() => ({ brightness: 100, contrast: 100 }));
      setAdjustedImages(prevAdjusted => [...prevAdjusted, ...newAdjustedImages]);
      
      // Clear any previous errors
      setError(null);
    }
  };
  
  // Trigger the file input click
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    
    if (files.length > 0) {
      // Check file types
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        setError("Only image files are allowed");
        return;
      }
      
      // Update the selected files
      setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
      
      // Initialize adjusted images array with default settings
      const newAdjustedImages = validFiles.map(() => ({ brightness: 100, contrast: 100 }));
      setAdjustedImages(prevAdjusted => [...prevAdjusted, ...newAdjustedImages]);
      
      // Clear any previous errors
      setError(null);
    }
  };
  
  // Prevent default for drag over
  const handleDragOver = (event) => {
    event.preventDefault();
  };
  
  // Remove a file from the selection
  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
    setAdjustedImages(prevAdjusted => prevAdjusted.filter((_, i) => i !== index));
    
    // Update selected image index if needed
    if (selectedImageIndex >= index && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };
  
  // Handle image selection for adjustment
  const handleSelectImage = (index) => {
    setSelectedImageIndex(index);
    setBrightness(adjustedImages[index].brightness);
    setContrast(adjustedImages[index].contrast);
  };
  
  // Handle brightness change
  const handleBrightnessChange = (_, newValue) => {
    setBrightness(newValue);
    setAdjustedImages(prevAdjusted => {
      const newAdjusted = [...prevAdjusted];
      newAdjusted[selectedImageIndex] = {
        ...newAdjusted[selectedImageIndex],
        brightness: newValue
      };
      return newAdjusted;
    });
  };
  
  // Handle contrast change
  const handleContrastChange = (_, newValue) => {
    setContrast(newValue);
    setAdjustedImages(prevAdjusted => {
      const newAdjusted = [...prevAdjusted];
      newAdjusted[selectedImageIndex] = {
        ...newAdjusted[selectedImageIndex],
        contrast: newValue
      };
      return newAdjusted;
    });
  };
  
  // Reset image adjustments
  const handleResetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setAdjustedImages(prevAdjusted => {
      const newAdjusted = [...prevAdjusted];
      newAdjusted[selectedImageIndex] = {
        brightness: 100,
        contrast: 100
      };
      return newAdjusted;
    });
  };
  
  // Process the selected files
  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image file");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: In a real implementation, we would apply the brightness/contrast
      // adjustments to the images before sending them to the backend.
      // For now, we'll just log the adjustments and send the original files.
      console.log("Image adjustments:", adjustedImages);
      
      // Use the processMultipleReceiptImages function from imageProcessor.js
      const data = await processMultipleReceiptImages(selectedFiles, useLLM);
      
      // Store the processed data for review
      setProcessedData(data);
      
      // Move to the review step
      setActiveStep(2);
      
    } catch (error) {
      console.error("Error processing receipt images:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle navigation between steps
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle completion
  const handleComplete = () => {
    // Clean up preview URLs to avoid memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Close the dialog
    setOpen(false);
    
    // Call the callback with the processed data
    onProcessComplete(processedData);
    
    // Reset the state
    resetState();
  };

  // Determine if OCR+LLM option should be available or forced
  const multipleFiles = selectedFiles.length > 1;
  
  // Render the current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Upload Images
        return (
          <>
            {/* Drop Zone */}
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                mb: 3,
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#999',
                  backgroundColor: '#f0f0f0'
                }
              }}
              onClick={handleButtonClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop Receipt Images Here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Or click to browse files
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: JPG, PNG, GIF, BMP
              </Typography>
            </Box>
            
            {/* Preview Section */}
            {selectedFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Images ({selectedFiles.length}):
                </Typography>
                
                <Grid container spacing={2}>
                  {previewUrls.map((url, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1,
                          position: 'relative',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Box
                          sx={{
                            height: 120,
                            backgroundImage: `url(${url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: 1,
                            mb: 1
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: '70%' }}>
                            {selectedFiles[index].name}
                          </Typography>
                          <Tooltip title="Remove">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveFile(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        );
        
      case 1: // Adjust & Process
        return (
          <>
            {/* Processing Options */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useLLM || multipleFiles}
                    onChange={(e) => setUseLLM(e.target.checked)}
                    disabled={multipleFiles} // Always checked for multiple files
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Use OCR + LLM Processing
                      {multipleFiles && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (Required for multiple files)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                }
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ pl: 4 }}>
                LLM processing provides better structure and accuracy for receipt data extraction
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Image Adjustment Section */}
            {selectedFiles.length > 0 && (
              <Grid container spacing={3}>
                {/* Image Preview */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Adjust Image
                  </Typography>
                  
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    {previewUrls.length > 0 && (
                      <Box
                        component="img"
                        src={previewUrls[selectedImageIndex]}
                        alt={`Receipt ${selectedImageIndex + 1}`}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 300,
                          objectFit: 'contain',
                          filter: `brightness(${brightness}%) contrast(${contrast}%)`
                        }}
                      />
                    )}
                  </Paper>
                  
                  {/* Image Selection */}
                  {selectedFiles.length > 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" gutterBottom>
                        Select Image to Adjust:
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {previewUrls.map((url, index) => (
                          <Grid item key={index}>
                            <Box
                              onClick={() => handleSelectImage(index)}
                              sx={{
                                width: 50,
                                height: 50,
                                backgroundImage: `url(${url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: index === selectedImageIndex ? '2px solid #1976d2' : '2px solid transparent'
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Grid>
                
                {/* Adjustment Controls */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image Adjustments
                  </Typography>
                  
                  <Paper elevation={2} sx={{ p: 2 }}>
                    {/* Brightness Slider */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom display="flex" alignItems="center">
                        <BrightnessHighIcon fontSize="small" sx={{ mr: 1 }} />
                        Brightness: {brightness}%
                      </Typography>
                      <Slider
                        value={brightness}
                        onChange={handleBrightnessChange}
                        min={50}
                        max={150}
                        step={1}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    
                    {/* Contrast Slider */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom display="flex" alignItems="center">
                        <ContrastIcon fontSize="small" sx={{ mr: 1 }} />
                        Contrast: {contrast}%
                      </Typography>
                      <Slider
                        value={contrast}
                        onChange={handleContrastChange}
                        min={50}
                        max={150}
                        step={1}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    
                    {/* Reset Button */}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleResetAdjustments}
                      sx={{ mt: 1 }}
                    >
                      Reset Adjustments
                    </Button>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Adjust brightness and contrast to improve receipt readability before processing.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </>
        );
        
      case 2: // Review Data
        return (
          <>
            {processedData && (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Receipt data successfully extracted! Review the information below before confirming.
                  </Typography>
                </Alert>
                
                <Grid container spacing={3}>
                  {/* Receipt Summary */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Receipt Summary
                        </Typography>
                        
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Merchant" 
                              secondary={processedData.merchant || "Not detected"} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Date" 
                              secondary={processedData.date || "Not detected"} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Total Amount" 
                              secondary={processedData.total ? `$${processedData.total}` : "Not detected"} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Tax" 
                              secondary={processedData.tax ? `$${processedData.tax}` : "Not detected"} 
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Items List */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Items Detected ({processedData.items?.length || 0})
                        </Typography>
                        
                        {processedData.items && processedData.items.length > 0 ? (
                          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {processedData.items.map((item, index) => (
                              <ListItem key={index} divider={index < processedData.items.length - 1}>
                                <ListItemText
                                  primary={item.name}
                                  secondary={`$${item.price} ${item.quantity > 1 ? `× ${item.quantity}` : ''}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No items detected
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Note: You can edit these details after confirming in the bill details screen.
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        );
        
      default:
        return null;
    }
  };
  
  // Determine if the next button should be enabled
  const isNextEnabled = () => {
    switch (activeStep) {
      case 0:
        return selectedFiles.length > 0;
      case 1:
        return true;
      default:
        return false;
    }
  };
  
  return (
    <>
      {/* Button to open the dialog */}
      <Button
        variant="outlined"
        color="primary"
        startIcon={<CloudUploadIcon />}
        onClick={handleOpen}
        sx={{ mt: 1 }}
      >
        Enhanced Receipt Upload
      </Button>
      
      {/* Upload Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{steps[activeStep]}</Typography>
          {!isLoading && (
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        
        {/* Stepper */}
        <Box sx={{ width: '100%', p: 2, pb: 0 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <DialogContent dividers>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Step Content */}
          {renderStepContent()}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Box>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
          </Box>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleComplete}
                startIcon={<CheckCircleIcon />}
              >
                Confirm & Complete
              </Button>
            ) : activeStep === 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleProcessFiles}
                disabled={!isNextEnabled() || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <ImageIcon />}
              >
                {isLoading ? 'Processing...' : 'Process Images'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={!isNextEnabled()}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}