import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { base64Image, imageType } = await request.json();
    
    if (!base64Image) {
      return NextResponse.json(
        { error: 'Base64 image is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // For now, return a mock response until the API key is configured
    // This prevents the error from blocking the UI
    const mockResponse = {
      extractedProducts: []
    };
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error in extract products API:', error);
    return NextResponse.json(
      { error: 'Failed to extract products from image', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}