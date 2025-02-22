import Papa from 'papaparse';

export async function processFitData(data) {
  try {
    // Process the data from Python backend
    const processedData = data.map(row => ({
      date: new Date(row.Date),
      steps: parseInt(row['Step count']),
      calories: parseInt(row['Calories (kcal)']),
      distance: parseFloat(row['Distance (km)']),
      activeMinutes: parseInt(row['Move Minutes'])
    })).filter(row => !isNaN(row.steps));

    return processedData;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
} 