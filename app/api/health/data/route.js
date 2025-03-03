import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/config/FirebaseConfig';

const fitness = google.fitness('v1');

export async function GET(request) {
  try {
    const db = getFirestore(app);
    const tokenDoc = await getDoc(doc(db, "googleFitTokens", request.user.id));
    
    if (!tokenDoc.exists()) {
      return NextResponse.json({ error: 'Not connected to Google Fit' }, { status: 401 });
    }

    const token = tokenDoc.data().token;

    // Configure Google API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    // Get last 24 hours of data
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Fetch steps data
    const stepsData = await fitness.users.dataset.aggregate({
      auth,
      userId: 'me',
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta'
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: dayAgo,
        endTimeMillis: now
      }
    });

    // Process and return the data
    const healthData = {
      steps: calculateSteps(stepsData.data),
      // Add other metrics processing here
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}

function calculateSteps(data) {
  // Process the raw Google Fit data to get total steps
  return data.bucket.reduce((total, bucket) => {
    const steps = bucket.dataset[0].point[0]?.value[0]?.intVal || 0;
    return total + steps;
  }, 0);
} 