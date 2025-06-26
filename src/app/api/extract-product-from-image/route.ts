// ===== OPÇÃO 1: API ROUTE (Recomendado) =====
// app/api/extract-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from '@genkit-ai/flow';
import extractProductFlow from '@/ai/flows/extract-product-from-image-flow';

export async function POST(request: NextRequest) {
  try {
    const { base64Image, imageType } = await request.json();
    
    if (!base64Image) {
      return NextResponse.json(
        { error: 'Base64 image is required' },
        { status: 400 }
      );
    }
    
    // Usar runFlow para executar o flow
    const result = await runFlow(extractProductFlow, {
      base64Image,
      imageType: imageType || 'image/jpeg'
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in extract products API:', error);
    return NextResponse.json(
      { error: 'Failed to extract products from image', details: error.message },
      { status: 500 }
    );
  }
}