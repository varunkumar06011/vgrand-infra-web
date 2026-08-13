import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

/**
 * Manual Token Refresh Route — Admin only.
 * Hit this endpoint (once every 50 days) to refresh the long-lived Instagram access token.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const oldToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!oldToken) {
    console.error('INSTAGRAM_ACCESS_TOKEN missing in environment variables');
    return NextResponse.json(
      { error: 'Instagram token not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${oldToken}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Instagram Token Refresh Error:', errorData.error_message || 'Unknown');
      return NextResponse.json({ 
        error: 'Failed to refresh Instagram token.' 
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log('Instagram token refreshed. Expires in:', data.expires_in, 'seconds');

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully. Update your .env.local with the new token from the server logs.',
      expires_in: data.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal server error while refreshing Instagram token.' },
      { status: 500 }
    );
  }
}
