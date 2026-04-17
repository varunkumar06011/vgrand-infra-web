import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !businessId) {
    console.error('Instagram environment variables missing');
    return NextResponse.json({ error: 'Instagram credentials not configured' }, { status: 500 });
  }

  try {
    // Fetch latest 12 media items
    // fields: id, caption, media_type, media_url, permalink, thumbnail_url, timestamp
    const url = `https://graph.facebook.com/v19.0/${businessId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=${token}`;
    
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Instagram API Error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to fetch from Instagram', 
        details: errorData.error?.message || 'Unknown error' 
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.data) {
      return NextResponse.json([], { status: 200 });
    }

    // Transform and truncate
    const posts = data.data.map((post: any) => ({
      id: post.id,
      image: (post.media_type === 'VIDEO' || post.media_type === 'REELS') ? post.thumbnail_url : post.media_url,
      caption: post.caption ? (post.caption.length > 100 ? post.caption.substring(0, 100) + '...' : post.caption) : '',
      link: post.permalink,
      type: post.media_type,
      timestamp: post.timestamp
    }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Instagram fetch catch error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching Instagram feed' }, { status: 500 });
  }
}

/**
 * TOKEN REFRESH INSTRUCTIONS:
 * Long-lived User Access Tokens are valid for 60 days.
 * They can be refreshed BEFORE they expire to get another 60 days.
 * End-point: GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={long-lived-access-token}
 * 
 * I have created a route at /api/refresh-instagram-token to automate this.
 * Access that route manually once every 50 days.
 */
