"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleMeetButton({ onMeetLinkGenerated }) {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      initializeGoogleSignIn();
    } else {
      const timer = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const initializeGoogleSignIn = () => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });
    setIsGoogleLoaded(true);
  };

  const handleCredentialResponse = async (response) => {
    try {
      // Exchange the credential for an access token
      const result = await fetch("/api/google/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await result.json();

      if (data.meetLink) {
        onMeetLinkGenerated(data.meetLink);
      }
    } catch (error) {
      console.error("Error handling Google response:", error);
    }
  };

  const handleGoogleSignIn = () => {
    if (isGoogleLoaded) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <Button onClick={handleGoogleSignIn} disabled={!isGoogleLoaded}>
      Connect with Google Meet
    </Button>
  );
}
