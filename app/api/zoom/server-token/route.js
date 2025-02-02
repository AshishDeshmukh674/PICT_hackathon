import axios from "axios";

export async function GET() {
  try {
    // Encode client credentials
    const credentials = Buffer.from(
      `${process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID}:${process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://zoom.us/oauth/token',
      new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: process.env.NEXT_PUBLIC_ZOOM_ACCOUNT_ID // Make sure to add this to .env.local
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Server token error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ 
        error: "Failed to get server token",
        details: error.response?.data || error.message 
      }), 
      { 
        status: error.response?.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 