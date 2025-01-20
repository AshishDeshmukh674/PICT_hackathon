import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
  try {
    const { accessToken, meetingData } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      meetingData,
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
