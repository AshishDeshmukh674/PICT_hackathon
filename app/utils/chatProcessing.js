// Replace any tfnode imports with browser version
export const processExtractedText = async (text, fileType) => {
  // Your processing logic here
  return {
    text,
    metadata: {
      fileType,
      timestamp: new Date().toISOString()
    }
  };
}; 