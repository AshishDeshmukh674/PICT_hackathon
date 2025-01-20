import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
  try {
    const { refresh_token } = await request.json();

    const response = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
        client_id: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 401 }
    );
  }
}
