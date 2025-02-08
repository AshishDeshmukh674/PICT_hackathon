const extractStructuredData = async (text) => {
  try {
    const response = await fetch("/api/process-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Failed to process document");
    }

    const data = await response.json();
    // Log the raw response data
    console.log("Raw API Response:", data);
    
    // Return the data directly since it's already parsed in the API
    return data;
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
};

export { extractStructuredData }; 