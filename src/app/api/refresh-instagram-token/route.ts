import { NextResponse } from 'next/server';

/**
 * Manual Token Refresh Route
 * Hit this endpoint (once every 50 days) to refresh the long-lived Instagram access token.
 * 
 * Logic based on Instagram Graph API refresh requirements.
 * Note: Long-lived tokens expire every 60 days but can be refreshed after 24 hours.
 */
export async function GET() {
  const oldToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!oldToken) {
    console.error('INSTAGRAM_ACCESS_TOKEN missing in environment variables');
    return NextResponse.json({ error: 'Current access token not configured in .env.local' }, { status: 500 });
  }

  try {
    // Construct the refresh URL
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${oldToken}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Instagram Token Refresh Error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to refresh token', 
        details: errorData.error_message || 'Unknown error' 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Log the new token to console as requested
    console.log('====================================================');
    console.log('INSTAGRAM ACCESS TOKEN REFRESHED SUCCESSFULLY');
    console.log('NEW TOKEN:', data.access_token);
    console.log('EXPIRES IN:', data.expires_in, 'seconds');
    console.log('Update your .env.local file with this new token.');
    console.log('====================================================');

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully. Check your server console for the new token.',
      expires_in: data.expires_in
    });
  } catch (error) {
    console.error('Catch error during token refresh:', error);
    return NextResponse.json({ error: 'Internal server error while refreshing Instagram token' }, { status: 500 });
  }
}
