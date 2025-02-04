import { NextResponse } from "next/server";
import axios from "axios";

const ZOOM_ACCOUNT_ID = process.env.NEXT_PUBLIC_ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET;

async function getServerToServerToken() {
  const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      'grant_type=account_credentials&account_id=' + ZOOM_ACCOUNT_ID,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const meetingData = await request.json();
    console.log('Received meeting data:', meetingData); // Debug log
    
    // Get server-to-server token
    const accessToken = await getServerToServerToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get Zoom access token" },
        { status: 500 }
      );
    }

    // Ensure required fields are present
    const zoomMeetingPayload = {
      topic: meetingData.topic || "New Meeting",
      type: 2, // Scheduled meeting
      start_time: meetingData.start_time || new Date().toISOString(),
      duration: meetingData.duration || 30,
      timezone: meetingData.timezone || "Asia/Kolkata",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        auto_recording: "none",
        waiting_room: false,
        ...meetingData.settings
      }
    };

    console.log('Sending to Zoom API:', zoomMeetingPayload); // Debug log

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      zoomMeetingPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Zoom API Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: error.response?.data?.message || "Failed to create Zoom meeting",
      },
      { status: error.response?.status || 500 }
    );
  }
}
