import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
  try {
    const { code } = await request.json();

    const response = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_BASE_URL + "/create-meeting",
        client_id: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Failed to exchange code for token" },
      { status: 400 }
    );
  }
}
