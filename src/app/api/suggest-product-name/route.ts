import { NextRequest, NextResponse } from 'next/server';
import { suggestProductName } from '@/ai/flows/suggest-product-name-flow';

export async function POST(req: NextRequest) {
  try {
    const { productName } = await req.json();

    if (!productName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const result = await suggestProductName.run({ productName });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in suggest-product-name API route:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}