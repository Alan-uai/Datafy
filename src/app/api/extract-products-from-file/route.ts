
import { NextRequest, NextResponse } from 'next/server';
import { addProduct } from '@/services/productService';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Dynamic imports for file parsing libraries
const getXlsx = () => import('xlsx');
const getMammoth = () => import('mammoth');
const getCsvParser = () => import('csv-parser').then(mod => mod.default);

// Initialize GoogleGenerativeAI (ensure GEMINI_API_KEY is securely handled, e.g., via environment variables)
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""); // Use environment variable

interface ExtractedProduct {
  produto: string;
  marca?: string;
  unidade?: string;
  validade?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const listId = formData.get('listId') as string;
    const userId = formData.get('userId') as string;

    console.log('Received form data:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileType: file?.type, 
      listId, 
      userId 
    });

    if (!file || !listId || !userId) {
      return NextResponse.json(
        { error: 'Arquivo, listId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedProducts: ExtractedProduct[] = [];
    
    try {
      const buffer = await file.arrayBuffer();
      console.log('File buffer created successfully, size:', buffer.byteLength);

    try {
        if (file.type === 'application/pdf') {
          console.log('Extracting from PDF using Gemini API...');
          extractedProducts = await extractFromPDF(buffer);
        } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          console.log('Extracting from Excel...');
          extractedProducts = await extractFromExcel(buffer);
        } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
          console.log('Extracting from Word...');
          extractedProducts = await extractFromWord(buffer);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          console.log('Extracting from CSV...');
          extractedProducts = await extractFromCSV(buffer);
        } else {
          console.log('Unsupported file type:', file.type);
          return NextResponse.json(
            { error: `Tipo de arquivo não suportado: ${file.type}` },
            { status: 400 }
          );
        }

        console.log(`Extracted ${extractedProducts.length} products from ${file.name}:`, extractedProducts);

        // Add products to Firebase
        const addedProducts = [];
        for (const productData of extractedProducts) {
          if (productData.produto && productData.produto.trim()) {
            try {
              const newProduct = await addProduct(userId, listId, {
                produto: productData.produto.trim(),
                marca: productData.marca?.trim() || '',
                unidade: productData.unidade?.trim() || '1',
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
          message: `${addedProducts.length} produto(s) adicionado(s) de ${file.name}`,
        });

      } catch (parseError) {
        console.error('Error parsing file:', parseError);
        return NextResponse.json(
          { error: `Erro ao processar arquivo: ${parseError?.message || 'Erro desconhecido'}` },
          { status: 500 }
        );
      }
    } catch (bufferError) {
      console.error('Error creating buffer from file:', bufferError);
      return NextResponse.json(
        { error: 'Erro ao ler o arquivo' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function extractFromPDF(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  try {
    const base64Data = Buffer.from(buffer).toString("base64");
    const contents = [
      { text: "Extract product information from this document. For each product, identify its name (produto), brand (marca), quantity (unidade), and expiration date (validade). If a quantity is not explicitly mentioned, assume '1'. If an expiration date is not found, leave it empty. Output the results as a JSON array of objects, like this: [{"produto": "Nome do Produto", "marca": "Marca", "unidade": "1", "validade": "YYYY-MM-DD"}]. Ensure dates are in YYYY-MM-DD format. If no products are found, return an empty array." },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ];

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();

    console.log("Gemini API Response (raw):", responseText);

    // Attempt to parse the JSON response from Gemini
    try {
      const parsedProducts: ExtractedProduct[] = JSON.parse(responseText);
      // Further validation/cleaning if necessary
      return parsedProducts;
    } catch (jsonParseError) {
      console.error("Error parsing JSON from Gemini response:", jsonParseError);
      // Fallback: if JSON parsing fails, try to extract from plain text if Gemini returns non-JSON
      return extractProductsFromText(responseText);
    }

  } catch (error) {
    console.error("Error calling Gemini API for PDF extraction:", error);
    throw new Error("Failed to extract products from PDF using AI.");
  }
}

async function extractFromExcel(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const XLSX = await getXlsx();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  const products: ExtractedProduct[] = [];
  
  // Skip header row and process data
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0 && row[0]) {
      products.push({
        produto: String(row[0]).trim(),
        marca: row[1] ? String(row[1]).trim() : '',
        unidade: row[2] ? String(row[2]).trim() : '1',
        validade: row[3] ? formatDate(String(row[3])) : '',
      });
    }
  }
  
  return products;
}

async function extractFromWord(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const mammoth = await getMammoth();
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  const text = result.value;
  
  return extractProductsFromText(text);
}

async function extractFromCSV(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const csvParser = await getCsvParser();
  const text = Buffer.from(buffer).toString('utf-8');
  const lines = text.split('
');
  const products: ExtractedProduct[] = [];
  
  // Skip header and process each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
      if (columns[0]) {
        products.push({
          produto: columns[0],
          marca: columns[1] || '',
          unidade: columns[2] || '1',
          validade: columns[3] ? formatDate(columns[3]) : '',
        });
      }
    }
  }
  
  return products;
}

function extractProductsFromText(text: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  const lines = text.split('
');
  
  // Common product keywords to help identify products
  const productKeywords = ['leite', 'pão', 'arroz', 'feijão', 'açúcar', 'sal', 'óleo', 'farinha', 'macarrão', 'biscoito', 'café', 'refrigerante', 'suco', 'água', 'carne', 'frango', 'peixe', 'queijo', 'presunto', 'margarina', 'manteiga', 'iogurte', 'verdura', 'fruta', 'tomate', 'cebola', 'alho', 'batata', 'cenoura'];
  
  // Date patterns
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})|(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g;
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 3) continue;
    
    // Check if line contains product-like content
    const lowerLine = cleanLine.toLowerCase();
    const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
    const hasProductPattern = /[a-záéíóúçàãõ\s]+(kg|g|ml|l|un|unid|pct|pacote|caixa|lata|garrafa|litro|quilo)/i.test(lowerLine);
    
    if (hasProductKeyword || hasProductPattern || (cleanLine.length > 3 && /^[a-záéíóúçàãõ\s\d\.]+$/i.test(cleanLine))) {
      // Extract date if present
      let validade = '';
      const dateMatch = cleanLine.match(datePattern);
      if (dateMatch) {
        validade = formatDate(dateMatch[0]);
      }
      
      // Extract product name (remove dates and common non-product words)
      let productName = cleanLine
        .replace(datePattern, '')
        .replace(/(validade|venc|exp|data|prazo)/gi, '')
        .replace(/\d+[\/\-]\d+[\/\-]\d+/g, '')
        .trim();
      
      if (productName && productName.length > 2) {
        products.push({
          produto: productName,
          marca: '',
          unidade: '1',
          validade: validade || '',
        });
      }
    }
  }
  
  return products;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Remove extra characters
  const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
  
  // Try to parse different date formats
  const dateFormats = [
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, // DD/MM/YY or DD-MM-YY
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
  ];
  
  for (const format of dateFormats) {
    const match = cleanDate.match(format);
    if (match) {
      if (format === dateFormats[2]) { // YYYY-MM-DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else { // DD/MM/YYYY or DD/MM/YY
        let year = match[3];
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
  }
  
  return '';
}
