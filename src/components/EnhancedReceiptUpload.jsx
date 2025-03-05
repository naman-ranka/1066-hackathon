import React, { useState, useRef } from 'react';
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
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import { processMultipleReceiptImages } from '../utils/imageProcessor';

/**
 * Enhanced Receipt Upload Component with drag and drop support
 * and LLM processing options
 */
export default function EnhancedReceiptUpload({ onProcessComplete }) {
  // Dialog open state
  const [open, setOpen] = useState(false);
  
  // Upload settings
  const [useLLM, setUseLLM] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  // Handle dialog open/close
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (!isLoading) {
      setOpen(false);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setError(null);
    }
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
      // Use the processMultipleReceiptImages function from imageProcessor.js
      const data = await processMultipleReceiptImages(selectedFiles, useLLM);
      
      // Close the dialog
      setOpen(false);
      
      // Clean up preview URLs to avoid memory leaks
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Clear the selection
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      // Call the callback with the processed data
      onProcessComplete(data);
      
    } catch (error) {
      console.error("Error processing receipt images:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if OCR+LLM option should be available or forced
  const multipleFiles = selectedFiles.length > 1;
  
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
          <Typography variant="h6">Upload Receipt Image(s)</Typography>
          {!isLoading && (
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
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
                            disabled={isLoading}
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
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessFiles}
            disabled={selectedFiles.length === 0 || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <ImageIcon />}
          >
            {isLoading ? 'Processing...' : 'Process Images'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}