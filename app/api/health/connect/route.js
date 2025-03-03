import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/config/FirebaseConfig';

export async function POST(request) {
  try {
    const { token } = await request.json();
    const db = getFirestore(app);

    // Store the token in Firebase
    await setDoc(doc(db, "googleFitTokens", request.user.id), {
      token,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting Google Fit:', error);
    return NextResponse.json({ error: 'Failed to connect Google Fit' }, { status: 500 });
  }
} 