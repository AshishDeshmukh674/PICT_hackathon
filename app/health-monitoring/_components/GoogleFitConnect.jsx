"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from 'react';

export default function GoogleFitConnect({ onConnect }) {
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read'
  ];

  useEffect(() => {
    // Load Google API Client Library
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = initializeGoogleApi;
    document.body.appendChild(script);
  }, []);

  const initializeGoogleApi = () => {
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        client_id: CLIENT_ID,
        scope: SCOPES.join(' ')
      });
    });
  };

  const handleConnect = async () => {
    try {
      const auth2 = window.gapi.auth2.getAuthInstance();
      const googleUser = await auth2.signIn();
      const authResponse = googleUser.getAuthResponse();
      
      // Send token to your backend
      const response = await fetch('/api/health/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: authResponse.access_token
        })
      });

      if (response.ok) {
        onConnect();
      }
    } catch (error) {
      console.error('Error connecting to Google Fit:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Connect to Google Fit</h2>
      <p className="text-gray-600 mb-6">
        Connect your Google Fit account to track your health and fitness data.
      </p>
      <Button onClick={handleConnect} className="bg-primary text-white">
        Connect Google Fit
      </Button>
    </div>
  );
} 