const API_URL = process.env.REACT_APP_API_URL;

export async function processReceiptImage(imageFile) {
  try {
    console.log('Starting receipt processing...');
    
    // Create form data to send the file
    const formData = new FormData();
    formData.append('file', imageFile);

    // Send request to backend (note the trailing slash)
    const response = await fetch(`${API_URL}/process-receipt/`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(response);

    const data = await response.json();
    
    // Extract the JSON from the bill property
    if (data.bill) {
      const jsonMatch = data.bill.match(/```json\n([\s\S]*)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
    }

    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Error in processReceiptImage:', error);
    throw error;
  }
}

/**
 * Process multiple receipt images with optional LLM support
 * @param {File[]} imageFiles Array of image files
 * @param {boolean} useLLM Whether to use LLM for enhanced processing
 * @returns {Promise<object>} Structured bill data
 */
export async function processMultipleReceiptImages(imageFiles, useLLM = true) {
  try {
    console.log('Starting multi-image receipt processing...');
    
    // Create form data to send the files
    const formData = new FormData();
    
    // Append all files
    imageFiles.forEach(file => {
      formData.append('files', file);
    });
    
    // Add processing option
    formData.append('use_llm', useLLM ? 'true' : 'false');
    
    // Send request to backend
    const response = await fetch(`${API_URL}/process-images/`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error in processMultipleReceiptImages:', error);
    throw error;
  }
}

/**
 * Process bill images using Google Cloud Vision API
 * @param {File[]} imageFiles Array of image files
 * @returns {Promise<object>} Structured bill data
 */
export async function processBillImages(imageFiles) {
  try {
    console.log('Starting bill image processing with Google Cloud...');
    
    // Create form data to send the files
    const formData = new FormData();
    
    // Append all files with 'files[]' field name
    imageFiles.forEach(file => {
      formData.append('files[]', file);
    });
    
    // Add provider to form data instead of URL parameter
    formData.append('provider', 'google_cloud');
    
    // Send request to backend
    const response = await fetch(`${API_URL}/process-bill-images/`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in processBillImages:', error);
    throw error;
  }
}