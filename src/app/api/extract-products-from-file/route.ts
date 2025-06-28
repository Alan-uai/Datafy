import { NextRequest, NextResponse } from 'next/server';
import { addProduct } from '@/services/productService';

interface ExtractedProduct {
  produto: string;
  marca: string;
  unidade: string;
  validade: string;
}

async function extractProductsFromPDF(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    const base64Data = Buffer.from(buffer).toString("base64");
    const contents = [
      { text: `Extract product information from this document. For each product, identify its name (produto), brand (marca), quantity (unidade), and expiration date (validade). If a quantity is not explicitly mentioned, assume '1'. If an expiration date is not found, leave it empty. Output the results as a JSON array of objects, like this: [{"produto": "Nome do Produto", "marca": "Marca", "unidade": "1", "validade": "YYYY-MM-DD"}]. Ensure dates are in YYYY-MM-DD format. If no products are found, return an empty array.` },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ];

    const result = await model.generateContent(contents);
    const responseText = result.response.text();

    console.log('Raw Gemini response:', responseText);

    // Clean the response to extract just the JSON array
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('No JSON array found in response');
      return [];
    }

    const jsonStr = jsonMatch[0];
    const products = JSON.parse(jsonStr);

    if (!Array.isArray(products)) {
      console.log('Response is not an array');
      return [];
    }

    return products.map((product: any) => ({
      produto: product.produto || '',
      marca: product.marca || '',
      unidade: product.unidade || '1',
      validade: product.validade || ''
    }));

  } catch (error) {
    console.error('Error extracting products from PDF:', error);
    return [];
  }
}

async function extractProductsFromCSV(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const text = Buffer.from(buffer).toString('utf-8');
  const lines = text.split('\n');
  const products: ExtractedProduct[] = [];

  // Skip header and process each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));

    if (columns.length >= 2) {
      products.push({
        produto: columns[0] || '',
        marca: columns[1] || '',
        unidade: columns[2] || '1',
        validade: columns[3] || ''
      });
    }
  }

  return products;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const listId = formData.get('listId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !listId || !userId) {
      return NextResponse.json(
        { error: 'Arquivo, listId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    let products: ExtractedProduct[] = [];

    if (file.type === 'application/pdf') {
      products = await extractProductsFromPDF(buffer);
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      products = await extractProductsFromCSV(buffer);
    } else {
        const supportedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const isExcel = file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const isWord = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx') || file.name.endsWith('.doc');

        if (isExcel) {
            const { extractFromExcel } = await import('@/utils/extract-excel');
            products = await extractFromExcel(buffer);
        } else if(isWord) {
             const { extractFromWord } = await import('@/utils/extract-word');
             products = await extractFromWord(buffer);
        }
        else {
          return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }
    }

    // Add products to Firebase
    const addedProducts = [];
    for (const productData of products) {
      if (productData.produto && productData.produto.trim()) {
        try {
          const newProduct = await addProduct(userId, listId, {
            produto: productData.produto.trim(),
            marca: productData.marca.trim(),
            unidade: productData.unidade.trim() || '1',
            validade: productData.validade || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          addedProducts.push(newProduct);
          console.log('Successfully added product:', newProduct);
        } catch (addError) {
          console.error(`Error adding product ${productData.produto}:`, addError);
        }
      }
    }

    return NextResponse.json({ 
        products: addedProducts,
        message: `${addedProducts.length} produto(s) adicionado(s) de ${file.name}`
     });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}