import JSZip from 'jszip';

export async function downloadAndExtractFitData() {
  try {
    const response = await fetch('http://localhost:8000/api/fit-data');
    if (!response.ok) {
      throw new Error('Failed to fetch data from server');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
} 