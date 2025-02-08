import { NextResponse } from "next/server";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
);

export async function POST(req) {
  try {
    const { credential } = await req.json();

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const { email } = ticket.getPayload();

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage"
    );

    // Set credentials
    oauth2Client.setCredentials({
      id_token: credential,
    });

    // Initialize Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create a new event with Google Meet
    const event = {
      summary: "Meeting",
      start: {
        dateTime: new Date().toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(Date.now() + 3600000).toISOString(),
        timeZone: "UTC",
      },
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      resource: event,
    });

    return NextResponse.json({ meetLink: response.data.hangoutLink });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Google" },
      { status: 500 }
    );
  }
}
