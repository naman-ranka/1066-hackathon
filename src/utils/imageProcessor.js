// No need for Gemini imports anymore since processing is moved to backend
export async function processReceiptImage(imageFile) {
  try {
    console.log('Starting receipt processing...');
    
    // Create form data to send the file
    const formData = new FormData();
    formData.append('file', imageFile);

    // Send request to backend (note the trailing slash)
    const response = await fetch('http://localhost:8000/api/process-receipt/', {
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