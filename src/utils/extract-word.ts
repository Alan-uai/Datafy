
import type { ExtractedProduct } from '../types';

export async function extractFromWord(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  try {
    // For now, return empty array until we implement DOCX parsing
    // You could use libraries like 'docx' or 'mammoth' here
    console.log('Word extraction not yet implemented');
    return [];
  } catch (error) {
    console.error('Error extracting from Word:', error);
    return [];
  }
}

interface ExtractedProduct {
  produto: string;
  marca: string;
  unidade: string;
  validade: string;
}
