import { NextResponse } from 'next/server';

export function middleware(request) {
  // Allow public access to gallery endpoints
  if (request.nextUrl.pathname.startsWith('/api/gallery')) {
    return NextResponse.next();
  }

  // Skip authentication for other public routes
  if (request.nextUrl.pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  const apiKey = request.headers.get('x-api-key');
  
  // Check if API key is required for this route
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*'
}; 